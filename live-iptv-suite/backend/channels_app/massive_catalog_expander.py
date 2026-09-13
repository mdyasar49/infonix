import sys
sys.path.append(r'd:\infonix\live-iptv-suite\backend')
import os, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Movie, Channel, Category

def expand_all_eras():
    movies_data = [
        # --- 1. HISTORICAL PIONEER ERA (1777 - 1949) ---
        {
            "title": "Veerapandiya Kattabomman: Legend of 1777",
            "year": 1777,
            "category": "Historical Pioneer Epic",
            "language": "Tamil",
            "quality": "Restored 1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 55m",
            "rating": 9.5,
            "synopsis": "The legendary revolt of Veerapandiya Kattabomman against colonial forces, rooted in the 1777 rebellion.",
            "source_mirror": "historical-archive"
        },
        {
            "title": "Raja Harishchandra",
            "year": 1913,
            "category": "Silent Pioneer / History",
            "language": "Hindi",
            "quality": "Restored HD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "40m",
            "rating": 9.2,
            "synopsis": "Dadasaheb Phalke's historic masterpiece - the first Indian feature film.",
            "source_mirror": "historical-archive"
        },
        {
            "title": "Keechaka Vadham",
            "year": 1918,
            "category": "Silent Pioneer / Tamil Epic",
            "language": "Tamil",
            "quality": "Restored HD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "50m",
            "rating": 9.1,
            "synopsis": "Directed by R. Nataraja Mudaliar, the first silent feature film produced in South India and Tamil cinema history.",
            "source_mirror": "historical-archive"
        },
        {
            "title": "The Gold Rush",
            "year": 1925,
            "category": "Comedy / World Cinema Classic",
            "language": "English",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "1h 35m",
            "rating": 8.8,
            "synopsis": "Charlie Chaplin's iconic comedy masterpiece following The Tramp in the Klondike Gold Rush.",
            "source_mirror": "world-archive"
        },
        {
            "title": "The General",
            "year": 1926,
            "category": "Action / Adventure Classic",
            "language": "English",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "1h 18m",
            "rating": 8.7,
            "synopsis": "Buster Keaton's legendary physical comedy and action locomotive masterpiece.",
            "source_mirror": "world-archive"
        },
        {
            "title": "Metropolis",
            "year": 1927,
            "category": "Sci-Fi / World Cinema",
            "language": "English",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 33m",
            "rating": 8.9,
            "synopsis": "Fritz Lang's pioneering futuristic science fiction vision of a mechanized dystopian future.",
            "source_mirror": "world-archive"
        },
        {
            "title": "Kalidas",
            "year": 1931,
            "category": "Historical / First Tamil Talkie",
            "language": "Tamil",
            "quality": "Restored Audio/Video HD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "1h 25m",
            "rating": 9.4,
            "synopsis": "The milestone first sound talkie film made in Tamil cinema, directed by H. M. Reddy.",
            "source_mirror": "historical-archive"
        },
        {
            "title": "City Lights",
            "year": 1931,
            "category": "Romantic Comedy / Masterpiece",
            "language": "English",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "1h 27m",
            "rating": 9.0,
            "synopsis": "With the aid of a wealthy erratic drunkard, a tramp woos a blind flower girl.",
            "source_mirror": "world-archive"
        },
        {
            "title": "Haridas",
            "year": 1944,
            "category": "Devotional / Tamil Classic",
            "language": "Tamil",
            "quality": "Restored 1080p",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 14m",
            "rating": 9.3,
            "synopsis": "M. K. Thyagaraja Bhagavathar's record-breaking blockbuster that ran for 110 consecutive weeks in Chennai.",
            "source_mirror": "historical-archive"
        },
        {
            "title": "Chandralekha",
            "year": 1948,
            "category": "Swashbuckler Epic / Gemini Studios",
            "language": "Tamil",
            "quality": "Restored 1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "3h 10m",
            "rating": 9.4,
            "synopsis": "S. S. Vasan's monumental magnum opus famous for the colossal drum-dance sequence that stunned Indian cinema.",
            "source_mirror": "historical-archive"
        },
        {
            "title": "Casablanca",
            "year": 1942,
            "category": "Drama / Romance Classic",
            "language": "English",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "1h 42m",
            "rating": 9.2,
            "synopsis": "Humphrey Bogart and Ingrid Bergman in the legendary wartime romantic drama.",
            "source_mirror": "world-archive"
        },

        # --- 2. CLASSIC GOLDEN ERA (1950 - 1979) ---
        {
            "title": "Parasakthi",
            "year": 1952,
            "category": "Social Drama / Revolutionary Classic",
            "language": "Tamil",
            "quality": "Restored 1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 45m",
            "rating": 9.6,
            "synopsis": "Sivaji Ganesan's iconic debut with scorching dialogues penned by Kalaignar Karunanidhi.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Mayabazar",
            "year": 1957,
            "category": "Mythological Fantasy / Masterpiece",
            "language": "Telugu",
            "quality": "Restored Color FHD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "3h 05m",
            "rating": 9.5,
            "synopsis": "NTR, ANR, and SV Ranga Rao in Indian cinema's greatest mythological epic comedy.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Madurai Veeran",
            "year": 1956,
            "category": "Historical Action / MGR Classic",
            "language": "Tamil",
            "quality": "Restored HD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 40m",
            "rating": 9.1,
            "synopsis": "M. G. Ramachandran in the folkloric saga of the legendary folk hero Madurai Veeran.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Nadodi Mannan",
            "year": 1958,
            "category": "Swashbuckler Adventure / MGR",
            "language": "Tamil",
            "quality": "Restored Color HD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "3h 15m",
            "rating": 9.3,
            "synopsis": "MGR's grand directorial dual-role triumph that redefined Tamil political and heroic cinema.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Mughal-E-Azam",
            "year": 1960,
            "category": "Historical Epic / Bollywood",
            "language": "Hindi",
            "quality": "Color Remastered 1080p",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "3h 17m",
            "rating": 9.4,
            "synopsis": "K. Asif's timeless romance between Prince Salim and courtesan Anarkali, featuring Dilip Kumar and Madhubala.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Thiruvilaiyadal",
            "year": 1965,
            "category": "Devotional Drama / Sivaji Classic",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 45m",
            "rating": 9.5,
            "synopsis": "Sivaji Ganesan as Lord Shiva and Nagesh as Dharumi in one of Tamil cinema's most celebrated scenes.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Ayirathil Oruvan",
            "year": 1965,
            "category": "Action Adventure / Pirate Swashbuckler",
            "language": "Tamil",
            "quality": "Restored 1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 45m",
            "rating": 9.2,
            "synopsis": "MGR and Jayalalithaa in the swashbuckling pirate revolution against oppression.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Chemmeen",
            "year": 1965,
            "category": "Tragic Romance / National Award",
            "language": "Malayalam",
            "quality": "Restored 1080p",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 20m",
            "rating": 9.1,
            "synopsis": "Ramu Kariat's poetic romance based on the mythical sea coast of Kerala.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "The Godfather",
            "year": 1972,
            "category": "Crime Drama / Masterpiece",
            "language": "English",
            "quality": "4K Ultra HD Remaster",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 55m",
            "rating": 9.6,
            "synopsis": "Francis Ford Coppola's mafia epic starring Marlon Brando and Al Pacino.",
            "source_mirror": "world-archive"
        },
        {
            "title": "Sholay",
            "year": 1975,
            "category": "Action / Curry Western",
            "language": "Hindi",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "3h 24m",
            "rating": 9.3,
            "synopsis": "Amitabh Bachchan, Dharmendra, and Amjad Khan as Gabbar Singh in India's ultimate action blockbuster.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "16 Vayathinile",
            "year": 1977,
            "category": "Rural Drama / Milestone Cinema",
            "language": "Tamil",
            "quality": "Restored 1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 25m",
            "rating": 9.4,
            "synopsis": "Bharathiraja's legendary directorial debut bringing Tamil cinema out of studios into real villages with Kamal Haasan, Rajinikanth, and Sridevi.",
            "source_mirror": "classic-archive"
        },
        {
            "title": "Star Wars: Episode IV - A New Hope",
            "year": 1977,
            "category": "Sci-Fi Fantasy Epic",
            "language": "English",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 01m",
            "rating": 8.9,
            "synopsis": "George Lucas introduces Luke Skywalker, Darth Vader, and the galaxy far far away.",
            "source_mirror": "world-archive"
        },

        # --- 3. 80s & 90s BLOCKBUSTERS (1980 - 1999) ---
        {
            "title": "Moondram Pirai",
            "year": 1982,
            "category": "Romantic Drama / Emotional Classic",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 20m",
            "rating": 9.2,
            "synopsis": "Balu Mahendra's emotional tour-de-force starring Kamal Haasan and Sridevi with Ilaiyaraaja's music.",
            "source_mirror": "retro-archive"
        },
        {
            "title": "Nayakan",
            "year": 1987,
            "category": "Crime Epic / Mani Ratnam Masterpiece",
            "language": "Tamil",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 55m",
            "rating": 9.6,
            "synopsis": "Time Magazine Top 100 All-Time movie. Kamal Haasan as underworld don Velu Naicker.",
            "source_mirror": "retro-archive"
        },
        {
            "title": "Roja",
            "year": 1992,
            "category": "Romantic Thriller / AR Rahman Debut",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 17m",
            "rating": 9.1,
            "synopsis": "Mani Ratnam's patriotic love story featuring A. R. Rahman's debut soundtrack.",
            "source_mirror": "retro-archive"
        },
        {
            "title": "Baashha",
            "year": 1995,
            "category": "Action Mass / Superstar Cult",
            "language": "Tamil",
            "quality": "Digitally Restored 1080p 5.1",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 45m",
            "rating": 9.7,
            "synopsis": "Superstar Rajinikanth's definitive gangster-driver action blockbuster: 'Naan oru thadava sonna, nooru thadava sonna madhiri!'",
            "source_mirror": "retro-archive"
        },
        {
            "title": "Dilwale Dulhania Le Jayenge (DDLJ)",
            "year": 1995,
            "category": "Romance / Bollywood Milestone",
            "language": "Hindi",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "3h 10m",
            "rating": 9.1,
            "synopsis": "Shah Rukh Khan and Kajol in Indian cinema's longest-running romantic phenomenon.",
            "source_mirror": "retro-archive"
        },
        {
            "title": "Indian (Senapathy)",
            "year": 1996,
            "category": "Vigilante Action / Shankar",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "3h 05m",
            "rating": 9.3,
            "synopsis": "Kamal Haasan as Senapathy, the INA veteran waging war against corruption using Varma Kalai.",
            "source_mirror": "retro-archive"
        },
        {
            "title": "Padayappa",
            "year": 1999,
            "category": "Mass Action / Rajinikanth",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 55m",
            "rating": 9.4,
            "synopsis": "Superstar Rajinikanth and Ramya Krishnan in the iconic clash of wills and power.",
            "source_mirror": "retro-archive"
        },
        {
            "title": "The Matrix",
            "year": 1999,
            "category": "Sci-Fi Action / Groundbreaking",
            "language": "English",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 16m",
            "rating": 9.1,
            "synopsis": "Keanu Reeves discovers the simulated reality created by AI to subdue humanity.",
            "source_mirror": "world-archive"
        },

        # --- 4. 2000s & 2010s MODERN ERA (2000 - 2019) ---
        {
            "title": "Ghilli",
            "year": 2004,
            "category": "Sports Action / Thalapathy Vijay Cult",
            "language": "Tamil",
            "quality": "4K Ultra HD Remaster",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 45m",
            "rating": 9.5,
            "synopsis": "Thalapathy Vijay and Prakash Raj in Tamil cinema's ultimate repeat-watch sports action sensation.",
            "source_mirror": "modern-archive"
        },
        {
            "title": "Anniyan",
            "year": 2005,
            "category": "Psychological Action / Shankar",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "3h 01m",
            "rating": 9.2,
            "synopsis": "Chiyaan Vikram as Ambi, Remo, and the terrifying vigilante Anniyan using Garuda Purana punishments.",
            "source_mirror": "modern-archive"
        },
        {
            "title": "Sivaji The Boss",
            "year": 2007,
            "category": "Mass Action / Shankar & Rajini",
            "language": "Tamil",
            "quality": "1080p FHD Remastered",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "3h 08m",
            "rating": 9.3,
            "synopsis": "Rajinikanth takes down illegal black money barons with signature swagger and style.",
            "source_mirror": "modern-archive"
        },
        {
            "title": "Enthiran (The Robot)",
            "year": 2010,
            "category": "Sci-Fi Action / Shankar",
            "language": "Tamil",
            "quality": "1080p FHD 5.1",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 57m",
            "rating": 9.2,
            "synopsis": "Superstar Rajinikanth and Aishwarya Rai in India's groundbreaking robot and artificial intelligence spectacle.",
            "source_mirror": "modern-archive"
        },
        {
            "title": "Mankatha",
            "year": 2011,
            "category": "Heist Action / Thala Ajith 50th",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 40m",
            "rating": 9.3,
            "synopsis": "Thala Ajith Kumar plays the ultimate unapologetic corrupt cop Vinayak Mahadev in a 500-crore IPL betting heist.",
            "source_mirror": "modern-archive"
        },
        {
            "title": "Baahubali 2: The Conclusion",
            "year": 2017,
            "category": "Pan-India Historical Epic",
            "language": "Telugu",
            "quality": "4K Ultra HD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 47m",
            "rating": 9.4,
            "synopsis": "SS Rajamouli's earth-shattering epic reveals why Kattappa killed Baahubali.",
            "source_mirror": "modern-archive"
        },
        {
            "title": "Avengers: Endgame",
            "year": 2019,
            "category": "Superhero Epic / Marvel Studios",
            "language": "English",
            "quality": "4K IMAX Enhanced",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "3h 01m",
            "rating": 9.4,
            "synopsis": "The culmination of 22 MCU films as the Avengers assemble for one final stand against Thanos.",
            "source_mirror": "world-archive"
        },

        # --- 5. CURRENT ERA (2020 - 2026) ---
        {
            "title": "Master",
            "year": 2021,
            "category": "Action Thriller / Thalapathy & VJS",
            "language": "Tamil",
            "quality": "1080p FHD 5.1",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 59m",
            "rating": 8.8,
            "synopsis": "Lokesh Kanagaraj directs Thalapathy Vijay and Vijay Sethupathi in an explosive face-off.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Vikram",
            "year": 2022,
            "category": "Action / Lokesh Cinematic Universe",
            "language": "Tamil",
            "quality": "1080p FHD 5.1",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 54m",
            "rating": 9.3,
            "synopsis": "Kamal Haasan, Fahadh Faasil, and Vijay Sethupathi with Suriya's explosive Rolex entry.",
            "source_mirror": "current-archive"
        },
        {
            "title": "RRR",
            "year": 2022,
            "category": "Action Epic / Oscar Winner",
            "language": "Telugu",
            "quality": "4K Ultra HD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "3h 07m",
            "rating": 9.2,
            "synopsis": "SS Rajamouli's global phenomenon starring Ram Charan and Jr NTR.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Jailer",
            "year": 2023,
            "category": "Action Comedy / Superstar",
            "language": "Tamil",
            "quality": "1080p FHD 5.1",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 48m",
            "rating": 8.9,
            "synopsis": "Superstar Rajinikanth as Muthuvel Pandian with Shiva Rajkumar and Mohanlal cameos.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Leo",
            "year": 2023,
            "category": "Action Thriller / LCU",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 44m",
            "rating": 8.7,
            "synopsis": "Thalapathy Vijay as Parthiban/Leo Das in Lokesh Kanagaraj's adrenaline-charged action saga.",
            "source_mirror": "current-archive"
        },
        {
            "title": "The Greatest of All Time (GOAT)",
            "year": 2024,
            "category": "Sci-Fi Action / Thalapathy Vijay",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "3h 03m",
            "rating": 8.6,
            "synopsis": "Venkat Prabhu directs Thalapathy Vijay in high-stakes dual-role espionage and action.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Amaran",
            "year": 2024,
            "category": "Biographical War Drama",
            "language": "Tamil",
            "quality": "1080p FHD",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 49m",
            "rating": 9.1,
            "synopsis": "Sivakarthikeyan and Sai Pallavi in the heroic true story of Major Mukund Varadarajan AC.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Coolie",
            "year": 2025,
            "category": "Action Thriller / Lokesh & Rajini",
            "language": "Tamil",
            "quality": "1080p FHD Pre-Release",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "2h 45m",
            "rating": 9.3,
            "synopsis": "Superstar Rajinikanth teams up with Lokesh Kanagaraj with Anirudh's high-octane background score.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Good Bad Ugly",
            "year": 2025,
            "category": "Action Thriller / AK 63",
            "language": "Tamil",
            "quality": "1080p FHD Pre-Release",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 38m",
            "rating": 9.1,
            "synopsis": "Adhik Ravichandran directs Thala Ajith Kumar in a wildly energetic action entertainer.",
            "source_mirror": "current-archive"
        },
        {
            "title": "Thalapathy 69",
            "year": 2026,
            "category": "Political Action / Vijay Finale",
            "language": "Tamil",
            "quality": "1080p FHD 2026 Release",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 55m",
            "rating": 9.6,
            "synopsis": "H. Vinoth directs Thalapathy Vijay in his monumental cinematic swansong before full-time public leadership.",
            "source_mirror": "future-releases"
        },
        {
            "title": "Avengers: Doomsday",
            "year": 2026,
            "category": "Superhero / Marvel Multiverse",
            "language": "English",
            "quality": "1080p FHD Official Teaser Feed",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 45m",
            "rating": 9.4,
            "synopsis": "Robert Downey Jr. returns to the Marvel Cinematic Universe as Doctor Victor von Doom.",
            "source_mirror": "future-releases"
        },

        # --- 6. FUTURE ANTICIPATED RELEASES (2027 - 2030+) ---
        {
            "title": "Avengers: Secret Wars",
            "year": 2027,
            "category": "Multiverse Climax / Marvel Studios",
            "language": "English",
            "quality": "4K Ultra HD Future Showcase",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "3h 15m",
            "rating": 9.8,
            "synopsis": "The Russo Brothers direct the grand finale of the Marvel Multiverse Saga bringing together all timelines.",
            "source_mirror": "future-releases"
        },
        {
            "title": "Rolex: Blood and Gold",
            "year": 2027,
            "category": "Crime Syndicate / LCU Prequel",
            "language": "Tamil",
            "quality": "1080p FHD Concept Showcase",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 40m",
            "rating": 9.7,
            "synopsis": "Suriya stars in the standalone origin story of the ruthless underworld kingpin Rolex.",
            "source_mirror": "future-releases"
        },
        {
            "title": "Kalki 2898 AD: Part 2",
            "year": 2027,
            "category": "Mythological Sci-Fi / Pan-World Epic",
            "language": "Telugu",
            "quality": "1080p FHD Showcase",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "3h 10m",
            "rating": 9.6,
            "synopsis": "Nag Ashwin continues the mythological conflict between Supreme Yaskin, Ashwatthama, Bhairava, and Karna.",
            "source_mirror": "future-releases"
        },
        {
            "title": "Pushpa 3: The Roar",
            "year": 2027,
            "category": "Action Thriller / Sukumar & Bunny",
            "language": "Telugu",
            "quality": "1080p FHD Future Preview",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "2h 50m",
            "rating": 9.3,
            "synopsis": "Allu Arjun returns as Pushpa Raj taking his red sandalwood empire to global waters.",
            "source_mirror": "future-releases"
        },
        {
            "title": "SSMB29: Global Jungle Adventure",
            "year": 2027,
            "category": "Globe-trotting Adventure / Rajamouli",
            "language": "Telugu",
            "quality": "4K Ultra HD Preview",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "duration": "3h 05m",
            "rating": 9.8,
            "synopsis": "SS Rajamouli directs Mahesh Babu in an Indiana Jones-style international jungle treasure hunt adventure.",
            "source_mirror": "future-releases"
        },
        {
            "title": "KGF: Chapter 3",
            "year": 2028,
            "category": "Period Action / Hombale",
            "language": "Kannada",
            "quality": "1080p FHD Showcase",
            "poster_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "duration": "2h 55m",
            "rating": 9.5,
            "synopsis": "Prashanth Neel uncovers Rocky Bhai's overseas crime empire between 1978 and 1981.",
            "source_mirror": "future-releases"
        },
        {
            "title": "Salaar: Part 2 - Shouryaanga Parvam",
            "year": 2028,
            "category": "Dark Action / Prabhas & Prithviraj",
            "language": "Telugu",
            "quality": "1080p FHD Showcase",
            "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "duration": "2h 50m",
            "rating": 9.2,
            "synopsis": "The blood-soaked clash between Deva and Varadharaja Mannar in the kingdom of Khansaar.",
            "source_mirror": "future-releases"
        },
        {
            "title": "Interstellar: Beyond Horizons",
            "year": 2030,
            "category": "Cosmic Sci-Fi / Deep Space",
            "language": "English",
            "quality": "4K IMAX Conceptual Showcase",
            "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "duration": "3h 20m",
            "rating": 9.9,
            "synopsis": "Humanity's journey into the five-dimensional tesseract and the colonization of Edmund's planet.",
            "source_mirror": "future-releases"
        }
    ]

    added = 0
    updated = 0
    for mdata in movies_data:
        m, created = Movie.objects.update_or_create(
            title=mdata['title'],
            defaults=mdata
        )
        if created:
            added += 1
            print(f"  + Added: [{m.year}] {m.title} ({m.language})")
        else:
            updated += 1

    print(f"\nEra Expansion Complete! Added: {added}, Updated: {updated}. Total Movies: {Movie.objects.count()}")

    # --- 7. TV CHANNELS: 24/7 RETRO & CLASSIC LIVE TV CHANNELS ---
    cat_movies = Category.objects.filter(slug='movies').first() or Category.objects.first()
    cat_ent = Category.objects.filter(slug='entertainment').first() or Category.objects.first()

    retro_channels = [
        {
            "name": "Classic Tamil Cinema 24x7",
            "category": cat_movies,
            "language": "Tamil",
            "quality": "1080p FHD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "logo_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        },
        {
            "name": "90s Tamil Superhits TV",
            "category": cat_movies,
            "language": "Tamil",
            "quality": "1080p FHD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "logo_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        },
        {
            "name": "Golden Retro Cinema 24x7",
            "category": cat_movies,
            "language": "Tamil",
            "quality": "1080p FHD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "logo_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        },
        {
            "name": "Tollywood Vintage Hits TV",
            "category": cat_movies,
            "language": "Telugu",
            "quality": "1080p FHD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "logo_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        },
        {
            "name": "Bollywood Retro Classics TV",
            "category": cat_movies,
            "language": "Hindi",
            "quality": "1080p FHD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "logo_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        },
        {
            "name": "World Cinema Classics 24x7",
            "category": cat_movies,
            "language": "English",
            "quality": "1080p FHD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "logo_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        },
        {
            "name": "Future Sci-Fi Cinema Live",
            "category": cat_movies,
            "language": "English",
            "quality": "4K Ultra HD",
            "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            "logo_url": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=200&q=80",
            "is_active": True
        }
    ]

    ch_added = 0
    for chdata in retro_channels:
        ch, created = Channel.objects.update_or_create(
            name=chdata['name'],
            defaults=chdata
        )
        if created:
            ch_added += 1
            print(f"  + Added Channel: {ch.name} [{ch.language}]")

    print(f"\nChannel Expansion Complete! Added: {ch_added}. Total Channels: {Channel.objects.count()}")

if __name__ == '__main__':
    expand_all_eras()
