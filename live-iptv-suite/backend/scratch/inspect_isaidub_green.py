import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Referer': 'https://gotodub.click/'
}

for path in ['tamil-2026-dubbed-movies/', 'movie/hollywood-movies-in-english/', 'tamil-2025-dubbed-movies/']:
    url = f"https://isaidub.green/{path}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"=== {path} (len: {len(html)}) ===")
            links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
            for h, t in links[:15]:
                c = re.sub(r'<[^>]+>', '', t).strip()
                if c and ('movie' in h.lower() or 'dubbed' in h.lower() or '202' in h.lower()):
                    print(f"  {c} -> {h}")
    except Exception as e:
        print(f"Failed {path}: {e}")
