import json
import sys
import os
import requests

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
headers = {"Authorization": f"Bearer {token}"}
script_id = "1u1_v1sF907CLG4Yk33NHYMQEtNnpgENiNq4CHqAbUMLHmioZAjvJVzC4"

resp = requests.get(f"https://script.googleapis.com/v1/projects/{script_id}/content", headers=headers)
if resp.status_code == 200:
    content = resp.json()
    files = content.get("files", [])
    print(f"Project ID: {script_id}")
    print(f"Total files in Apps Script Project: {len(files)}")
    for f in files:
        name = f.get("name")
        ftype = f.get("type")
        size = len(f.get("source", ""))
        print(f"  - File: {name}.{ftype.lower()} ({size} chars)")
        if name == "Email":
            print("\n--- Email.gs Content Preview ---")
            lines = f.get("source", "").splitlines()
            for i, line in enumerate(lines[:30], 1):
                print(f"{i:02d}: {line}")
            print("--------------------------------\n")
else:
    print(f"Error fetching script content: {resp.status_code} {resp.text}")
