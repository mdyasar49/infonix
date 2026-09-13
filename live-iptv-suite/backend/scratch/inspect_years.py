import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://moviezda.com/'
}

for path in ['/tamil-2026-movies/', '/tamil-2025-movies/', '/tamil-2024-movies/']:
    url = f"https://moviezda.com{path}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"=== {path} (Length: {len(html)}) ===")
            links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
            for href, txt in links:
                clean = re.sub(r'<[^>]+>', '', txt).strip()
                if clean and ('movie' in href.lower() or '202' in href.lower()):
                    print(f"   {clean} -> {href}")
    except Exception as e:
        print(f"Failed {url}: {e}")
