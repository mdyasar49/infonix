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

# Check Kuttymovies domains
kuttymovies_candidates = [
    "https://kuttymovies.com",
    "https://kuttymovies.net",
    "https://kuttymovies.org",
    "https://kuttymovies24.net",
    "https://kuttymovies.la",
    "https://kuttymoviesda.com",
]

print("=== Checking Kuttymovies Candidates ===")
for url in kuttymovies_candidates:
    try:
        req = urllib.request.Request(url, headers=headers)
        with opener.open(req, timeout=5) as resp:
            final = resp.geturl()
            print(f"[OK] {url} -> {final} (status {resp.status})")
    except Exception as e:
        print(f"[FAIL] {url} : {e}")

# Check moviezda tamil-dubbed-movies & collection
print("\n=== Checking Isaimini/Moviesda Dubbed & All Language Collections ===")
try:
    req = urllib.request.Request("https://moviezda.com/tamil-dubbed-movies/", headers=headers)
    with opener.open(req, timeout=8) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Dubbed movies page len: {len(html)}")
        links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
        for h, t in links:
            clean = re.sub(r'<[^>]+>', '', t).strip()
            if 'dubbed' in h.lower() or 'tamil' in h.lower():
                print(f"  {clean} -> {h}")
except Exception as e:
    print(f"Dubbed fetch error: {e}")
