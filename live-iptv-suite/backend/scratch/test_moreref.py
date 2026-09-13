import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Referer': 'https://www.kuttymovies.ru/haiwaan-2026-hindi-line-audio-v2-hq-2026/'
}

url = 'https://go.moreref.com/dsmvs/getlink.php?v=HIIVFmwfqx425UPQCGBIBsi2IrsLDU4vpP75%2F5k8igA6T4OzRYx97VeoQTMCN9kOs1OacxCcTAoas86aDrvI0M0OO85V1V1PEckgiAd3bl9mih1%2FqelZIJmSJ8%2FFPOQ2lXoYZFhI42bTBzeGSA2ntrrVIjX5PVJbtHjhd0JSpcE%3D'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
    print("Final URL:", r.geturl())
    html = r.read().decode('utf-8', errors='ignore')
    print("HTML length:", len(html))
    links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
    for h, t in links:
        print("  ", t, "->", h)
