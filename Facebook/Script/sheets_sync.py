"""
Google Sheets sync for Facebook leads.

Uses ONE shared spreadsheet. Each run appends only NEW rows
(duplicate check by normalized Facebook URL found in Notes).

CRM rules (from Yasar):
  - Sheet columns include Email + Industry
  - Only pages created within the last N months (default 3)
  - Email AND (Mobile or Phone Number) are mandatory
"""

from __future__ import annotations

import os
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List, Optional, Set, Tuple

import pandas as pd
from dotenv import load_dotenv

from facebook_scraper import (
    OUTPUT_DETAILS_CSV,
    enrich_year,
    normalize_created_dates,
    normalize_facebook_url,
)

SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(SCRIPT_DIR / ".env")
DEFAULT_CREDENTIALS = SCRIPT_DIR / "credentials" / "google_service_account.json"
SHEET_TAB = os.environ.get("GOOGLE_SHEET_TAB", "Facebook Leads")
LEAD_SOURCE = os.environ.get("LEAD_SOURCE", "Facebook")
LEAD_STATUS = os.environ.get("LEAD_STATUS", "New")
LEAD_ADDED_BY = os.environ.get("LEAD_ADDED_BY", "Facebook Scraper")
MAX_ACCOUNT_AGE_MONTHS = int(os.environ.get("MAX_ACCOUNT_AGE_MONTHS", "6"))
REQUIRE_EMAIL_AND_PHONE = os.environ.get("REQUIRE_EMAIL_AND_PHONE", "true").lower() in {
    "1",
    "true",
    "yes",
}
REQUIRE_AUSTRALIA = os.environ.get("REQUIRE_AUSTRALIA", "true").lower() in {
    "1",
    "true",
    "yes",
}

_AU_PHONE_RE = re.compile(r"^(?:\+?61|0)[\s\-()]*[2-478]")
_AU_STATE_RE = re.compile(
    r"\b(australia|nsw|vic|qld|wa|sa|tas|nt|act|new south wales|victoria|"
    r"queensland|western australia|south australia|tasmania|northern territory|"
    r"australian capital territory)\b",
    re.I,
)

# Exact CRM headers (matches Yasar's sheet)
SHEET_COLUMNS = [
    "Scrap Date",
    "Date",
    "Company Name",
    "Mobile",
    "Phone Number",
    "Industry",
    "Lead Source",
    "Status",
    "Email",
    "Lead Added By",
    "Notes (Added a post or account link)",
]

_MOBILE_RE = re.compile(r"(?:\+?61\s*4|^\s*04)", re.I)
_FB_URL_RE = re.compile(r"https?://(?:www\.)?facebook\.com/[^\s|]+", re.I)


def _require_gspread():
    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError as exc:
        raise SystemExit(
            "Missing Google Sheets dependencies. Run:\n"
            "  pip3 install gspread google-auth\n"
        ) from exc
    return gspread, Credentials


def get_credentials_path() -> Path:
    path = Path(os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", str(DEFAULT_CREDENTIALS)))
    if not path.is_absolute():
        path = SCRIPT_DIR / path
    if not path.exists():
        fallback = SCRIPT_DIR / "credentials.json"
        if fallback.exists():
            return fallback
    return path


def get_spreadsheet_id() -> str:
    sheet_id = os.environ.get("GOOGLE_SHEET_ID", "").strip()
    if not sheet_id:
        raise SystemExit(
            "GOOGLE_SHEET_ID is not set. Add it to Script/.env or the environment.\n"
            "Use the same Google Sheet every day (do not create a new file)."
        )
    return sheet_id


def open_worksheet():
    gspread, Credentials = _require_gspread()
    cred_path = get_credentials_path()
    if not cred_path.exists():
        raise SystemExit(
            f"Service account JSON not found: {cred_path}\n"
            "Place your Google service account key at Script/credentials/google_service_account.json"
        )
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(cred_path), scopes=scopes)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(get_spreadsheet_id())
    candidates = [
        SHEET_TAB,
        "Facebook Leads",
        "Leads",
        "Sheet1",
        "Sheet 1",
    ]
    worksheet = None
    for name in candidates:
        try:
            worksheet = spreadsheet.worksheet(name)
            break
        except gspread.WorksheetNotFound:
            continue
    if worksheet is None:
        worksheets = spreadsheet.worksheets()
        first = worksheets[0] if worksheets else None
        if first:
            worksheet = first
        else:
            worksheet = spreadsheet.add_worksheet(
                title=SHEET_TAB, rows=2000, cols=len(SHEET_COLUMNS)
            )
    values = worksheet.get_all_values()
    if not values:
        worksheet.append_row(SHEET_COLUMNS, value_input_option="USER_ENTERED")
    return worksheet


