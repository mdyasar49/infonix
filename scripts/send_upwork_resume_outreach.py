import os
import sys
import time
import getpass
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from google.oauth2 import service_account
from googleapiclient.discovery import build

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")
SPREADSHEET_ID = "1QY8hbycY-gdOWRch52SKoUS975U-t3EgZ0JrtdhPCoM"
RESUME_PATH = r"d:\infonix\A_Mohamed_Yasar_Resume.pdf"

if not os.path.exists(RESUME_PATH):
    RESUME_PATH = r"d:\infonix\A_Mohamed_Yasar-Resume.pdf"

print("=" * 80)
print(" 🚀 UPWORK LEADS PERSONAL RESUME OUTREACH AUTOMATION SCRIPT")
print("=" * 80)
print(f"[✓] Resume File Located: {RESUME_PATH}")

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=["https://www.googleapis.com/auth/spreadsheets"]
)
service = build("sheets", "v4", credentials=creds)

sheet_data = service.spreadsheets().values().get(
    spreadsheetId=SPREADSHEET_ID,
    range="'Upwork Leads'!A1:AE300"
).execute()

rows = sheet_data.get("values", [])
if not rows or len(rows) < 2:
    print("[-] No leads found in 'Upwork Leads' tab!")
    sys.exit(0)

headers = rows[0]
leads_to_email = []

for idx, row in enumerate(rows[1:], start=2):
    def get_col(col_idx, default=""):
        return row[col_idx].strip() if len(row) > col_idx else default

    scraped_date = get_col(0)
    post_date    = get_col(1)
    post_link    = get_col(2)
    company      = get_col(5)
    first_name   = get_col(8)
    last_name    = get_col(9)
    cust_name    = get_col(10) or f"{first_name} {last_name}".strip() or "Hiring Manager"
    title        = get_col(11)
    email        = get_col(12)
    skills       = get_col(17)
    notes        = get_col(30)

    if email and "@" in email:
        leads_to_email.append({
            "row_idx": idx,
            "name": cust_name,
            "company": company,
            "email": email,
            "title": title,
            "skills": skills,
            "notes": notes,
            "post_link": post_link
        })

print(f"[✓] Total valid emails extracted from 'Upwork Leads': {len(leads_to_email)}")

if not leads_to_email:
    print("[-] No valid email addresses found to send outreach!")
    sys.exit(0)

print("\n--------------------------------------------------------------------------------")
print(" 📧 GMAIL SMTP CREDENTIAL SETUP")
print("--------------------------------------------------------------------------------")

sender_email = "mohamedyasar081786@gmail.com"
sender_password = "rqllguolcyfjkvkb"

print(f"[✓] Using Gmail Account: {sender_email}")
print(f"[+] Connecting to Gmail SMTP Server (smtp.gmail.com:465 SSL)...")

try:
    server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    server.login(sender_email, sender_password)
    print("[✓] Gmail SMTP Authentication Successful!\n")
except Exception as e:
    print(f"[-] Gmail Authentication Failed: {e}")
    print("💡 Hint: Make sure 2-Step Verification is ON and you generated a 16-character App Password at https://myaccount.google.com/apppasswords")
    sys.exit(1)

print("=" * 80)
print(" 📤 STARTING EMAIL OUTREACH DISPATCH WITH RESUME ATTACHMENT")
print("=" * 80)

sent_count = 0

for item in leads_to_email:
    target_email = item["email"]
    target_name = item["name"]
    company_name = item["company"]
    post_link = item["post_link"]

    msg = MIMEMultipart()
    msg['From'] = f"Mohamed Yasar <{sender_email}>"
    msg['To'] = target_email
    msg['Subject'] = f"Proposal / Application for {company_name} - Mohamed Yasar (Full Stack & Automation Specialist)"

    body = f"""Hi {target_name},

I hope this email finds you well.

I came across your posting for {company_name} ({post_link}) and am very interested in collaborating with you.

Brief Overview of My Expertise:
• Full Stack Web Development (Python, React, Node.js, FastAPI, Django)
• Web Automation & Data Scraping Pipelines (Scrapy, Selenium, Playwright, API Integrations)
• Enterprise AI Agent & LLM Chatbot Integration (LangChain, OpenAI, AutoGen)
• High-performance Database Architecture & Cloud Deployment (AWS, Docker, PostgreSQL)

I have attached my complete Resume (A_Mohamed_Yasar_Resume.pdf) for your review. I would welcome the opportunity to discuss how I can deliver exceptional results for your project.

Looking forward to hearing from you.

Best regards,

Mohamed Yasar
Full Stack & Automation Engineer
Email: {sender_email}
LinkedIn: https://www.linkedin.com/in/mohamed-yasar/
"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # Attach Resume PDF
    try:
        with open(RESUME_PATH, "rb") as f:
            attach = MIMEApplication(f.read(), _subtype="pdf")
            attach.add_header('Content-Disposition', 'attachment', filename=os.path.basename(RESUME_PATH))
            msg.attach(attach)
    except Exception as e:
        print(f"[-] Failed to attach resume PDF: {e}")

    sent = False
    for attempt in range(3):
        try:
            server.sendmail(sender_email, target_email, msg.as_string())
            sent_count += 1
            print(f"[{sent_count}/{len(leads_to_email)}] [✓] Email successfully sent to {target_name} ({target_email}) at {company_name}")
            sent = True
            time.sleep(0.3)
            break
        except Exception as e:
            print(f"[!] SMTP error (Attempt {attempt+1}): {e}. Reconnecting to Gmail SMTP...")
            try:
                server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
                server.login(sender_email, sender_password)
            except Exception as login_err:
                print(f"[-] Re-authentication failed: {login_err}")

try:
    server.quit()
except Exception:
    pass

print("=" * 80)
print(f"🎉 OUTREACH COMPLETE! Successfully sent {sent_count} emails with Resume attached!")
print("=" * 80)
