import urllib.request
import ssl
import re
from http.cookiejar import CookieJar

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

req = urllib.request.Request('https://moviezda.com/', headers=headers)
with opener.open(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print("Home page length:", len(html))
# Find all a tags
links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
print(f"Total links found: {len(links)}")
for href, txt in links:
    clean = re.sub(r'<[^>]+>', '', txt).strip()
    if clean:
        print(f"  {clean} -> {href}")
