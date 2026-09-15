import os
import sys
import pandas as pd
from keyword_location_scraper import export_to_excel_with_tabs, sync_to_google_sheets, TARGET_SPREADSHEET_ID

def main():
    excel_path = "output/scraped_leads_by_keyword.xlsx"
    if not os.path.exists(excel_path):
        print("Excel file not found!")
        return

    xls = pd.ExcelFile(excel_path)
    all_leads = []
    
    if "All Leads Master" in xls.sheet_names:
        df_master = pd.read_excel(excel_path, sheet_name="All Leads Master")
        all_leads = df_master.to_dict(orient="records")
    
    keywords = [
        "digital marketing",
        "digital marketing executive",
        "digital marketing consultant",
        "freelance digital marketing",
        "SEO agency",
        "web development"
    ]
    
    print(f"Loaded {len(all_leads)} leads from Excel. Triggering Google Sheets sync...")
    sync_to_google_sheets(all_leads, keywords, spreadsheet_id=TARGET_SPREADSHEET_ID)

if __name__ == "__main__":
    main()
