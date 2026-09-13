import os
import sys
import re
import urllib.request
import ssl
import json
import django

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Channel

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def main():
    print("=== Enriching Channel Logos from JioTV Catchup CDN ===")
    
    url = 'https://jtv-web.pages.dev/jstr.json'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        raw = urllib.request.urlopen(req, context=ctx, timeout=10).read().decode('utf-8', errors='ignore')
        jstr_channels = json.loads(raw)
    except Exception as e:
        print(f"Failed to fetch jstr.json: {e}")
        return

    # Build clean name to logo map
    logo_map = {}
    for item in jstr_channels:
        name = item.get('name', '').strip()
        logo = item.get('logo', '').strip()
        if name and logo.startswith('http'):
            clean_name = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
            logo_map[clean_name] = logo

    print(f"Indexed {len(logo_map)} high-res logos from JioTV Catchup CDN.")

    updated_count = 0
    channels = Channel.objects.all()
    for ch in channels:
        clean_db_name = re.sub(r'[^a-zA-Z0-9]', '', ch.name).lower()
        # Strip common prefixes like 'hd', 'tv'
        for k, logo_url in logo_map.items():
            if clean_db_name == k or (len(clean_db_name) > 4 and clean_db_name in k) or (len(k) > 4 and k in clean_db_name):
                # If current logo is generic flaticon fallback or missing
                if not ch.logo_url or 'flaticon' in ch.logo_url or 'weebly' in ch.logo_url:
                    ch.logo_url = logo_url
                    ch.save(update_fields=['logo_url'])
                    updated_count += 1
                    break

    print(f"Successfully enriched {updated_count} channels with official high-res JioTV logos!")

if __name__ == '__main__':
    main()
