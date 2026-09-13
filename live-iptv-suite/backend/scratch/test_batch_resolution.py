import sys
import os
import django

sys.path.append(r'd:\infonix\live-iptv-suite\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Movie
from channels_app.isaimini_stealth import IsaiminiStealthEngine

engine = IsaiminiStealthEngine()
for title in ['Mandaadi', 'Sardar 2', 'Viduthalai', 'UI', 'Vengeance', 'Bhagyalakshmi']:
    m = Movie.objects.filter(title__icontains=title).first()
    if m:
        res = engine.resolve_live_stream_for_movie(m.source_mirror)
        if res:
            print(f"[OK] {m.title} ({m.year}) -> {res['server_type']} : {res['stream_url'][:60]}...")
        else:
            print(f"[FAIL] {m.title} ({m.year})")
