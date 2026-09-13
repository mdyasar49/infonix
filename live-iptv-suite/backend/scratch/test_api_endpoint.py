import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:8000/api/movies/')
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print('Total movies from API:', len(data))
    first = data[0]
    print(f"First movie: ID={first['id']} | {first['title']} ({first['year']})")
    
    # Test stream resolve endpoint
    req2 = urllib.request.Request(f"http://127.0.0.1:8000/api/movies/{first['id']}/stream/")
    with urllib.request.urlopen(req2) as resp2:
        res_data = json.loads(resp2.read().decode())
        print("Stream resolve response:")
        print("  server_type:", res_data.get('server_type'))
        print("  proxy_url:", res_data.get('proxy_url')[:70], "...")
        print("  stream_url:", res_data.get('stream_url')[:70], "...")
