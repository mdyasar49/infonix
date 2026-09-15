@echo off
chcp 65001 > nul
title Keyword & Location Lead Scraper Engine
echo ================================================================================
echo 🚀 KEYWORD & LOCATION LEAD SCRAPER ENGINE
echo ================================================================================
python keyword_location_scraper.py --keywords "digital marketing, SEO agency, web development" --locations "Coimbatore, Chennai" --output "output/scraped_leads_by_keyword.xlsx"
echo.
echo Operation Completed! Output saved in output/scraped_leads_by_keyword.xlsx
pause
