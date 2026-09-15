import json
import sys
import os
import requests
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

TARGET_IDS = [
    "1KCvVM5_9iTYM484tL7Y2TeZq4QFR6EeA7xMpSwLnMolNTXQk3L_PBPww",
    "1gBRtVeDLmPOU6M0NIqwNeUuPAvXcsp3nM8CkCYBcnt7reaIio2WPyBig",
    "1OEQHX65jAAkKmmhBvr73cZZUstCkgetZjjcTwI_weP8kay2u3XVuB40p",
    "1u1_v1sF907CLG4Yk33NHYMQEtNnpgENiNq4CHqAbUMLHmioZAjvJVzC4"
]

LOCAL_DIR = Path(__file__).parent
CLASPRC_PATH = Path(os.path.expanduser("~/.clasprc.json"))

def get_auth_token():
    with open(CLASPRC_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    token_dict = data.get("tokens", {}).get("default", {})
    if not token_dict and "token" in data:
        token_dict = data.get("token", {})
    if not token_dict:
        token_dict = data
        
    access_token = token_dict.get("access_token")
    refresh_token = token_dict.get("refresh_token")
    client_id = token_dict.get("client_id")
    client_secret = token_dict.get("client_secret")

    if refresh_token and client_id and client_secret:
        refresh_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        try:
            r = requests.post("https://oauth2.googleapis.com/token", data=refresh_data, timeout=15)
            if r.status_code == 200:
                access_token = r.json().get("access_token", access_token)
        except Exception as e:
            print(f"Refresh error: {e}")
            
    return access_token

def push_local_to_target():
    token = get_auth_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Build files list from LOCAL_DIR
    files = []
    
    # 1. Manifest
    manifest_path = LOCAL_DIR / "appsscript.json"
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as mf:
            files.append({
                "name": "appsscript",
                "type": "JSON",
                "source": mf.read()
            })

    # 2. Server JS files
    for gs_file in LOCAL_DIR.glob("*.gs"):
        name = gs_file.stem
        with open(gs_file, "r", encoding="utf-8") as gf:
            content = gf.read()
            files.append({
                "name": name,
                "type": "SERVER_JS",
                "source": content
            })

    # 3. HTML files
    for html_file in LOCAL_DIR.glob("*.html"):
        name = html_file.stem
        with open(html_file, "r", encoding="utf-8") as hf:
            content = hf.read()
            files.append({
                "name": name,
                "type": "HTML",
                "source": content
            })

    print(f"[*] Prepared {len(files)} files to push:")
    for f in files:
        print(f"    - {f['name']} ({f['type']}) [{len(f['source'])} chars]")

    payload = {"files": files}

    for tid in TARGET_IDS:
        print(f"\n[*] Pushing to Target Project: {tid}...", flush=True)
        put_url = f"https://script.googleapis.com/v1/projects/{tid}/content"
        try:
            resp = requests.put(put_url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                print(f"    ✅ [SUCCESS] Updated {tid} successfully!", flush=True)
            else:
                print(f"    ❌ [ERROR] HTTP {resp.status_code}: {resp.text}", flush=True)
        except Exception as ex:
            print(f"    ❌ Request Exception: {ex}", flush=True)

    print("\n" + "=" * 60)
    print("🎉 ALL TARGET PROJECTS UPDATED AND CONFIGURED AUTOMATICALLY!")
    print("=" * 60)

if __name__ == "__main__":
    push_local_to_target()
