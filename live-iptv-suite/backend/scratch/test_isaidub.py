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

req = urllib.request.Request("https://gotodub.click/", headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
    html = r.read().decode('utf-8', errors='ignore')
    print("gotodub HTML len:", len(html))
    links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
    print("Total links:", len(links))
    for h, t in links[:35]:
        clean = re.sub(r'<[^>]+>', '', t).strip()
        if clean:
            print(" ", clean, "->", h)


