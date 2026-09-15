import os
import json
import sys
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "16OmRTUts8o6gmd8Aweox90kHjzrjfWrWcZtfOukDh38"

creds_files = [
    r"credentials.json",
    r"d:\infonix\splendid-planet-504710-d0-9231c038688c.json",
    r"d:\infonix\internship_outreach_automation_full\credentials\token.json"
]

def get_sheets_service():
    for cf in creds_files:
        if not os.path.exists(cf):
            continue
        print(f"[*] Trying credentials: {os.path.basename(cf)}")
        try:
            if cf.endswith("token.json"):
                creds = Credentials.from_authorized_user_file(
                    cf, scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
                )
            else:
                creds = service_account.Credentials.from_service_account_file(
                    cf, scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
                )
            service = build("sheets", "v4", credentials=creds)
            meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
            print(f"[✓] Connected successfully! Title: {meta.get('properties', {}).get('title')}")
            return service, meta
        except Exception as e:
            print(f"[-] Failed with {os.path.basename(cf)}: {e}")
    return None, None

def main():
    service, meta = get_sheets_service()
    if not service:
        print("[!] Could not connect to Google Spreadsheet. Please check permissions.")
        return

    sheets = meta.get("sheets", [])
    print(f"\nFound {len(sheets)} tabs:")
    for s in sheets:
        p = s.get("properties", {})
        print(f" - Title: '{p.get('title')}' | Sheet ID: {p.get('sheetId')} | Index: {p.get('index')}")

if __name__ == "__main__":
    main()
