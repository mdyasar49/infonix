import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sa_file = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(sa_file):
    sa_file = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")
creds = service_account.Credentials.from_service_account_file(
    sa_file,
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)

sheets_to_inspect = [
    ("Multi-Tab Scraper Sheet (Upwork, Freelancer, LinkedIn, Social Media)", "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"),
    ("Google Search Leads", "1CbW9pPLyEtyl8cBpjNDcOEuLLFrgK5LFF8xoPRSMbpw"),
    ("Internship Master Sheet", "1VGXRW9iJVwESvqNWQV89S_LPy1uMJCGaElHx_VZ5_8s"),
]

for label, sheet_id in sheets_to_inspect:
    print("=" * 90)
    print(f" 📊 SHEET: {label} (ID: {sheet_id})")
    print("=" * 90)
    try:
        meta = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        for tab in meta.get("sheets", []):
            t_name = tab["properties"]["title"]
            res = service.spreadsheets().values().get(
                spreadsheetId=sheet_id,
                range=f"'{t_name}'!A1:Z1"
            ).execute()
            headers = res.get("values", [[]])[0]
            print(f"📌 Tab: '{t_name}' ({len(headers)} cols)")
            print(f"   Headers: {headers}\n")
    except Exception as e:
        print(f"❌ Error reading {label}: {e}")
