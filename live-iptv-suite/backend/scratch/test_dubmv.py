import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Referer': 'https://dubpage.xyz/download/view/97419'
}

url = "https://dubmv.xyz/download/file/97419"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
    html = r.read().decode('utf-8', errors='ignore')

print("dubmv len:", len(html))
links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
for h, t in links:
    clean = re.sub(r'<[^>]+>', '', t).strip()
    print("  Link:", clean, "->", h)
