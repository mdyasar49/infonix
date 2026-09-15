"""
Merge all tabs in the target Google Sheet into a single unified Master tab.
"""

import os
import sys
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "..", "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "..", "splendid-planet-504710-d0-d1bee6e83a75.json")

def merge_all_tabs():
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"[-] Service account file not found: {SERVICE_ACCOUNT_FILE}")
        return

    print("=" * 80)
    print(" 🚀 GOOGLE SHEET SINGLE-TAB CONSOLIDATION PIPELINE")
    print("=" * 80)
    
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    )
    
    service = build("sheets", "v4", credentials=creds)
    
    # 1. Fetch metadata
    meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    title = meta.get("properties", {}).get("title")
    sheets = meta.get("sheets", [])
    
    print(f"[✓] Connected to Spreadsheet: '{title}'")
    print(f"[*] Found {len(sheets)} tabs:")
    for s in sheets:
        props = s.get("properties", {})
        print(f"    - '{props.get('title')}' (ID: {props.get('sheetId')})")
        
    # 2. Extract data from all tabs
    all_rows = []
    canonical_headers = []
    
    for s in sheets:
        tab_name = s.get("properties", {}).get("title")
        sheet_id = s.get("properties", {}).get("sheetId")
        
        # Read range
        range_name = f"'{tab_name}'!A1:Z5000"
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID, range=range_name
        ).execute()
        
        values = result.get("values", [])
        if not values:
            print(f"[-] Tab '{tab_name}' is empty, skipping.")
            continue
            
        header = values[0]
        rows = values[1:]
        print(f"[+] Tab '{tab_name}': {len(rows)} data rows found.")
        
        if not canonical_headers:
            canonical_headers = header
            # Add Source Tab column if not present
            if "Source Tab" not in canonical_headers:
                canonical_headers.append("Source Tab")
        
        for r in rows:
            # Pad row to match header length
            row_dict = dict(zip(header, r))
            row_dict["Source Tab"] = tab_name
            all_rows.append(row_dict)
            
    print(f"\n[✓] Total combined rows across all tabs: {len(all_rows)}")
    
    # 3. Create DataFrame and deduplicate if necessary
    df = pd.DataFrame(all_rows)
    for col in canonical_headers:
        if col not in df.columns:
            df[col] = ""
    df = df[canonical_headers]
    df = df.fillna("")
    
    print(f"[✓] Final Consolidated Schema: {len(df.columns)} columns, {len(df)} rows.")
    
    # 4. Prepare Single Tab update
    # Create or rename first sheet to "All Leads Master"
    primary_tab_name = "All Leads Master"
    
    # Check if primary tab already exists
    existing_primary = next((s for s in sheets if s.get("properties", {}).get("title") == primary_tab_name), None)
    
    requests = []
    if not existing_primary:
        # Add primary sheet
        requests.append({
            "addSheet": {
                "properties": {
                    "title": primary_tab_name,
                    "gridProperties": {
                        "frozenRowCount": 1
                    }
                }
            }
        })
        res = service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": requests}
        ).execute()
        new_sheet_id = res["replies"][0]["addSheet"]["properties"]["sheetId"]
    else:
        new_sheet_id = existing_primary["properties"]["sheetId"]

    # 5. Populate All Data into Primary Tab
    sheet_data = [canonical_headers] + df.values.tolist()
    service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{primary_tab_name}'!A1",
        valueInputOption="USER_ENTERED",
        body={"values": sheet_data}
    ).execute()
    print(f"[✓] Successfully wrote all {len(sheet_data)} rows to single tab '{primary_tab_name}'!")
    
    # 6. Delete other redundant tabs
    # Refresh metadata to get all current sheet IDs
    meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    delete_requests = []
    for s in meta.get("sheets", []):
        sid = s.get("properties", {}).get("sheetId")
        stitle = s.get("properties", {}).get("title")
        if stitle != primary_tab_name:
            delete_requests.append({
                "deleteSheet": {
                    "sheetId": sid
                }
            })
            
    if delete_requests:
        service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": delete_requests}
        ).execute()
        print(f"[✓] Successfully removed {len(delete_requests)} redundant tabs!")
        
    print("\n" + "=" * 80)
    print("🎉 GOOGLE SHEET CONSOLIDATION 100% COMPLETE! SINGLE TAB ACTIVE.")
    print("=" * 80)

if __name__ == "__main__":
    merge_all_tabs()
