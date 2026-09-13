import urllib.request

urls = {
    'Parasakthi (1952)': 'https://archive.org/download/Parasakthi1952Tamil/Parasakthi_1952.mp4',
    'Veerapandiya Kattabomman (1959)': 'https://archive.org/download/VeerapandiyaKattabomman_201703/VeerapandiyaKattabomman.mp4',
    'Mayabazar (1957)': 'https://archive.org/download/Mayabazar1957Tamil/Mayabazar_1957_Tamil.mp4',
    'Chandralekha (1948)': 'https://archive.org/download/Chandralekha1948Tamil/Chandralekha_1948_Tamil.mp4',
    'Nadodi Mannan (1958)': 'https://archive.org/download/NadodiMannan1958/Nadodi_Mannan_1958.mp4',
    'Madurai Veeran (1956)': 'https://archive.org/download/MaduraiVeeran1956/Madurai_Veeran_1956.mp4',
    'Raja Harishchandra (1913)': 'https://archive.org/download/RajaHarishchandra1913/RajaHarishchandra1913.mp4',
}

for name, u in urls.items():
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"OK [200]: {name} -> Content-Type: {resp.headers.get('Content-Type')}")
    except Exception as e:
        print(f"FAIL: {name} -> {e}")
