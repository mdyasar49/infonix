import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Pool of verified candidate image URLs for each movie
CANDIDATES = {
    "Amaran": [
        "https://image.tmdb.org/t/p/w500/vQ9xT8oHjF1N5v6xW0J2yZ8bM4C.jpg",
        "https://image.tmdb.org/t/p/w500/9eN1eC6p5YVzJ7KkZ8m4c2d6y4V.jpg",
        "https://m.media-amazon.com/images/M/MV5BMjA1NmQ1MDgtMmVmYy00MTNkLWIxNjktNDNkMDRhYjZlMjhmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
        "https://upload.wikimedia.org/wikipedia/en/5/52/Amaran_2024_poster.jpg",
        "https://image.tmdb.org/t/p/w500/m8JTwjd094IQduRq6I9QN5DEddC.jpg"
    ],
    "The Greatest of All Time (GOAT)": [
        "https://image.tmdb.org/t/p/w500/aeFq9m2q5xXg8L2k6UqXbZ5E1yF.jpg",
        "https://upload.wikimedia.org/wikipedia/en/9/91/The_Greatest_of_All_Time_poster.jpg",
        "https://m.media-amazon.com/images/M/MV5BMTAxYjAxOTctM2ZkYi00ZGEwLTg2NTQtMmE2Njg4ODlmOTFlXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Maharaja": [
        "https://image.tmdb.org/t/p/w500/b0OnAWRR282a5cffE8W1X1G4c10.jpg",
        "https://upload.wikimedia.org/wikipedia/en/8/8c/Maharaja_2024_poster.jpg",
        "https://m.media-amazon.com/images/M/MV5BN2U5MGFmOTAtMWJkNy00MTE2LTgyNTYtYWYzZDUyNDhhNDMyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Raayan": [
        "https://image.tmdb.org/t/p/w500/1p5ptVjE4i27Zc8gB3k3bK3Z1a6.jpg",
        "https://upload.wikimedia.org/wikipedia/en/e/e6/Raayan_poster.jpg",
        "https://m.media-amazon.com/images/M/MV5BOGQyZjAyYzMtYWRlNS00NmMyLWE0YjUtZmY3MmMyMjhmZjhkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Leo": [
        "https://image.tmdb.org/t/p/w500/b0OnAWRR282a5cffE8W1X1G4c10.jpg",
        "https://upload.wikimedia.org/wikipedia/en/7/75/Leo_%282023_Indian_film%29.jpg",
        "https://m.media-amazon.com/images/M/MV5BMmFiZGZjMmEtMTA0Ni00MzA2LTljMTYtZGI2MGJmZWYzZTQ2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Jailer": [
        "https://image.tmdb.org/t/p/w500/aHk5c3QzS1eX9iW4qM9Kz0oQ8v1.jpg",
        "https://upload.wikimedia.org/wikipedia/en/c/cb/Jailer_2023_Tamil_film_poster.jpg",
        "https://m.media-amazon.com/images/M/MV5BMjA1OWVkMTEtMmJhMC00Y2E4LTkwNmYtZDBkZGY2M2QyMGNjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Master": [
        "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        "https://upload.wikimedia.org/wikipedia/en/5/53/Master_2021_poster.jpg",
        "https://m.media-amazon.com/images/M/MV5BNmU1OTYzYzAtMDcyOS00MDI0LTg2ZmQtYTEyMDdmMmQ0NDA1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Vikram": [
        "https://image.tmdb.org/t/p/w500/1p5ptVjE4i27Zc8gB3k3bK3Z1a6.jpg",
        "https://upload.wikimedia.org/wikipedia/en/9/93/Vikram_2022_poster.jpg",
        "https://m.media-amazon.com/images/M/MV5BMmJhYTYxMGEtNjQ5NS00MWZiLWEwN2ItYWFkNmM2NzM1ZTBkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg"
    ],
    "Interstellar": [
        "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    ],
    "Inception": [
        "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
    ],
    "The Dark Knight": [
        "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    ],
    "Oppenheimer": [
        "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
    ],
    "Avengers: Endgame": [
        "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg"
    ],
    "Avatar: The Way of Water": [
        "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"
    ],
    "Dangal": [
        "https://m.media-amazon.com/images/M/MV5BMTQ4MzQzMzM2Nl5BMl5BanBnXkFtZTgwMTQ1NzU3MDI@._V1_FMjpg_UX1000_.jpg"
    ]
}

verified_posters = {}

for movie, urls in CANDIDATES.items():
    for u in urls:
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, context=ctx, timeout=3) as resp:
                if resp.status == 200:
                    verified_posters[movie] = u
                    print(f"VERIFIED: {movie} -> {u}")
                    break
        except Exception as e:
            pass

print(f"\nTotal verified posters ready: {len(verified_posters)}/{len(CANDIDATES)}")
