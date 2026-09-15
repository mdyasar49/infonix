import os
import shutil
import subprocess
import urllib.request
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TOKEN = "YOUR_GITHUB_TOKEN"
TARGET_DIR = r"d:\infonix\LinkedIn-Data-Scraping"
SOURCE_EXTRACTED = r"d:\infonix\linkedin-scraper\linkedin-scraper-full-code"

os.makedirs(TARGET_DIR, exist_ok=True)

# 1. Copy scrape_linkedin directory
src_pkg = os.path.join(SOURCE_EXTRACTED, "scrape_linkedin")
dst_pkg = os.path.join(TARGET_DIR, "scrape_linkedin")
if os.path.exists(dst_pkg):
    shutil.rmtree(dst_pkg)
shutil.copytree(src_pkg, dst_pkg)

# 2. Copy individual source files
for item in ["linkedinScraper.py", "try.csv"]:
    s = os.path.join(SOURCE_EXTRACTED, item)
    if os.path.exists(s):
        shutil.copy2(s, os.path.join(TARGET_DIR, item))

# 3. Copy downloaded Linkedin_scrape.py and scrape_info.csv
for item in ["Linkedin_scrape.py", "scrape_info.csv"]:
    s = os.path.join(r"d:\infonix", item)
    if os.path.exists(s):
        shutil.copy2(s, os.path.join(TARGET_DIR, item))

# 4. Copy credentials.json
shutil.copy2(r"credentials.json", os.path.join(TARGET_DIR, "credentials.json"))

print("[✓] Copied all core files into LinkedIn-Data-Scraping")
