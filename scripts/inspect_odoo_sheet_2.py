import os
import sys
import gspread
from google.oauth2.service_account import Credentials

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID_2 = "18oHqPuo6BhAgI5e_GLSSps5fSc_DpzYEYofgPKxBv9o"
BASE_DIR = r"d:\infonix"

candidate_creds = [
    os.path.join(BASE_DIR, "splendid-planet-504710-d0-d1bee6e83a75.json"),
    os.path.join(BASE_DIR, "splendid-planet-504710-d0-9231c038688c.json"),
    os.path.join(BASE_DIR, "credentials.json")
]

creds_path = None
for p in candidate_creds:
    if os.path.exists(p):
        creds_path = p
        break

scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

try:
    creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(SPREADSHEET_ID_2)
    print(f"\n[SUCCESS] Connected to Odoo Leads Sheet 2: '{sheet.title}'")
    for ws in sheet.worksheets():
        print(f"  - Worksheet: '{ws.title}' | Rows: {len(ws.get_all_values())}")
except Exception as e:
    print(f"[!] Error accessing Sheet 2: {e}")
