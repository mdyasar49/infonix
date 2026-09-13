import os
import threading
import time
from django.apps import AppConfig


class ChannelsAppConfig(AppConfig):
    name = 'channels_app'

    def ready(self):
        # Only launch background sync worker in the main reloaded process
        if os.environ.get('RUN_MAIN') == 'true':
            def auto_sync_worker():
                time.sleep(20)  # Initial grace period on startup
                while True:
                    try:
                        from .isaimini_stealth import sync_all_universal_movies
                        print("\n[AutoSync] Checking online movie sources for new updates...")
                        res = sync_all_universal_movies()
                        print(f"[AutoSync] Background sync finished: {res['total']} movies active.")
                    except Exception as e:
                        print(f"[AutoSync] Background sync error: {e}")
                    time.sleep(1800)  # Re-check every 30 minutes

            t = threading.Thread(target=auto_sync_worker, daemon=True, name="MovieAutoSyncThread")
            t.start()
