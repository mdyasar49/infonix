import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"
creds = service_account.Credentials.from_service_account_file(
    r"d:\infonix\LinkedIn-Data-Scraping\splendid-planet-504710-d0-d1bee6e83a75.json",
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)

res = service.spreadsheets().values().get(
    spreadsheetId=SPREADSHEET_ID,
    range="'LinkedIn Leads'!A1:H10"
).execute()

print("=" * 100)
print(f" 📊 LIVE VIEW OF 'LinkedIn Leads' IN 'Business_Leads' GOOGLE SHEET")
print("=" * 100)
for r in res.get("values", []):
    print(f"{r[0]:<12} | {r[1]:<8} | {r[2]:<22} | {r[3]:<30} | {r[4]:<16} | {r[6]:<25}")
