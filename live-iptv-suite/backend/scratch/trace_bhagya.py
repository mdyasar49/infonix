import sys
import os
import django

sys.path.append(r'd:\infonix\live-iptv-suite\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.isaimini_stealth import IsaiminiStealthEngine

engine = IsaiminiStealthEngine()
origin = engine.get_active_origin()
movie_url = f"{origin}/bank-of-bhagyalakshmi-2025-tamil-movie/"
print("Movie URL:", movie_url)
html = engine.fetch(movie_url)
print("HTML len:", len(html))

import re
qual_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html)
for href, txt in qual_links:
    if any(k in href.lower() for k in ['original-movie', 'hq-predvd', 'predvd', '-movie/']):
        print("Qual href:", href, "txt:", txt)
        q_url = f"{origin}{href}"
        q_html = engine.fetch(q_url)
        print("Qual HTML len:", len(q_html))
        hd_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', q_html)
        for hh, ht in hd_links:
            if any(r in hh for r in ['1080p', '720p', 'hd', '360p', 'mp4']):
                print("  HD href:", hh, "txt:", ht)
                hd_url = f"{origin}{hh}"
                hd_html = engine.fetch(hd_url)
                print("  HD HTML len:", len(hd_html))
                f_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', hd_html)
                for fh, ft in f_links:
                    if '/download/' in fh or '/file/' in fh:
                        print("    File href:", fh, "txt:", ft)
                        f_url = f"{origin}{fh}"
                        f_html = engine.fetch(f_url)
                        print("    File HTML len:", len(f_html))
                        gw_links = re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', f_html)
                        for gh, gt in gw_links:
                            if any(k in gh for k in ['download', 'server', 'page', 'fastbytes']):
                                print("      GW link:", gh, "txt:", gt)
                                gw_resp_html = engine.fetch(gh, referer=f_url)
                                print("      GW Resp HTML len:", len(gw_resp_html))
                                for nh, nt in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', gw_resp_html):
                                    if any(k in nh for k in ['download', 'page', 'fastbytes', 'mp4', 'onestream', 'file']):
                                        print("        Next link:", nh, "txt:", nt)
                                        final_html = engine.fetch(nh, referer=gh)
                                        print("        Final HTML len:", len(final_html))
                                        for fh2, ft2 in re.findall(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', final_html):
                                            if any(k in fh2 for k in ['download', 'fast', 'mp4', 'onestream', 'php', 'stream']):
                                                print("          Stream/DL Link:", fh2, "txt:", ft2)
                                        break
                                break

                        break
                break
        break


