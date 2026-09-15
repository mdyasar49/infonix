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

ZOHO_CRM_HEADERS = [
    "Scraped Date",
    "Post Date / Posted Date",
    "Post Link / Direct Post URL",
    "Page Link / Profile Page URL",
    "Lead Source",
    "Company",
    "Company Founded Year",
    "Account Created Year",
    "First Name",
    "Last Name",
    "Customer Name",
    "Designation / Title",
    "Email",
    "Phone Number",
    "Mobile Number",
    "Industry",
    "Company Size",
    "Key Technologies / Skills",
    "Lead Status",
    "Rating",
    "Annual Revenue / Budget",
    "Street",
    "City",
    "State",
    "Country",
    "Website / URL",
    "Media Type (Image / Video / Reel / Flyer)",
    "Data Extracted From",
    "Lead Added By",
    "CRM_Synced",
    "Notes / Description (OCR & Video Analysis Insights)"
]

meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
for tab in meta.get("sheets", []):
    t_name = tab["properties"]["title"]
    sheet_id = tab["properties"]["sheetId"]
    
    # Read row 1
    res = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{t_name}'!A1:AD1"
    ).execute()
    h = res.get("values", [[]])[0]
    
    # Update row 1 header if not matching
    if h != ZOHO_CRM_HEADERS:
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{t_name}'!A1",
            valueInputOption="USER_ENTERED",
            body={"values": [ZOHO_CRM_HEADERS]}
        ).execute()
        print(f"[✓] Updated tab '{t_name}' headers to 30 Enterprise Fields!")
        
        # Format header with Royal Blue background #1A73E8
        num_cols = len(ZOHO_CRM_HEADERS)
        format_requests = [
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": num_cols
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": {"red": 0.10196, "green": 0.45098, "blue": 0.9098},
                            "textFormat": {
                                "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0},
                                "fontSize": 11,
                                "bold": True
                            },
                            "horizontalAlignment": "CENTER",
                            "verticalAlignment": "MIDDLE",
                            "wrapStrategy": "CLIP"
                        }
                    },
                    "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)"
                }
            },
            {
                "autoResizeDimensions": {
                    "dimensions": {
                        "sheetId": sheet_id,
                        "dimension": "COLUMNS",
                        "startIndex": 0,
                        "endIndex": num_cols
                    }
                }
            }
        ]
        service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": format_requests}
        ).execute()

print("\n🎉 ALL SPREADSHEET TABS UPGRADED TO 30 ENTERPRISE FIELDS WITH POST DATE & POST LINK!")
