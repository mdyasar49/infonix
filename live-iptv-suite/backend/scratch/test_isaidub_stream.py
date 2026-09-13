import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Referer': 'https://isaidub.green/movie/hollywood-movies-in-english/'
}

url = "https://isaidub.green/movie/gladiator-2-2024-english-tamil-dubbed-movie/"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
    html = r.read().decode('utf-8', errors='ignore')

print("Gladiator 2 page len:", len(html))
links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
for h, t in links:
    c = re.sub(r'<[^>]+>', '', t).strip()
    if any(k in h.lower() for k in ['gladiator', 'original', 'hd', 'download', 'file']):
        print("  Link:", c, "->", h)
        if 'movie' in h:
            sub_url = h if h.startswith('http') else f"https://isaidub.green{h}"
            req_sub = urllib.request.Request(sub_url, headers={**headers, 'Referer': url})
            with urllib.request.urlopen(req_sub, context=ctx, timeout=8) as r_sub:
                html_sub = r_sub.read().decode('utf-8', errors='ignore')
                for h2, t2 in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html_sub):
                    if '720p' in h2.lower():
                        dl_page_url = f"https://isaidub.green{h2}"
                        print("    Fetching 720p download page:", dl_page_url)
                        req_dl = urllib.request.Request(dl_page_url, headers={**headers, 'Referer': sub_url})
                        with urllib.request.urlopen(req_dl, context=ctx, timeout=8) as r_dl:
                            html_dl = r_dl.read().decode('utf-8', errors='ignore')
                            for h3, t3 in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html_dl):
                                if any(k in h3.lower() for k in ['download', 'server', 'page', 'fastbytes']):
                                    print("      Server Link:", t3, "->", h3)

