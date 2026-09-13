import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Referer': 'https://isaidub.green/'
}

# Step 1: Movie page
movie_url = "https://isaidub.green/movie/gladiator-2-2024-english-tamil-dubbed-movie/"
req = urllib.request.Request(movie_url, headers=headers)
with urllib.request.urlopen(req, context=ctx) as r:
    html = r.read().decode('utf-8', errors='ignore')

qual_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+-movie/)["\'][^>]*>', html)
print("Quality links:", qual_links)
if qual_links:
    qual_url = f"https://isaidub.green{qual_links[0]}"
    req_qual = urllib.request.Request(qual_url, headers={**headers, 'Referer': movie_url})
    with urllib.request.urlopen(req_qual, context=ctx) as r_q:
        html_q = r_q.read().decode('utf-8', errors='ignore')
        
    hd_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+(?:1080p|720p|hd)[^"\']*)["\'][^>]*>', html_q)
    print("HD links:", hd_links)
    if hd_links:
        hd_url = f"https://isaidub.green{hd_links[0]}"
        req_hd = urllib.request.Request(hd_url, headers={**headers, 'Referer': qual_url})
        with urllib.request.urlopen(req_hd, context=ctx) as r_hd:
            html_hd = r_hd.read().decode('utf-8', errors='ignore')
            
        file_links = re.findall(r'<a\s+[^>]*href=["\'](/download/page/\d+/)["\'][^>]*>', html_hd)
        print("File links:", file_links)
        if file_links:
            file_url = f"https://isaidub.green{file_links[0]}"
            req_file = urllib.request.Request(file_url, headers={**headers, 'Referer': hd_url})
            with urllib.request.urlopen(req_file, context=ctx) as r_file:
                html_file = r_file.read().decode('utf-8', errors='ignore')
            print("html_file length:", len(html_file))
            for hx, tx in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html_file):
                print("  file page link:", tx, "->", hx)

            req_gw = urllib.request.Request("https://dubpage.xyz/download/view/97419", headers={**headers, 'Referer': file_url})
            with urllib.request.urlopen(req_gw, context=ctx) as r_gw:
                html_gw = r_gw.read().decode('utf-8', errors='ignore')
            print("html_gw len:", len(html_gw))
            for hg, tg in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html_gw):
                print("  dubpage link:", tg, "->", hg)

                with urllib.request.urlopen(req_gw, context=ctx) as r_gw:
                    html_gw = r_gw.read().decode('utf-8', errors='ignore')
                    
                dl_links = re.findall(r'<a\s+[^>]*href=["\'](https://[^"\']*downloadpage\.xyz/download/page/\d+)["\']', html_gw)
                print("Downloadpage links:", dl_links)
                if dl_links:
                    dl_url = dl_links[0]
                    req_dl = urllib.request.Request(dl_url, headers={**headers, 'Referer': gw_url})
                    with urllib.request.urlopen(req_dl, context=ctx) as r_dl:
                        html_dl = r_dl.read().decode('utf-8', errors='ignore')
                        
                    fast_m = re.search(r'href=["\'](https://[^"\']+/download\.php\?dl=[^"\']+)["\']', html_dl)
                    if fast_m:
                        print("SUCCESS! LIVE STREAM URL:", fast_m.group(1)[:80], "...")
                    else:
                        print("Direct mp4/other in html_dl:")
                        for x in re.findall(r'href=["\'](https://[^"\']+)["\']', html_dl):
                            if any(k in x for k in ['fastbytes', 'uptomkv', 'mp4', 'onestream']):
                                print("  ", x)
