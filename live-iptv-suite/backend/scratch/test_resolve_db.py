import sys
import os
import django

sys.path.append(r'd:\infonix\live-iptv-suite\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Movie
from channels_app.isaimini_stealth import IsaiminiStealthEngine

engine = IsaiminiStealthEngine()

movie = Movie.objects.filter(title__icontains='Mandaadi').first()
print(f"Testing Movie: {movie.title} ({movie.year})")
print(f"Source Mirror (rel_path): {movie.source_mirror}")

result = engine.resolve_live_stream_for_movie(movie.source_mirror)
print("Resolution Result:")
print(result)
