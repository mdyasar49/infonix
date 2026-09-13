from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, default='tv')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Channel(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='channels')
    stream_url = models.CharField(max_length=2000)
    logo_url = models.CharField(max_length=2000, blank=True, null=True)
    quality = models.CharField(max_length=20, default='HD')
    language = models.CharField(max_length=50, default='Tamil')
    is_active = models.BooleanField(default=True)
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-views_count', 'name']

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Movie(models.Model):
    title = models.CharField(max_length=255)
    year = models.IntegerField(default=2024)
    category = models.CharField(max_length=100, default='Tamil Movies')
    language = models.CharField(max_length=50, default='Tamil')
    quality = models.CharField(max_length=50, default='1080p HD')
    poster_url = models.CharField(max_length=2000, blank=True, null=True)
    stream_url = models.CharField(max_length=2000)
    duration = models.CharField(max_length=50, default='2h 30m')
    rating = models.FloatField(default=8.0)
    synopsis = models.TextField(blank=True, default='')
    source_mirror = models.CharField(max_length=255, default='isaimini')
    views_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year', '-views_count', 'title']

    def __str__(self):
        return f"{self.title} ({self.year})"
