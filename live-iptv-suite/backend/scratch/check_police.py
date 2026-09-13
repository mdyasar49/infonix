import sys
import os
import django
import re

sys.path.append(r'd:\infonix\live-iptv-suite\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Movie
from channels_app.isaimini_stealth import IsaiminiStealthEngine

engine = IsaiminiStealthEngine()
m = Movie.objects.filter(title__icontains='Bhagyalakshmi').first()
print('Bhagyalakshmi rel_path:', m.source_mirror)
html = engine.fetch('https://moviezda.com' + m.source_mirror)

links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
for href, txt in links:
    clean = re.sub(r'<[^>]+>', '', txt).strip()
    print("  ", clean, "->", href)
