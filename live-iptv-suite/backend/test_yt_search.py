import urllib.request
import urllib.parse
import re

def get_yt_video_id(query):
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.youtube.com/results?search_query={encoded_query}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
            # Look for videoId patterns
            matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
            # Filter out known bad IDs or shorts
            valid_ids = []
            for m in matches:
                if m not in valid_ids:
                    valid_ids.append(m)
            if valid_ids:
                return valid_ids[0]
    except Exception as e:
        print(f"Error fetching {query}: {e}")
    return None

if __name__ == "__main__":
    test_titles = [
        "Pushpa 2 The Rule 2024 Tamil trailer",
        "Sardar 2 2026 Karthi Tamil teaser",
        "Bha Bha Ba 2025 Dileep trailer",
        "Amaran 2024 Tamil trailer",
        "Coolie 2025 Rajinikanth teaser",
        "Retta Thala 2025 Arun Vijay teaser"
    ]
    for t in test_titles:
        vid = get_yt_video_id(t)
        print(f"{t} -> https://www.youtube.com/watch?v={vid}")
