import os
import sys
import json
import gspread
from google.oauth2.service_account import Credentials

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "1X_8LbsHisyvoCfjSuTX5yRVsRgXPDEmu3W5RWXuAC1o"

# Look for credentials file
workspace_dir = r"d:\infonix"
candidate_creds = [
    os.path.join(workspace_dir, "splendid-planet-504710-d0-d1bee6e83a75.json"),
    os.path.join(workspace_dir, "splendid-planet-504710-d0-9231c038688c.json"),
    os.path.join(workspace_dir, "credentials.json"),
    os.path.join(workspace_dir, "Data-Scraping", "credentials.json")
]

creds_path = None
for p in candidate_creds:
    if os.path.exists(p):
        creds_path = p
        break

print(f"Using Credentials File: {creds_path}")

scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

try:
    creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
    client = gspread.authorize(creds)
    sheet = client.open_by_key(SPREADSHEET_ID)
    print(f"\n[SUCCESS] Connected to Google Sheet: '{sheet.title}'")
    print("Worksheets present:")
    for ws in sheet.worksheets():
        headers = ws.row_values(1)
        row_count = ws.row_count
        val_rows = len(ws.get_all_values())
        print(f"  - Sheet Name: '{ws.title}' | Total Rows: {val_rows} | Headers: {headers[:10]}")
except Exception as e:
    print(f"[!] Error accessing Google Sheet: {e}")
