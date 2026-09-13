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
    'Referer': 'https://moviezda.com/mandaadi-2026-tamil-movie/'
}

url = "https://moviezda.com/mandaadi-hq-predvd-movie/"
req = urllib.request.Request(url, headers=headers)
with opener.open(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print("Page length:", len(html))
links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
for href, txt in links:
    clean = re.sub(r'<[^>]+>', '', txt).strip()
    if '1080p' in href.lower():
        f_url = f"https://moviezda.com{href}"
        print("Fetching 1080p page:", f_url)
        f_req = urllib.request.Request(f_url, headers={**headers, 'Referer': url})
        with opener.open(f_req, timeout=10) as f_resp:
            f_html = f_resp.read().decode('utf-8', errors='ignore')
            print("f_html length:", len(f_html))
            f_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', f_html)
            print("Found f_links:", len(f_links))
            for fh, ft in f_links:
                fc = re.sub(r'<[^>]+>', '', ft).strip()
                if '/download/' in fh or '/file/' in fh:
                    file_dl_url = f"https://moviezda.com{fh}"
                    print(f"  Found File Download Page: {fc} -> {file_dl_url}")
                    file_req = urllib.request.Request(file_dl_url, headers={**headers, 'Referer': f_url})
                    with opener.open(file_req, timeout=10) as file_resp:
                        file_html = file_resp.read().decode('utf-8', errors='ignore')
                        dl_m = re.search(r'<a\s+[^>]*href=["\'](https://movies\.downloadpage\.xyz/download/page/\d+)["\']', file_html)
                        if dl_m:
                            dl_page = dl_m.group(1)
                            print(f"    Gateway Page: {dl_page}")
                            dl_req = urllib.request.Request(dl_page, headers={**headers, 'Referer': file_dl_url})
                            with opener.open(dl_req, timeout=10) as dl_resp:
                                dl_html = dl_resp.read().decode('utf-8', errors='ignore')
                                fast_m = re.search(r'href=["\'](https://download\.fastbytes\.xyz/download\.php\?dl=[^"\']+)["\']', dl_html)
                                if fast_m:
                                    print(f"    >>> LIVE TOKEN STREAM URL: {fast_m.group(1)} <<<")
                        else:
                            # Let's see what links exist in file_html
                            print("No downloadpage match. Links in file_html:")
                            for h2, t2 in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', file_html):
                                if any(x in h2 for x in ['download', 'fast', 'server', 'php', 'dl']):
                                    print("     ", t2, "->", h2)


