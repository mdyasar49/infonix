import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")
SPREADSHEET_ID = "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)

res = service.spreadsheets().values().get(spreadsheetId=SPREADSHEET_ID, range="'Upwork Leads'!A1:AE10").execute()
rows = res.get("values", [])

headers = rows[0] if rows else []
print(f"Upwork Leads total rows: {len(rows)}")

for idx, r in enumerate(rows[1:], 1):
    print(f"\nRow #{idx}:")
    for c_idx, h in enumerate(headers):
        v = r[c_idx] if c_idx < len(r) else "<EMPTY>"
        print(f"  [{c_idx+1:02d}] {h:<45} : {v}")
