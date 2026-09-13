import sys
import concurrent.futures
from django.core.management.base import BaseCommand
from channels_app.models import Channel, Category
from channels_app.native_stream_engine import NativeStreamEngine

class Command(BaseCommand):
    help = 'Natively sync and health-check live IPTV streams directly from origin APIs'

    def handle(self, *args, **options):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

        self.stdout.write(self.style.SUCCESS('=== Starting Native Origin Stream Ingestion ==='))

        categories_map = {c.slug: c for c in Category.objects.all()}
        self.stdout.write(f'Active Categories: {list(categories_map.keys())}')

        candidates = NativeStreamEngine.harvest_all_streams()
        self.stdout.write(f'Harvested {len(candidates)} streams directly from origin broadcast APIs.')

        self.stdout.write('Validating live stream playability across 30 concurrent threads...')
        active_streams = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
            future_to_item = {executor.submit(NativeStreamEngine.verify_stream, item): item for item in candidates}
            for future in concurrent.futures.as_completed(future_to_item):
                res = future.result()
                if res:
                    active_streams.append(res)

        self.stdout.write(self.style.SUCCESS(f'Verified {len(active_streams)} streams actively online and playable!'))

        # Save to Database
        saved_count = 0
        for s in active_streams:
            cat_slug = s.get('category_slug', 'tamil-live')
            category = categories_map.get(cat_slug) or categories_map.get('tamil-live')
            if not category:
                category = Category.objects.first()

            existing = Channel.objects.filter(stream_url=s['stream_url'])
            if existing.exists():
                first = existing.first()
                first.name = s['name']
                if s.get('logo_url'):
                    first.logo_url = s['logo_url']
                first.category = category
                first.quality = s.get('quality', 'HD 1080p')
                first.language = s.get('language', 'Tamil')
                first.is_active = True
                first.save()
                if existing.count() > 1:
                    existing.exclude(id=first.id).delete()
            else:
                Channel.objects.create(
                    stream_url=s['stream_url'],
                    name=s['name'],
                    logo_url=s.get('logo_url', ''),
                    category=category,
                    quality=s.get('quality', 'HD 1080p'),
                    language=s.get('language', 'Tamil'),
                    is_active=True,
                )
            saved_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully synchronized {saved_count} channels natively into database!'))