def ensure_header(worksheet) -> None:
    values = worksheet.get_all_values()
    if not values:
        worksheet.append_row(SHEET_COLUMNS, value_input_option="USER_ENTERED")
        return
    header = [h.strip() for h in values[0]]
    if header != SHEET_COLUMNS and len(values) == 1:
        worksheet.update(values=[SHEET_COLUMNS], range_name="A1")


def _clean(val) -> str:
    if pd.isna(val):
        return ""
    text = str(val).strip()
    if not text or text.lower() in {"nan", "none", "<na>"}:
        return ""
    return text


def _sheet_safe_phone(text: str) -> str:
    if not text:
        return ""
    if text.startswith(("+", "=", "-", "@")):
        return "'" + text
    return text


def split_mobile_and_phone(phone: str) -> Tuple[str, str]:
    phone = _clean(phone)
    if not phone:
        return "", ""
    if _MOBILE_RE.search(phone):
        return phone, ""
    return "", phone


def is_australian_lead(row: pd.Series) -> bool:
    """
    Ad Library and some searches return foreign businesses that merely target
    Australia, so require at least one hard Australian signal.
    """
    location = _clean(row.get("Location"))
    # ASIC-matched companies are Australian by definition
    if location.upper().startswith("ASIC:"):
        return True

    phone = re.sub(r"[^\d+]", "", _clean(row.get("Phone_number")))
    if phone and _AU_PHONE_RE.match(phone):
        return True

    website = _clean(row.get("Website_url")).lower()
    if re.search(r"\.au(?:/|$|\?)", website):
        return True

    for field in ("Address", "Managed_From_Country", "Location"):
        value = _clean(row.get(field))
        if value and _AU_STATE_RE.search(value):
            return True

    email = _clean(row.get("Email")).lower()
    return email.endswith(".au")


def asic_reg_date(row: pd.Series) -> pd.Timestamp:
    """Parse ASIC:dd/mm/yyyy stamped into Location by asic_fb_pipeline."""
    location = _clean(row.get("Location"))
    if not location.upper().startswith("ASIC:"):
        return pd.NaT
    raw = location.split(":", 1)[1].strip()
    return pd.to_datetime(raw, errors="coerce", dayfirst=True)


def account_age_cutoff() -> pd.Timestamp:
    # Approximate months as 30.44 days
    days = int(round(MAX_ACCOUNT_AGE_MONTHS * 30.44))
    return pd.Timestamp(datetime.now() - timedelta(days=days)).normalize()


