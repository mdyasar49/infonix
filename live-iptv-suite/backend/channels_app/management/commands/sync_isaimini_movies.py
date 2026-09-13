from django.core.management.base import BaseCommand
from channels_app.isaimini_service import IsaiminiService

class Command(BaseCommand):
    help = 'Resolve dynamic Isaimini mirrors and sync Tamil Movies into database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Starting Isaimini Dynamic Mirror Resolution & Movie Sync ==='))
        result = IsaiminiService.sync_movies()
        self.stdout.write(self.style.SUCCESS(f"Active mirror: {result['active_mirror']}"))
        self.stdout.write(self.style.SUCCESS(f"Added {result['added_count']} new movies."))
        self.stdout.write(self.style.SUCCESS(f"Total movies in database: {result['total_movies']}"))
