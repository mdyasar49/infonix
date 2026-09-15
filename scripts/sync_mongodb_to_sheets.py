"""
================================================================================
🚀 MONGO DB TO GOOGLE SHEETS LEAD SYNCHRONIZER
================================================================================
Reads lead records from MongoDB ("LinkedIn" database) and syncs them to Google Sheets:
- Sheet 1 (Odoo): 1X_8LbsHisyvoCfjSuTX5yRVsRgXPDEmu3W5RWXuAC1o
- Sheet 2 (Zoho): 18oHqPuo6BhAgI5e_GLSSps5fSc_DpzYEYofgPKxBv9o
================================================================================
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import gspread
from google.oauth2.service_account import Credentials

# Load environment variables
load_dotenv(r"d:\infonix\.env")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(CREDENTIALS_FILE):
    CREDENTIALS_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")
SPREADSHEET_ID_ODOO = "1X_8LbsHisyvoCfjSuTX5yRVsRgXPDEmu3W5RWXuAC1o"
SPREADSHEET_ID_ZOHO = "18oHqPuo6BhAgI5e_GLSSps5fSc_DpzYEYofgPKxBv9o"

HEADERS = [
    "Scraped Date",
    "Lead Source",
    "Scraped Website Source URL",
    "Company Name",
    "Contact Person",
    "First Name",
    "Last Name",
    "Job Title",
    "Work Email",
    "Phone Number",
    "Company Website URL",
    "LinkedIn / Social Profile URL",
    "City",
    "State",
    "Country",
    "Industry / Module Focus",
    "Partner Grade",
    "Lead Status",
    "Call Status",
    "Follow Up Notes",
    "Description"
]

def fetch_mongodb_leads(mongo_url, db_name="LinkedIn", collection_name="linkedin-jobpost"):
    try:
        import pymongo
    except ImportError:
        print("[!] Missing pymongo. Install via: pip install pymongo", flush=True)
        return []

    print(f"[🔍] Connecting to MongoDB database '{db_name}', collection '{collection_name}'...", flush=True)
    try:
        client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        col = db[collection_name]
        docs = list(col.find({}))
        print(f"[✓] Retrieved {len(docs)} records from MongoDB.", flush=True)
        return docs
    except Exception as e:
        print(f"[!] MongoDB Connection Error: {e}", flush=True)
        return []

def map_doc_to_sheet_row(doc, company_filter="Odoo"):
    scraped_date = doc.get("date") or datetime.now().strftime("%Y-%m-%d")
    name = doc.get("name") or doc.get("Contact Person") or "Direct Sales Executive"
    
    parts = name.split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    headline = doc.get("headline") or doc.get("Job Title") or f"Direct {company_filter} Sales Executive"
    email = doc.get("email") or doc.get("Work Email") or f"sales@{company_filter.lower()}.com"
    phone = doc.get("phone") or doc.get("Phone Number") or ("+91 79 4050 0100" if "odoo" in company_filter.lower() else "1800 103 1123")
    location = doc.get("location") or doc.get("City") or "Chennai / India"
    profile_url = doc.get("profile_link") or doc.get("LinkedIn / Social Profile URL") or "https://www.linkedin.com"

    return {
        "Scraped Date": str(scraped_date),
        "Lead Source": "MongoDB Scraped Database",
        "Scraped Website Source URL": profile_url,
        "Company Name": f"{company_filter} Direct HQ",
        "Contact Person": name,
        "First Name": first_name,
        "Last Name": last_name,
        "Job Title": headline,
        "Work Email": email,
        "Phone Number": phone,
        "Company Website URL": f"https://www.{company_filter.lower()}.com",
        "LinkedIn / Social Profile URL": profile_url,
        "City": location,
        "State": "Tamil Nadu / India",
        "Country": "India",
        "Industry / Module Focus": "Direct Enterprise Solutions",
        "Partner Grade": "Direct HQ",
        "Lead Status": "New / Active Lead",
        "Call Status": "Pending Call",
        "Follow Up Notes": f"Synced from MongoDB record ID: {doc.get('_id', '')}",
        "Description": doc.get("content") or f"Direct {company_filter} Executive lead."
    }

def sync_to_google_sheets(odoo_rows, zoho_rows):
    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scopes)
    gc = gspread.authorize(creds)

    if odoo_rows:
        print("\nSyncing MongoDB data to Sheet 1 (Odoo)...", flush=True)
        wks1 = gc.open_by_key(SPREADSHEET_ID_ODOO).sheet1
        wks1.clear()
        values1 = [HEADERS] + [[r.get(c, "") for c in HEADERS] for r in odoo_rows]
        wks1.update(range_name="A1", values=values1)
        print(f"[✓] Successfully updated Sheet 1 with {len(odoo_rows)} Odoo MongoDB leads!", flush=True)

    if zoho_rows:
        print("\nSyncing MongoDB data to Sheet 2 (Zoho)...", flush=True)
        wks2 = gc.open_by_key(SPREADSHEET_ID_ZOHO).sheet1
        wks2.clear()
        values2 = [HEADERS] + [[r.get(c, "") for c in HEADERS] for r in zoho_rows]
        wks2.update(range_name="A1", values=values2)
        print(f"[✓] Successfully updated Sheet 2 with {len(zoho_rows)} Zoho MongoDB leads!", flush=True)

def main():
    mongo_url = os.getenv("MONGO_URL") or os.getenv("mongourl")
    if not mongo_url:
        print("[!] MONGO_URL not found in .env. Please set MONGO_URL=mongodb+srv://... or mongodb://localhost:27017 in d:\\infonix\\.env", flush=True)
        sys.exit(1)

    docs = fetch_mongodb_leads(mongo_url)
    if not docs:
        print("[!] No documents found or MongoDB unreachable.", flush=True)
        sys.exit(1)

    odoo_leads = [map_doc_to_sheet_row(d, "Odoo") for d in docs if "odoo" in str(d).lower()]
    zoho_leads = [map_doc_to_sheet_row(d, "Zoho") for d in docs if "zoho" in str(d).lower()]

    # If filter is generic, assign all to appropriate sheets
    if not odoo_leads and not zoho_leads:
        odoo_leads = [map_doc_to_sheet_row(d, "Odoo") for d in docs]

    sync_to_google_sheets(odoo_leads, zoho_leads)

if __name__ == "__main__":
    main()
