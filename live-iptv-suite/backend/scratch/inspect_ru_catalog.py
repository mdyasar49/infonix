import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

req = urllib.request.Request('https://www.kuttymovies.ru/', headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
    html = r.read().decode('utf-8', errors='ignore')

print("Page len:", len(html))
# Search for movie titles, cards, or articles
articles = re.findall(r'<article[^>]*>(.*?)</article>', html, re.DOTALL)
print("Found articles:", len(articles))
if not articles:
    # Look for h2, h3 or cards
    cards = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.DOTALL)
    print("Found headings:", len(cards))
    for c in cards[:25]:
        clean = re.sub(r'<[^>]+>', '', c).strip()
        print("  Heading:", clean)

for a in articles[:10]:
    title_m = re.search(r'<h[234][^>]*>(.*?)</h[234]>', a)
    title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else ""
    link_m = re.search(r'href=["\']([^"\']+)["\']', a)
    link = link_m.group(1) if link_m else ""
    lang_m = re.search(r'(Hindi|Tamil|Telugu|Malayalam|Punjabi|Dubbed)', a, re.IGNORECASE)
    lang = lang_m.group(1) if lang_m else "Tamil"
    print(f"[{lang}] {title} -> {link}")
