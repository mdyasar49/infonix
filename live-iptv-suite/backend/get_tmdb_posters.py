import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# TMDB API
api_key = "38b81fa8b88820f4c02f06b6ebdbb9bf"

movie_queries = [
    ("Amaran", "Amaran"),
    ("The Greatest of All Time (GOAT)", "The Greatest of All Time"),
    ("Maharaja", "Maharaja"),
    ("Raayan", "Raayan"),
    ("Leo", "Leo"),
    ("Jailer", "Jailer"),
    ("Vikram", "Vikram"),
    ("Master", "Master"),
    ("Ponniyin Selvan: Part 1", "Ponniyin Selvan Part 1"),
    ("Ponniyin Selvan: Part 2", "Ponniyin Selvan Part 2"),
    ("Kaithi", "Kaithi"),
    ("Super Deluxe", "Super Deluxe"),
    ("Asuran", "Asuran"),
    ("Vada Chennai", "Vada Chennai"),
    ("Vikram Vedha", "Vikram Vedha"),
    ("Mankatha", "Mankatha"),
    ("Enthiran (Robot)", "Enthiran"),
    ("Sivaji: The Boss", "Sivaji"),
    ("Ghilli", "Ghilli"),
    ("Anbe Sivam", "Anbe Sivam"),
    ("Baashha", "Baashha"),
    ("Thalapathi", "Thalapathi"),
    ("Nayakan", "Nayakan"),
    ("Interstellar", "Interstellar"),
    ("Inception", "Inception"),
    ("The Dark Knight", "The Dark Knight"),
    ("Oppenheimer", "Oppenheimer"),
    ("Avengers: Endgame", "Avengers Endgame"),
    ("Avatar: The Way of Water", "Avatar The Way of Water"),
    ("Gladiator", "Gladiator"),
    ("The Shawshank Redemption", "The Shawshank Redemption"),
    ("The Matrix", "The Matrix"),
    ("Kalki 2898 AD", "Kalki 2898 AD"),
    ("Salaar: Part 1 - Ceasefire", "Salaar"),
    ("RRR", "RRR"),
    ("KGF: Chapter 2", "KGF Chapter 2"),
    ("KGF: Chapter 1", "KGF Chapter 1"),
    ("Baahubali 2: The Conclusion", "Baahubali 2"),
    ("Baahubali: The Beginning", "Baahubali The Beginning"),
    ("Manjummel Boys", "Manjummel Boys"),
    ("Jawan", "Jawan"),
    ("3 Idiots", "3 Idiots"),
    ("Dangal", "Dangal")
]

results = {}

for db_title, search_query in movie_queries:
    try:
        url = f"https://api.themoviedb.org/3/search/movie?api_key={api_key}&query={urllib.parse.quote(search_query)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('results'):
                # Pick the first result that has a poster_path
                for res in data['results']:
                    p_path = res.get('poster_path')
                    if p_path:
                        full_poster = f"https://image.tmdb.org/t/p/w500{p_path}"
                        results[db_title] = {
                            "tmdb_title": res.get('title'),
                            "year": res.get('release_date', '')[:4],
                            "poster": full_poster
                        }
                        print(f"MATCH: {db_title} -> {res.get('title')} ({res.get('release_date', '')[:4]}) | {full_poster}")
                        break
            else:
                print(f"NOT FOUND: {db_title}")
    except Exception as e:
        print(f"ERR {db_title}: {e}")

with open('verified_tmdb_posters.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print(f"\nDone! Matched {len(results)}/{len(movie_queries)} movies with 100% authentic TMDB posters.")
