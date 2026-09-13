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

genres = [
    ('Hindi', 'https://www.kuttymovies.org/hindi-movies/'),
    ('Telugu', 'https://www.kuttymovies.org/telugu-movies/'),
    ('Malayalam', 'https://www.kuttymovies.org/malayalam-movies/'),
    ('Dubbed', 'https://www.kuttymovies.org/dubbed-movies/'),
]

for name, url in genres:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            print(f"=== {name} Movies ({len(html)} bytes) ===")
            links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
            for h, t in links[:15]:
                clean = re.sub(r'<[^>]+>', '', t).strip()
                if clean and not any(x in clean.lower() for x in ['home', 'contact', 'privacy', 'dmca']):
                    print(f"  {clean} -> {h}")
    except Exception as e:
        print(f"Failed {name}: {e}")
