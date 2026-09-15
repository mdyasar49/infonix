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

for tab in ["Freelancer Leads", "Upwork Leads", "LinkedIn Leads"]:
    res = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{tab}'!A1:V4"
    ).execute()
    vals = res.get("values", [])
    headers = vals[0] if vals else []
    print("=" * 120)
    print(f" 📊 LIVE VIEW: '{tab}' (Total Columns: {len(headers)})")
    print("   Columns:", ", ".join(headers[:8]), "...")
    print("=" * 120)
    for r in vals[1:]:
        print(f"Company: {r[2][:25]:<25} | Name: {r[5]:<20} | Email: {r[7]:<28} | Phone: {r[8]:<16} | City/Country: {r[15]}, {r[17]}")
