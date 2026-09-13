import urllib.request
import ssl
import re
import base64
import json
from http.cookiejar import CookieJar

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx)
)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
}

# 1. Gateway Resolution
req = urllib.request.Request('https://gotopage.top//?ref=14', headers=headers)
with opener.open(req, timeout=10) as resp:
    final_url = resp.geturl()
    body = resp.read().decode('utf-8', errors='ignore')
    print("Gateway redirected to:", final_url)
    meta_m = re.search(r'content=["\']\d+;\s*url=([^"\'>\s]+)', body, re.IGNORECASE)
    active_origin = meta_m.group(1) if meta_m else final_url
    print("Active Origin Target:", active_origin)

# 2. Check 2025 movies listing on active origin
if not active_origin.endswith('/'):
    active_origin += '/'

movies_2025_url = f"{active_origin}tamil-2025-movies-tamil-movie/"
req2 = urllib.request.Request(movies_2025_url, headers={**headers, 'Referer': 'https://gotopage.top//?ref=14'})
with opener.open(req2, timeout=10) as resp2:
    html2 = resp2.read().decode('utf-8', errors='ignore')
    print("Tamil 2025 page length:", len(html2))
    links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+-tamil-movie[^"\']*)["\'][^>]*>(.*?)</a>', html2, re.DOTALL)
    print(f"Found {len(links)} 2025 movie entries:")
    for href, title in links[:5]:
        clean_title = re.sub(r'<[^>]+>', '', title).strip()
        print(f"  - {clean_title} -> {href}")

# 3. Test on-demand token extraction for one movie
if links:
    sample_href = links[0][0]
    sample_url = sample_href if sample_href.startswith('http') else f"{active_origin.rstrip('/')}{sample_href}"
    print(f"\nStealth traversing sample movie: {sample_url}")
    req_sub = urllib.request.Request(sample_url, headers={**headers, 'Referer': movies_2025_url})
    with opener.open(req_sub, timeout=10) as resp_sub:
        sub_html = resp_sub.read().decode('utf-8', errors='ignore')
        
        orig_match = re.search(r'<a\s+[^>]*href=["\']([^"\']+-original-movie[^"\']*)["\'][^>]*>', sub_html)
        if orig_match:
            qual_href = orig_match.group(1)
            qual_url = qual_href if qual_href.startswith('http') else f"{active_origin.rstrip('/')}{qual_href}"
            print("Quality page URL:", qual_url)
            
            req_qual = urllib.request.Request(qual_url, headers={**headers, 'Referer': sample_url})
            with opener.open(req_qual, timeout=10) as resp_qual:
                qual_html = resp_qual.read().decode('utf-8', errors='ignore')
                
                # Check for file page
                file_match = re.search(r'<a\s+[^>]*href=["\']([^"\']+(?:1080p|720p|hd-movie)[^"\']*)["\'][^>]*>(.*?)</a>', qual_html)
                if file_match:
                    file_href = file_match.group(1)
                    file_url = file_href if file_href.startswith('http') else f"{active_origin.rstrip('/')}{file_href}"
                    print("File page URL:", file_url)
                    
                    req_file = urllib.request.Request(file_url, headers={**headers, 'Referer': qual_url})
                    with opener.open(req_file, timeout=10) as resp_file:
                        file_html = resp_file.read().decode('utf-8', errors='ignore')
                        
                        dl_m = re.search(r'<a\s+[^>]*href=["\'](https://movies\.downloadpage\.xyz/download/page/\d+)["\']', file_html)
                        if dl_m:
                            dl_page = dl_m.group(1)
                            print("Download gateway page:", dl_page)
                            
                            req_dl = urllib.request.Request(dl_page, headers={**headers, 'Referer': file_url})
                            with opener.open(req_dl, timeout=10) as resp_dl:
                                dl_html = resp_dl.read().decode('utf-8', errors='ignore')
                                fast_m = re.search(r'href=["\'](https://download\.fastbytes\.xyz/download\.php\?dl=[^"\']+)["\']', dl_html)
                                if fast_m:
                                    fresh_token_link = fast_m.group(1)
                                    print("SUCCESS! Fresh dynamic token link extracted:")
                                    print("  ", fresh_token_link)
                                    
                                    # Inspect token structure
                                    dl_token = fresh_token_link.split('dl=')[-1]
                                    try:
                                        # padded base64 decode
                                        padded = dl_token + '=' * (-len(dl_token) % 4)
                                        decoded = base64.b64decode(padded).decode('utf-8', errors='ignore')
                                        print("Decoded token payload structure:", decoded[:120], "...")
                                    except Exception as ex:
                                        print("Token is opaque or encrypted:", ex)
