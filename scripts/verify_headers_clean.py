import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"
creds = service_account.Credentials.from_service_account_file(
    r"credentials.json",
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)
meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()

print("=" * 95)
print(" 📊 ALL SPREADSHEET TABS VERIFICATION: FIRST 4 COLUMNS (A-D)")
print("=" * 95)
for t in meta["sheets"]:
    name = t["properties"]["title"]
    res = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{name}'!A1:D1"
    ).execute()
    vals = res.get("values", [[]])[0]
    print(f"📌 Tab: '{name:<22}' -> Cols A-D: {vals}")