def filter_eligible_leads(df: pd.DataFrame) -> pd.DataFrame:
    """
    Keep only leads that meet client rules:
      1) Recent within last MAX_ACCOUNT_AGE_MONTHS via:
         - Facebook page creation date, OR
         - ASIC company registration date (Location = ASIC:dd/mm/yyyy)
      2) Email present
      3) Mobile or Phone present
      4) Australian signal
    """
    if df is None or df.empty:
        return df

    enriched = enrich_year(df)
    if MAX_ACCOUNT_AGE_MONTHS > 0:
        cutoff = account_age_cutoff()
        dates = normalize_created_dates(
            enriched.get("Page_Created_date", pd.Series(dtype=object))
        )
        page_recent = dates.notna() & (dates >= cutoff)
        asic_dates = enriched.apply(asic_reg_date, axis=1)
        asic_recent = asic_dates.notna() & (asic_dates >= cutoff)
        recent = page_recent | asic_recent
    else:
        recent = pd.Series(True, index=enriched.index)

    email_ok = enriched["Email"].map(lambda v: bool(_clean(v)))
    phone_ok = enriched["Phone_number"].map(lambda v: bool(_clean(v)))
    name_ok = enriched["Page_Name"].map(lambda v: bool(_clean(v)))

    mask = recent.copy()
    if REQUIRE_EMAIL_AND_PHONE:
        mask = mask & email_ok & phone_ok & name_ok
    else:
        # At least one contact field + company name
        mask = mask & name_ok & (email_ok | phone_ok)
    if REQUIRE_AUSTRALIA:
        mask = mask & enriched.apply(is_australian_lead, axis=1)

    filtered = enriched.loc[mask].copy()
    skipped = len(enriched) - len(filtered)
    print(
        f"CRM filter: kept {len(filtered)} / {len(enriched)} "
        f"({'no age limit' if MAX_ACCOUNT_AGE_MONTHS <= 0 else f'last {MAX_ACCOUNT_AGE_MONTHS} months (page OR ASIC)'}"
        f"{', email+phone+name mandatory' if REQUIRE_EMAIL_AND_PHONE else ', name + email or phone'}"
        f"{', Australian only' if REQUIRE_AUSTRALIA else ''}; "
        f"skipped {skipped})"
    )
    return filtered


def build_notes(row: pd.Series) -> str:
    parts: List[str] = []
    fb = _clean(row.get("Facebook_url"))
    if fb:
        parts.append(fb)
    location = _clean(row.get("Location"))
    if location.upper().startswith("ASIC:"):
        parts.append(f"ASIC registered: {location.split(':', 1)[1].strip()}")
    elif location:
        parts.append(f"Location: {location}")
    address = _clean(row.get("Address"))
    if address:
        parts.append(f"Address: {address}")
    website = _clean(row.get("Website_url"))
    if website:
        parts.append(f"Website: {website}")
    created = _clean(row.get("Page_Created_date"))
    year = _clean(row.get("Year"))
    if created:
        parts.append(f"Page created: {created}" + (f" ({year})" if year else ""))
    country = _clean(row.get("Managed_From_Country"))
    if country:
        parts.append(f"Managed from: {country}")
    return " | ".join(parts)


def scrape_row_to_crm_row(row: pd.Series, scrap_date: Optional[str] = None) -> List[str]:
    scrap = scrap_date or date.today().isoformat()
    created = _clean(row.get("Page_Created_date"))
    if not created:
        asic = asic_reg_date(row)
        if pd.notna(asic):
            created = asic.strftime("%d %B %Y")
    company = _clean(row.get("Page_Name"))
    if not company:
        fb = _clean(row.get("Facebook_url"))
        if fb:
            slug = fb.rstrip("/").split("/")[-1]
            if slug and "profile.php" not in slug:
                company = slug.replace("-", " ").replace(".", " ").replace("_", " ").strip()
    mobile, landline = split_mobile_and_phone(row.get("Phone_number"))
    industry = _clean(row.get("Industry"))
    email = _clean(row.get("Email"))
    return [
        scrap,
        created,
        company,
        _sheet_safe_phone(mobile),
        _sheet_safe_phone(landline),
        industry,
        LEAD_SOURCE,
        LEAD_STATUS,
        email,
        LEAD_ADDED_BY,
        build_notes(row),
    ]


def dataframe_to_crm_rows(df: pd.DataFrame) -> List[List[str]]:
    enriched = enrich_year(df)
    scrap = date.today().isoformat()
    return [scrape_row_to_crm_row(row, scrap_date=scrap) for _, row in enriched.iterrows()]


