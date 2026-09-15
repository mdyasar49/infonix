import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

EXAMPLE_SPREADSHEET_ID = "1CbW9pPLyEtyl8cBpjNDcOEuLLFrgK5LFF8xoPRSMbpw"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
)
service = build("sheets", "v4", credentials=creds)

try:
    meta = service.spreadsheets().get(spreadsheetId=EXAMPLE_SPREADSHEET_ID).execute()
    title = meta.get("properties", {}).get("title")
    print(f"[✓] Connected to Example Spreadsheet: '{title}'")
    sheets = meta.get("sheets", [])
    for s in sheets:
        p = s.get("properties", {})
        t = p.get("title")
        sid = p.get("sheetId")
        print(f"\nTab: '{t}' (ID: {sid})")
        res = service.spreadsheets().values().get(
            spreadsheetId=EXAMPLE_SPREADSHEET_ID,
            range=f"'{t}'!A1:Z5"
        ).execute()
        vals = res.get("values", [])
        if vals:
            print(f"  Header ({len(vals[0])} columns):")
            for idx, col in enumerate(vals[0], start=1):
                print(f"    {idx}. {col}")
            if len(vals) > 1:
                print(f"  Sample Row 1: {vals[1]}")
        else:
            print("  Tab is empty.")
except Exception as e:
    print("[!] Error reading example spreadsheet:", e)
