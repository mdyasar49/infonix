import os
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "159_v7B32KfE2ZFAf60m15usX45Xnwk6P81-wUeEiWu4"
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
    meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    print("[✓] Connected! Sheet Title:", meta.get("properties", {}).get("title"))
    for s in meta.get("sheets", []):
        p = s.get("properties", {})
        title = p.get("title")
        sheet_id = p.get("sheetId")
        print(f"  - Tab: '{title}' (ID: {sheet_id})")
        
        # Read header / first few rows
        res = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{title}'!A1:Z5"
        ).execute()
        vals = res.get("values", [])
        if vals:
            print(f"    Headers ({len(vals[0])} cols): {vals[0]}")
            print(f"    Total sample rows: {len(vals)}")
        else:
            print("    Tab is currently empty.")
except Exception as e:
    print("[!] Error connecting:", e)
