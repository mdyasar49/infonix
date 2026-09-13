import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Channel

print("=== AUDITING ALL CHANNELS FOR LANGUAGE MISMATCHES ===")
non_tamil_kw = {
    'telugu': ['telugu', 'etv', 'gemini', 'sakshi', 'tv9 telugu', 'ntv telugu', 'abn andhra', 't news', 'v6 news', '10tv', 'mahaa news', 'raj news telugu', 'bhakthi tv', 'subhavaartha'],
    'malayalam': ['malayalam', 'asianet', 'surya', 'mazhavil', 'kairali', 'amrita', 'manorama news', 'mathrubhumi', 'mediaone', 'twentyfour', 'jaihind', 'kaumudy', 'reporter tv', 'shalom'],
    'kannada': ['kannada', 'udaya', 'suvarna', 'public tv', 'tv9 kannada', 'news18 kannada', 'kasthuri', 'dighvijay', 'ayush tv', 'siri kannada'],
    'hindi': ['hindi', 'aaj tak', 'abp news', 'ndtv india', 'zee news', 'india tv', 'news nation', 'republic bharat', 'tv9 bharatvarsh', 'sansad tv', 'dd national', 'dd news', 'star plus', 'colors tv', 'sony sab', 'zee tv', 'star bharat', 'dangal'],
    'english': ['english', 'cnn', 'bbc', 'al jazeera', 'dw english', 'france 24', 'euronews', 'nhk world', 'bloomberg', 'cnbc', 'times now', 'india today', 'wion', 'cartoon classics', 'free movies']
}

mislabeled = []

for c in Channel.objects.all():
    name_lower = c.name.lower()
    current_lang = (c.language or '').lower()
    
    # Check if a channel in Tamil category is actually another language
    if current_lang == 'tamil' and 'tamil' not in name_lower:
        for lang, kws in non_tamil_kw.items():
            for kw in kws:
                if kw in name_lower:
                    mislabeled.append((c.id, c.name, c.language, lang.capitalize()))
                    break

print(f"Found {len(mislabeled)} misclassified channels currently marked as Tamil:")
for cid, name, old_l, new_l in mislabeled:
    print(f"  [{cid}] {name} (was: {old_l}) -> should be: {new_l}")
