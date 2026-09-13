import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Channel

fixes = {
    1354: 'Malayalam',  # C.malayalam
    1406: 'English',    # Cartoon Classics
    1313: 'Malayalam',  # DD Malayalam
    12:   'Telugu',     # ETV Bal Bharat
    1337: 'Malayalam',  # Jaihind tv
    1338: 'Malayalam',  # Shalom.globel.tv
}

for cid, new_lang in fixes.items():
    try:
        c = Channel.objects.get(id=cid)
        old = c.language
        c.language = new_lang
        c.save(update_fields=['language'])
        print(f"Fixed Channel {cid} ({c.name}): {old} -> {new_lang}")
    except Channel.DoesNotExist:
        pass

print("Database language classification updated successfully!")
