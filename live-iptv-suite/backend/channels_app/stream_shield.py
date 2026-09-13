import base64
import hashlib
import hmac
import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from django.conf import settings

# Shared Secret Key for Opaque Ticket Encryption
SHIELD_KEY = getattr(settings, 'SECRET_KEY', 'infonix-stream-shield-secret-token-key').encode('utf-8')

def generate_stream_ticket(url, referer='', extra_headers=None, expiry_seconds=86400):
    """
    Generates a tamper-proof, base64url-encoded ticket containing
    the upstream target URL and necessary stealth headers.
    Completely conceals upstream domain, token, and IP address from the browser.
    """
    payload = {
        'u': url,
        'r': referer,
        'h': extra_headers or {},
        'e': int(time.time()) + expiry_seconds
    }
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    sig = hmac.new(SHIELD_KEY, payload_json, hashlib.sha256).digest()[:16]
    combined = sig + payload_json
    return base64.urlsafe_b64encode(combined).decode('utf-8').rstrip('=')

def decode_stream_ticket(ticket):
    """
    Validates and decodes an opaque stream ticket.
    Returns the payload dictionary or raises ValueError if tampered/expired.
    """
    # Pad base64 string
    padding = '=' * ((4 - len(ticket) % 4) % 4)
    raw = base64.urlsafe_b64decode((ticket + padding).encode('utf-8'))
    
    if len(raw) < 17:
        raise ValueError("Invalid ticket length")
        
    sig = raw[:16]
    payload_json = raw[16:]
    expected_sig = hmac.new(SHIELD_KEY, payload_json, hashlib.sha256).digest()[:16]
    
    if not hmac.compare_digest(sig, expected_sig):
        raise ValueError("Tampered ticket signature")
        
    payload = json.loads(payload_json.decode('utf-8'))
    if payload.get('e', 0) < time.time():
        raise ValueError("Ticket expired")
        
    return payload

def rewrite_hls_manifest(manifest_text, base_url, referer='', target_language=None):
    """
    Rewrites all segment (.ts), key (.key), and variant (.m3u8) URLs in an HLS manifest
    into internal /api/stream/ticket/<ticket>/ endpoints so the client browser NEVER
    contacts or exposes upstream IP addresses or domains.
    
    Audio Language Matching:
    - Rewrites URI="..." in #EXT-X-MEDIA:TYPE=AUDIO
    - When target_language is provided (e.g. 'Tamil', 'Telugu', 'Hindi', 'Malayalam'),
      automatically promotes the matching audio track to DEFAULT=YES, AUTOSELECT=YES
      and sets non-matching audio tracks to DEFAULT=NO so players always play the correct audio language!
    """
    lines = manifest_text.splitlines()
    rewritten_lines = []
    target_lang_str = (target_language or '').lower().strip()
    
    for line in lines:
        clean_line = line.strip()
        if not clean_line:
            continue
            
        if clean_line.startswith('#EXT-X-KEY:'):
            # Obfuscate DRM or AES key URI
            uri_match = re.search(r'URI="([^"]+)"', clean_line)
            if uri_match:
                orig_uri = uri_match.group(1)
                full_uri = urllib.parse.urljoin(base_url, orig_uri)
                ticket = generate_stream_ticket(full_uri, referer=referer)
                shield_url = f"/api/stream/ticket/{ticket}/"
                rewritten_line = clean_line.replace(f'URI="{orig_uri}"', f'URI="{shield_url}"')
                rewritten_lines.append(rewritten_line)
                continue

        if clean_line.startswith('#EXT-X-MEDIA:') and 'TYPE=AUDIO' in clean_line:
            mod_line = clean_line
            # Rewrite audio sub-playlist URI if present
            uri_match = re.search(r'URI="([^"]+)"', mod_line)
            if uri_match:
                orig_uri = uri_match.group(1)
                full_uri = urllib.parse.urljoin(base_url, orig_uri)
                ticket = generate_stream_ticket(full_uri, referer=referer)
                shield_url = f"/api/stream/ticket/{ticket}/"
                mod_line = mod_line.replace(f'URI="{orig_uri}"', f'URI="{shield_url}"')

            # Smart Audio Language Auto-Select: Enforce channel language as default
            if target_lang_str:
                line_lower = mod_line.lower()
                is_target_audio = False

                # Comprehensive language code mapping
                lang_match_map = {
                    'tamil': ['language="ta"', 'name="tamil"', 'tam'],
                    'telugu': ['language="te"', 'name="telugu"', 'tel'],
                    'malayalam': ['language="ml"', 'name="malayalam"', 'mal'],
                    'hindi': ['language="hi"', 'name="hindi"', 'hin'],
                    'kannada': ['language="kn"', 'name="kannada"', 'kan'],
                    'english': ['language="en"', 'name="english"', 'eng'],
                    'bengali': ['language="bn"', 'name="bengali"', 'ben', 'ban'],
                    'marathi': ['language="mr"', 'name="marathi"', 'mar'],
                    'gujarati': ['language="gu"', 'name="gujarati"', 'guj'],
                    'punjabi': ['language="pa"', 'name="punjabi"', 'pan'],
                    'odia': ['language="or"', 'name="odia"', 'ori'],
                    'urdu': ['language="ur"', 'name="urdu"', 'urd'],
                    'french': ['language="fr"', 'name="french"', 'fre', 'fra'],
                    'spanish': ['language="es"', 'name="spanish"', 'spa'],
                    'german': ['language="de"', 'name="german"', 'ger', 'deu'],
                    'japanese': ['language="ja"', 'name="japanese"', 'jpn'],
                    'korean': ['language="ko"', 'name="korean"', 'kor'],
                    'chinese': ['language="zh"', 'name="chinese"', 'chi', 'zho'],
                    'arabic': ['language="ar"', 'name="arabic"', 'ara'],
                    'portuguese': ['language="pt"', 'name="portuguese"', 'por'],
                    'russian': ['language="ru"', 'name="russian"', 'rus'],
                    'italian': ['language="it"', 'name="italian"', 'ita'],
                }

                if target_lang_str in lang_match_map:
                    is_target_audio = any(pattern in line_lower for pattern in lang_match_map[target_lang_str])
                else:
                    # Fallback: match target language name directly
                    is_target_audio = target_lang_str in line_lower

                if is_target_audio:
                    mod_line = re.sub(r'DEFAULT=\w+', 'DEFAULT=YES', mod_line)
                    mod_line = re.sub(r'AUTOSELECT=\w+', 'AUTOSELECT=YES', mod_line)
                else:
                    # Not the channel language -> DEFAULT=NO
                    mod_line = re.sub(r'DEFAULT=\w+', 'DEFAULT=NO', mod_line)

            rewritten_lines.append(mod_line)
            continue
                
        if clean_line.startswith('#'):
            rewritten_lines.append(clean_line)
        else:
            # Segment or nested playlist URI
            full_uri = urllib.parse.urljoin(base_url, clean_line)
            ticket = generate_stream_ticket(full_uri, referer=referer)
            shield_url = f"/api/stream/ticket/{ticket}/"
            rewritten_lines.append(shield_url)
            
    return "\n".join(rewritten_lines)

