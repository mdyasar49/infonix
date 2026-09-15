"""
Clean, deduplicate, and professionally format the Single Master Tab in Google Sheets.
"""

import os
import sys
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SPREADSHEET_ID = "16OmRTUts8o6gmd8Aweox90kHjzrjfWrWcZtfOukDh38"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")

def clean_and_format_single_tab():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    )
    service = build("sheets", "v4", credentials=creds)
    
    # 1. Fetch current values from 'All Leads Master'
    meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    sheet = meta["sheets"][0]
    sheet_id = sheet["properties"]["sheetId"]
    tab_name = sheet["properties"]["title"]
    
    result = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{tab_name}'!A1:Z500"
    ).execute()
    
    values = result.get("values", [])
    if not values:
        print("Sheet is empty!")
        return
        
    headers = values[0]
    rows = values[1:]
    
    df = pd.DataFrame(rows, columns=headers[:len(rows[0])])
    
    # Deduplicate by Website Domain or Company Name
    if "Website Domain" in df.columns:
        df = df.drop_duplicates(subset=["Website Domain"], keep="first")
    elif "Company Name" in df.columns:
        df = df.drop_duplicates(subset=["Company Name"], keep="first")
        
    # Sort nicely by Region, Country, Company Name
    sort_cols = [c for c in ["Region", "Country", "Company Name"] if c in df.columns]
    if sort_cols:
        df = df.sort_values(by=sort_cols)
        
    df = df.fillna("")
    clean_data = [headers] + df.values.tolist()
    
    # 2. Clear and write deduplicated clean rows
    service.spreadsheets().values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{tab_name}'!A1:Z500"
    ).execute()
    
    service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{tab_name}'!A1",
        valueInputOption="USER_ENTERED",
        body={"values": clean_data}
    ).execute()
    
    # 3. Apply professional styles: Dark Blue Header (#1A365D), White Bold Text, Frozen Header, Auto Resize
    num_cols = len(headers)
    num_rows = len(clean_data)
    
    format_requests = [
        # Frozen top header row
        {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": sheet_id,
                    "gridProperties": {
                        "frozenRowCount": 1
                    }
                },
                "fields": "gridProperties.frozenRowCount"
            }
        },
        # Header Styling
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
                        "backgroundColor": {"red": 0.10, "green": 0.21, "blue": 0.36}, # Dark Blue #1A365D
                        "textFormat": {
                            "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0},
                            "fontSize": 10,
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
        # Auto-resize columns to fit content
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
    
    print(f"[✓] Successfully cleaned, deduplicated ({len(df)} distinct leads), styled with Dark Blue header & auto-resized columns!")

if __name__ == "__main__":
    clean_and_format_single_tab()