def existing_facebook_urls(worksheet) -> Set[str]:
    values = worksheet.get_all_values()
    if len(values) <= 1:
        return set()
    header = [h.strip() for h in values[0]]
    urls: Set[str] = set()

    notes_idx = None
    for name in (
        "Notes (Added a post or account link)",
        "Notes",
        "Facebook_url",
    ):
        if name in header:
            notes_idx = header.index(name)
            break
    if notes_idx is None:
        return set()

    for row in values[1:]:
        if notes_idx >= len(row):
            continue
        cell = row[notes_idx] or ""
        matches = _FB_URL_RE.findall(cell)
        if matches:
            for m in matches:
                norm = normalize_facebook_url(m.rstrip("|").strip())
                if norm:
                    urls.add(norm)
        else:
            norm = normalize_facebook_url(cell.strip())
            if norm:
                urls.add(norm)
    return urls


def append_new_records(df: pd.DataFrame, existing_urls: Optional[Set[str]] = None) -> int:
    if df is None or df.empty:
        print("No rows to sync.")
        return 0

    eligible = filter_eligible_leads(df)
    if eligible.empty:
        print("Google Sheet: no eligible rows after CRM filters.")
        return 0

    worksheet = open_worksheet()
    ensure_header(worksheet)
    sheet_urls = existing_urls if existing_urls is not None else existing_facebook_urls(worksheet)

    norms = eligible["Facebook_url"].map(normalize_facebook_url)
    new_df = eligible.loc[~norms.isin(sheet_urls) & norms.ne("")].copy()
    if new_df.empty:
        print("Google Sheet: no new records (all eligible URLs already present).")
        return 0

    rows = dataframe_to_crm_rows(new_df)
    worksheet.append_rows(rows, value_input_option="USER_ENTERED")
    print(f"Google Sheet: appended {len(rows)} new CRM row(s) to tab '{worksheet.title}'.")
    return len(rows)


def sync_local_output_to_sheet(csv_path: Path = OUTPUT_DETAILS_CSV) -> int:
    if not csv_path.exists():
        print(f"Local output not found: {csv_path}")
        return 0
    df = pd.read_csv(csv_path)
    return append_new_records(df)


def force_resync_local_output(csv_path: Path = OUTPUT_DETAILS_CSV) -> int:
    """Clear sheet and rewrite only CRM-eligible local rows."""
    if not csv_path.exists():
        print(f"Local output not found: {csv_path}")
        return 0

    worksheet = open_worksheet()
    worksheet.clear()
    worksheet.update(values=[SHEET_COLUMNS], range_name="A1")

    df = pd.read_csv(csv_path)
    eligible = filter_eligible_leads(df)
    if eligible.empty:
        print(
            "Google Sheet: header written only — no rows meet "
            f"last-{MAX_ACCOUNT_AGE_MONTHS}-month + email+phone rules."
        )
        return 0

    rows = dataframe_to_crm_rows(eligible)
    worksheet.append_rows(rows, value_input_option="USER_ENTERED")
    print(f"Google Sheet: force-resynced {len(rows)} eligible CRM row(s).")
    return len(rows)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Sync Facebook leads to Google Sheet (CRM rules)")
    parser.add_argument("--csv", type=Path, default=OUTPUT_DETAILS_CSV)
    parser.add_argument(
        "--force-resync",
        action="store_true",
        help="Clear sheet and rewrite only eligible rows",
    )
    parser.add_argument(
        "--no-filter",
        action="store_true",
        help="Disable 3-month / email+phone filters (debug only)",
    )
    args = parser.parse_args()
    if args.no_filter:
        # temporary override for debug
        import sheets_sync as _self

        _self.REQUIRE_EMAIL_AND_PHONE = False
        _self.MAX_ACCOUNT_AGE_MONTHS = 1200
    if args.force_resync:
        force_resync_local_output(args.csv)
    else:
        sync_local_output_to_sheet(args.csv)
