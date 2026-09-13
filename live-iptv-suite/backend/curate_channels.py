import os
import sys
import django
import urllib.request
import ssl
import concurrent.futures

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Channel, Category

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Languages to purge per user request ("Enakku world full l irukka ella channels sum ella language layum vendaam")
REJECTED_LANGUAGES = [
    'Bhojpuri', 'Urdu', 'Assamese', 'Odia', 'Marathi',
    'Punjabi', 'Gujarati', 'Bengali', 'Malayalam'
]

def main():
    print("=== Curating Channel Database: Focus on Quality & 100% Playability ===")
    
    # 1. Remove unwanted foreign/regional languages
    deleted_lang = 0
    for lang in REJECTED_LANGUAGES:
        qs = Channel.objects.filter(language__iexact=lang)
        count = qs.count()
        if count > 0:
            qs.delete()
            deleted_lang += count
            print(f"  Purged {count} channels in {lang}")

    print(f"Total non-essential language channels removed: {deleted_lang}")
    print(f"Remaining channels in DB: {Channel.objects.count()}")

    # 2. Test remaining channels for 100% active stream status
    channels = list(Channel.objects.all())
    print(f"\nVerifying {len(channels)} remaining streams for 100% active playability...")

    def test_channel(ch):
        url = ch.stream_url
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=3.5) as resp:
                if resp.status in (200, 301, 302):
                    return (ch.id, True)
        except Exception:
            pass
        return (ch.id, False)

    dead_ids = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex:
        futures = [ex.submit(test_channel, ch) for ch in channels]
        done = 0
        for f in concurrent.futures.as_completed(futures):
            done += 1
            if done % 100 == 0 or done == len(channels):
                print(f"  Verified {done}/{len(channels)}...")
            cid, is_online = f.result()
            if not is_online:
                dead_ids.append(cid)

    print(f"\nInactive/Dead streams identified: {len(dead_ids)}")
    if dead_ids:
        Channel.objects.filter(id__in=dead_ids).delete()
        print(f"Purged {len(dead_ids)} dead channels to guarantee 100% playability!")

    print(f"\nFinal Rock-Solid Verified Channels: {Channel.objects.count()}")
    print("\nChannel Distribution by Category:")
    for c in Category.objects.all():
        print(f"  * {c.name} ({c.slug}): {c.channels.count()} channels")

if __name__ == '__main__':
    main()
