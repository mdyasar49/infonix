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

for tab in ["Freelancer Leads", "Upwork Leads"]:
    res = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{tab}'!A1:H6"
    ).execute()
    print("=" * 110)
    print(f" 📊 LIVE VIEW: '{tab}'")
    print("=" * 110)
    for r in res.get("values", []):
        d = r[0] if len(r) > 0 else ""
        src = r[1] if len(r) > 1 else ""
        comp = r[2][:25] if len(r) > 2 else ""
        email = r[3][:28] if len(r) > 3 else ""
        phone = r[4][:16] if len(r) > 4 else ""
        cust = r[6][:20] if len(r) > 6 else ""
        print(f"{d:<11} | {src:<10} | {comp:<26} | {email:<29} | {phone:<17} | {cust:<20}")
