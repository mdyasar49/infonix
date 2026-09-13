from rest_framework import serializers
from .models import Category, Channel, Movie

class ChannelSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = [
            'id', 'name', 'category', 'category_name', 'category_slug',
            'stream_url', 'logo_url', 'quality', 'language', 'is_active',
            'views_count', 'created_at'
        ]

    def get_stream_url(self, obj):
        return f"/api/stream/channel/{obj.id}/"

class CategorySerializer(serializers.ModelSerializer):
    channel_count = serializers.IntegerField(source='channels.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'order', 'channel_count']

class MovieSerializer(serializers.ModelSerializer):
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'year', 'category', 'language', 'quality',
            'poster_url', 'stream_url', 'duration', 'rating', 'synopsis',
            'views_count', 'created_at'
        ]

    def get_stream_url(self, obj):
        return f"/api/stream/movie/{obj.id}/"
