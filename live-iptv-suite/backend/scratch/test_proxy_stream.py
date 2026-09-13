import urllib.request
import urllib.parse
import json

# Fetch stream for ID 38
req2 = urllib.request.Request("http://127.0.0.1:8000/api/movies/38/stream/")
with urllib.request.urlopen(req2) as resp2:
    res_data = json.loads(resp2.read().decode())

proxy_url = f"http://127.0.0.1:8000{res_data['proxy_url']}"
print("Testing proxy stream endpoint:", proxy_url[:80], "...")

# Test proxy stream with byte range
proxy_req = urllib.request.Request(proxy_url, headers={'Range': 'bytes=0-1024'})
with urllib.request.urlopen(proxy_req) as proxy_resp:
    print("Proxy HTTP Status:", proxy_resp.status)
    print("Content-Type:", proxy_resp.headers.get('Content-Type'))
    print("Content-Range:", proxy_resp.headers.get('Content-Range'))
    print("Content-Length:", proxy_resp.headers.get('Content-Length'))
    data = proxy_resp.read()
    print(f"Read {len(data)} bytes of video stream via local stealth proxy successfully!")
