import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIRECT_CREDS_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(DIRECT_CREDS_FILE):
    DIRECT_CREDS_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")

creds = service_account.Credentials.from_service_account_file(
    DIRECT_CREDS_FILE,
    scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)
meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()

print("=" * 80)
print(f"[✓] Google Spreadsheet: '{meta.get('properties', {}).get('title')}'")
print(f"    URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")
print("=" * 80)

for s in meta.get("sheets", []):
    t = s.get("properties", {}).get("title")
    sid = s.get("properties", {}).get("sheetId")
    range_name = f"'{t}'!A1:Z5"
    res = service.spreadsheets().values().get(spreadsheetId=SPREADSHEET_ID, range=range_name).execute()
    vals = res.get("values", [])
    headers = vals[0] if vals else []
    print(f"  - Tab: '{t}' (ID: {sid})")
    print(f"    Headers ({len(headers)} cols): {headers[:5]}...")
    print(f"    Preview Rows: {len(vals)}")
