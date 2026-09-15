import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sa_file = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(sa_file):
    sa_file = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")

creds = service_account.Credentials.from_service_account_file(
    sa_file,
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)

tabs = ["Upwork Leads", "Freelancer Leads", "LinkedIn Leads", "Facebook Leads"]

for tab in tabs:
    print("=" * 100)
    print(f" 🔍 INSPECTING LIVE DATA IN TAB: '{tab}'")
    print("=" * 100)
    res = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{tab}'!A1:Z6"
    ).execute()
    rows = res.get("values", [])
    if not rows:
        print("Empty tab!")
        continue
    headers = rows[0]
    print(f"Headers (first 6): {headers[:6]}\n")
    for idx, r in enumerate(rows[1:], 1):
        scraped_dt = r[0] if len(r) > 0 else ""
        post_dt = r[1] if len(r) > 1 else ""
        post_link = r[2] if len(r) > 2 else ""
        page_link = r[3] if len(r) > 3 else ""
        company = r[5] if len(r) > 5 else (r[4] if len(r) > 4 else "")
        print(f"Row #{idx}:")
        print(f"  📅 Scraped Date : {scraped_dt}")
        print(f"  📅 Post Date    : {post_dt}")
        print(f"  🔗 Post Link    : {post_link}")
        print(f"  🌐 Page Link    : {page_link}")
        print(f"  🏢 Company/Job  : {company}\n")
