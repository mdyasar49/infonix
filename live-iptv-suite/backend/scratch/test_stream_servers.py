import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Referer': 'https://movies.downloadpage.xyz/download/page/101708'
}

# 1. Test datapulse-static link
url1 = 'https://datapulse-static.xyz/Mandaadi_2026_HQ_PreDVD_1080p_HD.mp4'
try:
    req1 = urllib.request.Request(url1, headers=headers, method='HEAD')
    with urllib.request.urlopen(req1, context=ctx, timeout=10) as r1:
        print("datapulse HEAD status:", r1.status)
        print("Content-Type:", r1.headers.get('Content-Type'))
        print("Content-Length:", r1.headers.get('Content-Length'))
except Exception as e:
    print("datapulse failed:", e)

# 2. Test play.onestream.today
url2 = 'https://play.onestream.today/stream/page/101708'
try:
    req2 = urllib.request.Request(url2, headers=headers)
    with urllib.request.urlopen(req2, context=ctx, timeout=10) as r2:
        html2 = r2.read().decode('utf-8', errors='ignore')
        print("\nonestream page length:", len(html2))
        video_src = re.findall(r'<source\s+[^>]*src=["\']([^"\']+)["\']', html2)
        print("video sources:", video_src)
        iframe_src = re.findall(r'<iframe\s+[^>]*src=["\']([^"\']+)["\']', html2)
        print("iframe sources:", iframe_src)
        all_links = re.findall(r'href=["\']([^"\']+\.mp4[^"\']*)["\']', html2)
        print("mp4 links:", all_links)
        m3u8_links = re.findall(r'[\'"](https?://[^\'"]+\.m3u8[^\'"]*)[\'"]', html2)
        print("m3u8 links:", m3u8_links)
        if video_src:
            v_url = video_src[0]
            req_v = urllib.request.Request(v_url, headers={**headers, 'Referer': url2}, method='HEAD')
            with urllib.request.urlopen(req_v, context=ctx, timeout=10) as r_v:
                print("pixelharbor HEAD status:", r_v.status)
                print("pixelharbor Content-Type:", r_v.headers.get('Content-Type'))
                print("pixelharbor Accept-Ranges:", r_v.headers.get('Accept-Ranges'))
                print("pixelharbor Content-Length:", r_v.headers.get('Content-Length'))

except Exception as e:
    print("onestream failed:", e)
