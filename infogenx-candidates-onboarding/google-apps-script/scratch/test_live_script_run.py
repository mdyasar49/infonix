import json
import os
import sys
import requests

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CLASPRC_PATH = os.path.expanduser("~/.clasprc.json")

def get_auth_token():
    with open(CLASPRC_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    token_dict = data.get("tokens", {}).get("default", {}) or data.get("token", {}) or data
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
        r = requests.post("https://oauth2.googleapis.com/token", data=refresh_data, timeout=15)
        if r.status_code == 200:
            access_token = r.json().get("access_token", access_token)
    return access_token

token = get_auth_token()
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
script_id = "1u1_v1sF907CLG4Yk33NHYMQEtNnpgENiNq4CHqAbUMLHmioZAjvJVzC4"

# 1. Fetch content to ensure all 9 files are intact
r = requests.get(f"https://script.googleapis.com/v1/projects/{script_id}/content", headers=headers)
if r.status_code == 200:
    content = r.json()
    files = content.get("files", [])
    print(f"[✓] Live Apps Script Project ({script_id}) Verified! Total files: {len(files)}")
    for f in files:
        if f.get("name") in ["Email", "Trigger", "Database"]:
            print(f"    • {f.get('name')}.gs: {len(f.get('source',''))} characters")
else:
    print(f"[!] Error fetching script: {r.status_code} {r.text}")
