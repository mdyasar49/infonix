import os
import sys
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

FOLDER_ID = "1s4CBPGNHYXKNcG6evUc7Q8Awv_SmLK0u"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, "credentials.json")
if not os.path.exists(SERVICE_ACCOUNT_FILE):
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=["https://www.googleapis.com/auth/drive"]
)
drive_service = build("drive", "v3", credentials=creds)

def list_folder_contents(folder_id):
    try:
        results = drive_service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="files(id, name, mimeType, size, modifiedTime)"
        ).execute()
        files = results.get("files", [])
        print(f"[✓] Found {len(files)} items in Google Drive folder '{folder_id}':")
        for f in files:
            print(f"  - Name: '{f['name']}' | Type: {f['mimeType']} | ID: {f['id']} | Size: {f.get('size', 'N/A')} bytes")
        return files
    except Exception as e:
        print(f"[!] Error listing Drive folder: {e}")
        return []

if __name__ == "__main__":
    list_folder_contents(FOLDER_ID)
