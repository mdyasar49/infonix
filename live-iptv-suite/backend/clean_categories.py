import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')
django.setup()

from channels_app.models import Channel, Category

MERGES = {
    "kids": ("Kids & Cartoons", "kids", "child_care", 2),
    "kids-cartoons": ("Kids & Cartoons", "kids", "child_care", 2),
    "news": ("News 24x7", "news", "newspaper", 3),
    "news-24x7": ("News 24x7", "news", "newspaper", 3),
    "music": ("Music & Lifestyle", "music", "music_note", 4),
    "music-lifestyle": ("Music & Lifestyle", "music", "music_note", 4),
    "sports-live": ("Sports Live", "sports", "sports_cricket", 5),
    "movies-cinema": ("Movies & Cinema", "movies", "movie", 6),
    "entertainment": ("Entertainment", "entertainment", "tv", 7),
    "infotainment": ("Infotainment", "infotainment", "public", 8),
    "devotional": ("Devotional", "devotional", "self_improvement", 9),
    "tamil-live": ("Tamil Live", "tamil-live", "live_tv", 1),
}

# Create/Get canonical categories
canonical_cats = {}
for old_slug, (name, target_slug, icon, order) in MERGES.items():
    if target_slug not in canonical_cats:
        c, _ = Category.objects.get_or_create(
            slug=target_slug,
            defaults={"name": name, "icon": icon, "order": order}
        )
        c.name = name
        c.icon = icon
        c.order = order
        c.save()
        canonical_cats[target_slug] = c

# Reassign channels
for old_slug, (name, target_slug, icon, order) in MERGES.items():
    if old_slug != target_slug:
        old_cat = Category.objects.filter(slug=old_slug).first()
        if old_cat:
            target_cat = canonical_cats[target_slug]
            Channel.objects.filter(category=old_cat).update(category=target_cat)
            old_cat.delete()

# Ensure any channel having "Tamil" in name or language is tagged to Tamil Live if in general entertainment
tamil_cat = canonical_cats["tamil-live"]
Channel.objects.filter(name__icontains="Tamil").update(category=tamil_cat)

print("Merged categories successfully!")
for c in Category.objects.order_by('order'):
    print(f"* [{c.order}] {c.name} ({c.slug}): {c.channels.count()} channels")

print(f"\nTotal channels in DB: {Channel.objects.count()}")
