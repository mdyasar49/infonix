import os
import sys
import json
import urllib.request
import urllib.parse
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'StreamPulseApp/1.0 (dev@streampulse.app)'}

def find_wiki_poster(title, year=None):
    clean_title = title.split('(')[0].split(':')[0].strip()
    search_q = f"{clean_title} {year} film" if year else f"{clean_title} film"
    search_url = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + urllib.parse.quote(search_q) + '&format=json'
    try:
        req = urllib.request.Request(search_url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=6) as r:
            data = json.loads(r.read().decode('utf-8'))
            results = data.get('query', {}).get('search', [])
            if not results:
                return None
            best_page = results[0]['title']
            
        summary_url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(best_page.replace(' ', '_'))
        req2 = urllib.request.Request(summary_url, headers=HEADERS)
        with urllib.request.urlopen(req2, context=ctx, timeout=6) as r2:
            sdata = json.loads(r2.read().decode('utf-8'))
            if 'thumbnail' in sdata:
                return sdata['thumbnail']['source']
            if 'originalimage' in sdata:
                return sdata['originalimage']['source']
    except Exception as e:
        # print(f"Error {title}: {e}")
        pass
    return None

test_list = [
    ('Amaran', 2024),
    ('The Greatest of All Time (GOAT)', 2024),
    ('Maharaja', 2024),
    ('Raayan', 2024),
    ('Leo', 2023),
    ('Jailer', 2023),
    ('Vikram', 2022),
    ('Master', 2021),
    ('Ponniyin Selvan: Part 1', 2022),
    ('Kalki 2898 AD', 2024),
    ('Indian 2', 2024),
    ('Thangalaan', 2024),
    ('Kanguva', 2024),
    ('Meiyazhagan', 2024),
    ('Vettaiyan', 2024),
    ('Interstellar', 2014),
    ('Inception', 2010),
    ('The Dark Knight', 2008),
    ('Oppenheimer', 2023),
    ('Avatar: The Way of Water', 2022),
    ('Avengers: Endgame', 2019),
    ('Dangal', 2016),
    ('RRR', 2022),
    ('KGF Chapter 2', 2022),
    ('Kantara', 2022),
    ('Pushpa: The Rise', 2021),
    ('Manjummel Boys', 2024),
    ('Aavesham', 2024),
    ('Premalu', 2024),
    ('Bramayugam', 2024),
    ('The Goat Life', 2024)
]

for title, yr in test_list:
    p = find_wiki_poster(title, yr)
    print(f"MATCH: {title} ({yr}) -> {p}")
    time.sleep(0.05)
