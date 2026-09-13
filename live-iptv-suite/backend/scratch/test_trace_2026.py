import sys
import urllib.request
import ssl
import re
from http.cookiejar import CookieJar

sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

def stealth_get(url, referer=None):
    h = headers.copy()
    if referer:
        h['Referer'] = referer
    req = urllib.request.Request(url, headers=h)
    with opener.open(req, timeout=10) as resp:
        return resp.read().decode('utf-8', errors='ignore')

# Trace Mandaadi 2026
movie_url = "https://moviezda.com/mandaadi-2026-tamil-movie/"
html = stealth_get(movie_url, referer="https://moviezda.com/tamil-2026-movies/")
print("Movie page length:", len(html))

# Look for quality or original links
qual_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
for href, txt in qual_links:
    clean = re.sub(r'<[^>]+>', '', txt).strip()
    if 'original' in href.lower() or 'movie' in href.lower() or 'mp4' in href.lower():
        print(f"  Quality/File link: {clean} -> {href}")

# Let's inspect the first quality link
first_link = [h for h, t in qual_links if 'original' in h.lower() or 'movie' in h.lower() or 'sample' not in h.lower()]
if first_link:
    target = first_link[0]
    target_url = target if target.startswith('http') else f"https://moviezda.com{target}"
    print("\nTraversing:", target_url)
    sub_html = stealth_get(target_url, referer=movie_url)
    sub_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', sub_html)
    for href, txt in sub_links:
        clean = re.sub(r'<[^>]+>', '', txt).strip()
        if any(w in href.lower() for w in ['1080', '720', 'hd', 'download', 'file']):
            print(f"    Sub-link: {clean} -> {href}")
            
            # If it's a file page
            if '/file/' in href or 'hd' in href:
                f_url = href if href.startswith('http') else f"https://moviezda.com{href}"
                f_html = stealth_get(f_url, referer=target_url)
                dl_match = re.search(r'<a\s+[^>]*href=["\'](https://movies\.downloadpage\.xyz/download/page/\d+)["\']', f_html)
                if dl_match:
                    dl_page = dl_match.group(1)
                    print(f"      -> Gateway download page: {dl_page}")
                    dl_html = stealth_get(dl_page, referer=f_url)
                    fast_m = re.search(r'href=["\'](https://download\.fastbytes\.xyz/download\.php\?dl=[^"\']+)["\']', dl_html)
                    if fast_m:
                        print(f"      -> LIVE ADMIN TOKEN STREAM URL: {fast_m.group(1)}")
