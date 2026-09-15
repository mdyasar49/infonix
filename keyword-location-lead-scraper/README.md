# 🚀 Keyword & Location Dynamic Lead Scraper

Python script to scrape business leads dynamically based on user-specified **Keywords** and **Locations**, exporting the data into an Excel spreadsheet with **separate worksheets (tabs)** for each Keyword group as well as a master summary tab.

---

## 📁 Project Structure

```
d:\infonix\keyword-location-lead-scraper\
├── keyword_location_scraper.py   # Main Python scraping script
├── requirements.txt              # Required Python dependencies
├── run_scraper.bat               # Windows 1-click batch launcher
├── README.md                     # Documentation & usage instructions
└── output\                       # Output folder for generated .xlsx spreadsheets
```

---

## 🚀 How to Run

### Option 1: Direct Command Line (CLI)
```bash
python keyword_location_scraper.py --keywords "digital marketing, SEO agency, web development" --locations "Coimbatore, Chennai" --output "output/scraped_leads.xlsx"
```

### Option 2: 1-Click Double-Click (Windows)
Double-click [`run_scraper.bat`](file:///d:/infonix/keyword-location-lead-scraper/run_scraper.bat)

---

## 📊 Features & Output Format

1. **Multi-Tab Excel Spreadsheet (`.xlsx`)**:
   - `All Leads Master`: Unified sheet with all deduplicated leads.
   - `Digital Marketing`: Leads scraped for the 'digital marketing' keyword.
   - `SEO Agency`: Leads scraped for the 'SEO agency' keyword.
   - `Web Development`: Leads scraped for the 'web development' keyword.

2. **Scraped Fields**:
   - Date Scraped
   - Keyword Group
   - Search Query
   - Location
   - Company / Agency Name
   - Work Email
   - Phone Number
   - Company Website URL
   - Lead Status
   - Description / Snippet
