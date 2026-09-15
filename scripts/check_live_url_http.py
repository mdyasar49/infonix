import os
import sys
import re
import requests
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

def check_url(url):
    if not url or not url.startswith("http"):
        return False, 0
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        res = requests.head(url, headers=headers, timeout=5, allow_redirects=True)
        if res.status_code in [200, 301, 302, 307, 308]:
            return True, res.status_code
        # Try GET if HEAD fails
        res_get = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
        if res_get.status_code in [200, 301, 302, 307, 308]:
            return True, res_get.status_code
        return False, res_get.status_code
    except Exception as e:
        return False, 0

tabs = ["Upwork Leads", "Freelancer Leads", "LinkedIn Leads", "Facebook Leads", "Instagram Leads", "Threads Leads"]

for tab in tabs:
    print(f"\n====================================================================================================")
    print(f" 🔍 CHECKING HTTP LIVE STATUS IN TAB: '{tab}'")
    print(f"====================================================================================================")
    res = service.spreadsheets().values().get(spreadsheetId=SPREADSHEET_ID, range=f"'{tab}'!A1:Z10").execute()
    rows = res.get("values", [])
    if len(rows) <= 1:
        print("  [!] No data rows found.")
        continue
    
    headers = rows[0]
    for idx, row in enumerate(rows[1:6], 2):
        post_link = row[2] if len(row) > 2 else ""
        page_link = row[3] if len(row) > 3 else ""
        comp = row[5] if len(row) > 5 else ""
        
        ok_post, code_post = check_url(post_link)
        ok_page, code_page = check_url(page_link)
        
        status_post = f"✅ {code_post}" if ok_post else f"❌ {code_post} (404/DEAD)"
        status_page = f"✅ {code_page}" if ok_page else f"❌ {code_page} (404/DEAD)"
        
        print(f"Row #{idx - 1} ({comp}):")
        print(f"  🔗 Post Link: {post_link} -> {status_post}")
        print(f"  🌐 Page Link: {page_link} -> {status_page}")
