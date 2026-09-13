import urllib.request
import ssl
from django.http import HttpResponse, StreamingHttpResponse, JsonResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Category, Channel, Movie
from .serializers import CategorySerializer, ChannelSerializer, MovieSerializer
from .isaimini_stealth import UniversalMovieStealthEngine, IsaiminiStealthEngine

class CategoryListView(APIView):
    def get(self, request):
        from django.db.models import Count, Q as DQ
        language = request.query_params.get('language', None)

        if language and language.lower() != 'all':
            categories = Category.objects.annotate(
                channel_count=Count('channels', filter=DQ(channels__is_active=True, channels__language__icontains=language))
            ).order_by('order', 'id')
        else:
            categories = Category.objects.annotate(
                channel_count=Count('channels', filter=DQ(channels__is_active=True))
            ).order_by('order', 'id')

        data = [{
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'icon': cat.icon,
            'order': cat.order,
            'channel_count': cat.channel_count,
        } for cat in categories]
        return Response(data)

class LanguageListView(APIView):
    def get(self, request):
        from django.db.models import Count
        langs = (
            Channel.objects.filter(is_active=True)
            .values('language')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        data = [{'language': l['language'] or 'General', 'count': l['count']} for l in langs if l['language']]
        return Response(data)

class ChannelListView(generics.ListAPIView):
    serializer_class = ChannelSerializer

    def get_queryset(self):
        queryset = Channel.objects.select_related('category').filter(is_active=True)
        category_slug = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        language = self.request.query_params.get('language', None)

        if category_slug and category_slug != 'all':
            queryset = queryset.filter(category__slug=category_slug)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(category__name__icontains=search)
            )
        if language and language.lower() != 'all':
            queryset = queryset.filter(language__icontains=language)

        return queryset

class ChannelDetailView(APIView):
    def get(self, request, pk):
        try:
            channel = Channel.objects.get(pk=pk, is_active=True)
            channel.views_count += 1
            channel.save(update_fields=['views_count'])
            serializer = ChannelSerializer(channel)
            return Response(serializer.data)
        except Channel.DoesNotExist:
            return Response({'error': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

class MovieListView(generics.ListAPIView):
    serializer_class = MovieSerializer

    def get_queryset(self):
        queryset = Movie.objects.all()
        year = self.request.query_params.get('year', None)
        category = self.request.query_params.get('category', None)
        language = self.request.query_params.get('language', None)
        search = self.request.query_params.get('search', None)

        year = self.request.query_params.get('year', None)
        year_min = self.request.query_params.get('year_min', None)
        year_max = self.request.query_params.get('year_max', None)
        era = self.request.query_params.get('era', None)
        category = self.request.query_params.get('category', None)
        language = self.request.query_params.get('language', None)
        search = self.request.query_params.get('search', None)

        if year:
            try:
                queryset = queryset.filter(year=int(year))
            except (ValueError, TypeError):
                pass
        if year_min:
            try:
                queryset = queryset.filter(year__gte=int(year_min))
            except (ValueError, TypeError):
                pass
        if year_max:
            try:
                queryset = queryset.filter(year__lte=int(year_max))
            except (ValueError, TypeError):
                pass
        if era:
            if era == '2026':
                queryset = queryset.filter(year=2026)
            elif era == '2025':
                queryset = queryset.filter(year=2025)
            elif era == '2024':
                queryset = queryset.filter(year=2024)
            elif era == '2020-2023':
                queryset = queryset.filter(year__gte=2020, year__lte=2023)
            elif era == '2010s':
                queryset = queryset.filter(year__gte=2010, year__lte=2019)
            elif era == '2000s':
                queryset = queryset.filter(year__gte=2000, year__lte=2009)
            elif era == '1990s':
                queryset = queryset.filter(year__gte=1990, year__lte=1999)
            elif era == '1980s':
                queryset = queryset.filter(year__gte=1980, year__lte=1989)
            elif era == '1970s':
                queryset = queryset.filter(year__gte=1970, year__lte=1979)
            elif era == 'vintage':
                queryset = queryset.filter(year__lt=1970)

        if category and category != 'all':
            queryset = queryset.filter(category__icontains=category)
        if language and language.lower() != 'all':
            queryset = queryset.filter(language__icontains=language)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(category__icontains=search) |
                Q(synopsis__icontains=search) |
                Q(language__icontains=search)
            )
        return queryset


class MovieYearsView(APIView):
    """
    Returns available movie release years with count of movies,
    sorted from most recent/future to oldest vintage (1777+).
    """
    def get(self, request):
        from django.db.models import Count
        years_data = (
            Movie.objects.values('year')
            .annotate(count=Count('id'))
            .order_by('-year')
        )
        return Response(list(years_data))


class MovieSyncView(APIView):
    """
    Triggers on-demand synchronization with online sources:
    - Real-time new releases from Isaimini / Moviezda live feed
    - Multi-era vintage classics
    - Hollywood English and Dubbed updates
    - KuttyMovies multi-language feed
    """
    def post(self, request):
        import time
        from .isaimini_stealth import sync_all_universal_movies
        from .ws_manager import ws_manager
        res = sync_all_universal_movies()
        
        # Broadcast real-time update to all connected WebSocket clients
        ws_manager.broadcast_threadsafe({
            "type": "catalog_updated",
            "message": f"Online Sync Complete! Added {res['added']} new movies (Total: {res['total']})",
            "added": res['added'],
            "updated": res['updated'],
            "total": res['total'],
            "timestamp": int(time.time())
        })

        return Response({
            'status': 'success',
            'message': f"Synchronized successfully with online movie sources.",
            'added': res['added'],
            'updated': res['updated'],
            'total': res['total']
        })

    def get(self, request):
        return self.post(request)


class MovieDetailView(APIView):
    def get(self, request, pk):
        try:
            movie = Movie.objects.get(pk=pk)
            movie.views_count += 1
            movie.save(update_fields=['views_count'])
            serializer = MovieSerializer(movie)
            return Response(serializer.data)
        except Movie.DoesNotExist:
            return Response({'error': 'Movie not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            movie = Movie.objects.get(pk=pk)
            stream_url = request.data.get('stream_url')
            if stream_url:
                movie.stream_url = stream_url.strip()
            poster_url = request.data.get('poster_url')
            if poster_url:
                movie.poster_url = poster_url.strip()
            movie.save()
            serializer = MovieSerializer(movie)
            return Response(serializer.data)
        except Movie.DoesNotExist:
            return Response({'error': 'Movie not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        return self.patch(request, pk)

from .stream_shield import generate_stream_ticket, decode_stream_ticket, rewrite_hls_manifest

class MovieStreamShieldView(APIView):
    """
    Cryptographic Stream Shield for Movies:
    - Zero client IP exposure: Server initiates all requests with spoofed Chrome fingerprint.
    - Zero inspect leakage: The browser only ever sees /api/stream/movie/<id>/.
    - Dynamic self-healing: If an origin token expires or domain rotates, automatically re-resolves and continues.
    - Full HTTP 206 Partial Content support for video seeking.
    """
    def get(self, request, pk):
        import time
        from .isaimini_stealth import IsaiminiStealthEngine

        try:
            movie = Movie.objects.get(pk=pk)
            movie.views_count += 1
            movie.save(update_fields=['views_count'])

            cache_key = f"movie_{pk}"
            now = time.time()
            cached = IsaiminiStealthEngine._stream_cache.get(cache_key)

            crawler = IsaiminiStealthEngine()
            if cached and (now - cached['time'] < 1200):
                stream_info = cached['data']
            else:
                path_to_resolve = getattr(movie, 'source_mirror', None) or movie.stream_url
                res = crawler.resolve_live_stream_for_movie(path_to_resolve)
                if not res:
                    res = {
                        "stream_url": movie.stream_url,
                        "referer": crawler.get_active_origin(),
                        "server_type": "fallback-direct"
                    }
                stream_info = res
                IsaiminiStealthEngine._stream_cache[cache_key] = {'data': stream_info, 'time': now}

            target_url = stream_info['stream_url']

            referer = stream_info.get('referer')
            if not referer or referer == 'fallback-direct':
                if any(x in target_url for x in ['fastbytes', 'uptomkv', 'downloadpage', 'moviezda', 'isaimini', 'isaidub', 'kuttymovies']):
                    referer = 'https://movies.downloadpage.xyz/'
                elif 'archive.org' in target_url:
                    referer = 'https://archive.org/'
                else:
                    referer = None

            # Tunnel stream with automatic self-healing retry on upstream token expiry
            return self._stream_upstream(request, target_url, referer, retry_count=0, movie=movie, crawler=crawler, cache_key=cache_key)

        except Movie.DoesNotExist:
            return Response({'error': 'Movie not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Stream shield failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _stream_upstream(self, request, target_url, referer, retry_count, movie, crawler, cache_key):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': '*/*'
        }
        if referer:
            headers['Referer'] = referer

        range_header = request.headers.get('Range') or request.META.get('HTTP_RANGE')
        if range_header:
            headers['Range'] = range_header

        try:
            req = urllib.request.Request(target_url, headers=headers)
            resp = urllib.request.urlopen(req, context=ctx, timeout=15)

            resp_code = resp.status if hasattr(resp, 'status') else resp.getcode()
            content_type = resp.headers.get('Content-Type') or 'video/mp4'
            content_length = resp.headers.get('Content-Length')
            content_range = resp.headers.get('Content-Range')

            def stream_chunks():
                try:
                    while True:
                        chunk = resp.read(64 * 1024)
                        if not chunk:
                            break
                        yield chunk
                finally:
                    resp.close()

            response = StreamingHttpResponse(
                stream_chunks(),
                status=resp_code if resp_code in [200, 206] else 200,
                content_type=content_type
            )
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = '*'
            response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
            response['Accept-Ranges'] = 'bytes'

            if content_length:
                response['Content-Length'] = content_length
            if content_range:
                response['Content-Range'] = content_range

            return response

        except urllib.error.HTTPError as he:
            # Automatic Dynamic Token & Domain Re-Resolution if expired (401, 403, 404, 502)
            if he.code in [401, 403, 404, 502] and retry_count < 2:
                # Invalidate cache and force refresh active domain
                crawler.get_active_origin(force_refresh=True)
                IsaiminiStealthEngine._stream_cache.pop(cache_key, None)
                fresh_res = crawler.resolve_live_stream_for_movie(getattr(movie, 'source_mirror', None) or movie.stream_url)
                if fresh_res:
                    IsaiminiStealthEngine._stream_cache[cache_key] = {'data': fresh_res, 'time': time.time()}
                    return self._stream_upstream(request, fresh_res['stream_url'], fresh_res.get('referer', referer), retry_count + 1, movie, crawler, cache_key)
            return Response({'error': f'Upstream error {he.code}'}, status=status.HTTP_502_BAD_GATEWAY)


class ChannelStreamShieldView(APIView):
    """
    Cryptographic Stream Shield for Live Channels:
    - Fetches upstream HLS manifest (.m3u8).
    - Uses rewrite_hls_manifest() to convert all .ts segments & keys to /api/stream/ticket/<ticket>/.
    - Browser DevTools Inspect will NEVER see upstream stream URLs, admin tokens, or origin IPs!
    """
    def get(self, request, pk):
        try:
            channel = Channel.objects.get(pk=pk)
            channel.views_count += 1
            channel.save(update_fields=['views_count'])

            upstream_url = channel.stream_url
            referer = 'https://www.jiotv.com/'

            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            headers = {
                'User-Agent': 'plaYtv/7.1.5 (Linux;Android 13) ExoPlayerLib/2.11.6',
                'Referer': referer,
                'Accept': '*/*'
            }

            req = urllib.request.Request(upstream_url, headers=headers)
            resp = urllib.request.urlopen(req, context=ctx, timeout=12)
            content_type = resp.headers.get('Content-Type') or 'application/vnd.apple.mpegurl'

            is_hls = (
                '.m3u8' in upstream_url or
                'mpegurl' in content_type.lower() or
                'application/x-mpegurl' in content_type.lower()
            )

            if is_hls:
                manifest_data = resp.read().decode('utf-8', errors='ignore')
                resp.close()
                rewritten_manifest = rewrite_hls_manifest(
                    manifest_data,
                    base_url=upstream_url,
                    referer=referer,
                    target_language=channel.language
                )
                response = HttpResponse(rewritten_manifest, content_type='application/vnd.apple.mpegurl')
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
                response['Access-Control-Allow-Headers'] = '*'
                return response
            else:
                # Direct media stream
                def stream_chunks():
                    try:
                        while True:
                            chunk = resp.read(64 * 1024)
                            if not chunk:
                                break
                            yield chunk
                    finally:
                        resp.close()

                response = StreamingHttpResponse(stream_chunks(), content_type=content_type)
                response['Access-Control-Allow-Origin'] = '*'
                return response

        except Channel.DoesNotExist:
            return Response({'error': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Channel shield failed: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)


class StreamTicketShieldView(APIView):
    """
    Decodes an opaque cryptographic stream ticket and streams the media chunk/sub-manifest.
    Zero leakage of upstream domains, IP addresses, or tokens.
    """
    def get(self, request, ticket):
        try:
            payload = decode_stream_ticket(ticket)
            target_url = payload['u']
            referer = payload.get('r', '')

            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            is_vod = any(ext in target_url.lower() for ext in ['.mp4', 'fastbytes', 'uptomkv', 'onestream'])
            user_agent = (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
                if is_vod else 'plaYtv/7.1.5 (Linux;Android 13) ExoPlayerLib/2.11.6'
            )

            headers = {
                'User-Agent': user_agent,
                'Referer': referer or 'https://www.jiotv.com/',
                'Accept': '*/*'
            }

            range_header = request.headers.get('Range') or request.META.get('HTTP_RANGE')
            if range_header:
                headers['Range'] = range_header

            req = urllib.request.Request(target_url, headers=headers)
            resp = urllib.request.urlopen(req, context=ctx, timeout=15)
            content_type = resp.headers.get('Content-Type')

            if '.m3u8' in target_url or (content_type and 'mpegurl' in content_type.lower()):
                manifest_data = resp.read().decode('utf-8', errors='ignore')
                resp.close()
                rewritten_manifest = rewrite_hls_manifest(manifest_data, base_url=target_url, referer=referer)
                response = HttpResponse(rewritten_manifest, content_type='application/vnd.apple.mpegurl')
                response['Access-Control-Allow-Origin'] = '*'
                return response

            resp_code = resp.status if hasattr(resp, 'status') else resp.getcode()
            content_length = resp.headers.get('Content-Length')
            content_range = resp.headers.get('Content-Range')

            def stream_chunks():
                try:
                    while True:
                        chunk = resp.read(64 * 1024)
                        if not chunk:
                            break
                        yield chunk
                finally:
                    resp.close()

            response = StreamingHttpResponse(
                stream_chunks(),
                status=resp_code if resp_code in [200, 206] else 200,
                content_type=content_type or 'video/mp2t'
            )
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = '*'
            response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
            response['Accept-Ranges'] = 'bytes'

            if content_length:
                response['Content-Length'] = content_length
            if content_range:
                response['Content-Range'] = content_range

            return response

        except ValueError as ve:
            return Response({'error': f'Invalid or expired ticket: {str(ve)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'error': f'Ticket tunnel error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)


class MovieStreamResolveView(APIView):
    """
    Returns only the internal shielded stream URL.
    Strictly conceals raw upstream domains, IP addresses, and secret tokens from the browser.
    """
    def get(self, request, pk):
        try:
            movie = Movie.objects.get(pk=pk)
            movie.views_count += 1
            movie.save(update_fields=['views_count'])

            shielded_url = f"/api/stream/movie/{movie.id}/"
            data = {
                "id": movie.id,
                "title": movie.title,
                "year": movie.year,
                "quality": movie.quality,
                "stream_url": shielded_url,
                "proxy_url": shielded_url,
                "server_type": "shield-protected"
            }
            return Response(data)
        except Movie.DoesNotExist:
            return Response({'error': 'Movie not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Stream resolution failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StreamProxyView(APIView):
    """
    Fallback CORS Proxy for legacy compatibility, obfuscating client IP address.
    """
    def get(self, request):
        stream_url = request.query_params.get('url')
        if not stream_url:
            return Response({'error': 'Missing url parameter'}, status=status.HTTP_400_BAD_REQUEST)

        referer = request.query_params.get('referer', '')
        ticket = generate_stream_ticket(stream_url, referer=referer)
        shield_view = StreamTicketShieldView()
        return shield_view.get(request, ticket)


class HealthCheckView(APIView):
    def get(self, request):
        total_channels = Channel.objects.filter(is_active=True).count()
        total_categories = Category.objects.count()
        total_movies = Movie.objects.count()
        return JsonResponse({
            'status': 'healthy',
            'service': 'Live IPTV & VOD Movies API',
            'channels_count': total_channels,
            'categories_count': total_categories,
            'movies_count': total_movies
        })


def parse_m3u_text_helper(text):
    import re
    items = []
    lines = text.split('\n')
    current = {}
    for line in lines:
        line = line.strip()
        if line.startswith('#EXTINF:'):
            name_match = re.search(r',(.+)$', line)
            logo_match = re.search(r'tvg-logo="([^"]+)"', line)
            group_match = re.search(r'group-title="([^"]+)"', line)
            lang_match = re.search(r'tvg-language="([^"]+)"', line)
            
            name = name_match.group(1).strip() if name_match else "Live Channel"
            logo = logo_match.group(1) if logo_match else None
            cat = group_match.group(1) if group_match else "Live TV"
            lang = lang_match.group(1) if lang_match else "Tamil"
            
            current = {
                'name': name,
                'logo': logo or 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&h=200&fit=crop',
                'category': cat,
                'language': lang,
            }
        elif line.startswith('http://') or line.startswith('https://'):
            if current and 'name' in current:
                current['url'] = line
                items.append(current)
                current = {}
    return items


class JioAirtelAutoConnectorView(APIView):
    """
    Automated JioTV / Airtel / Indian IPTV Stream Connector
    Scans local proxy ports (http://127.0.0.1:5000/playlist.m3u) and public stream repos,
    extracts channels, and populates the SQLite database.
    """
    def post(self, request):
        extracted_count = 0
        sources_checked = []
        
        # 1. Check local JioTV proxy
        jio_urls = [
            "http://127.0.0.1:5000/playlist.m3u",
            "http://localhost:5000/playlist.m3u",
            "http://127.0.0.1:8080/playlist.m3u",
        ]
        
        for url in jio_urls:
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'StreamPulse/1.0'})
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                with urllib.request.urlopen(req, timeout=3, context=ctx) as response:
                    content = response.read().decode('utf-8', errors='ignore')
                    if '#EXTINF' in content:
                        parsed = parse_m3u_text_helper(content)
                        sources_checked.append({'source': url, 'status': 'connected', 'count': len(parsed)})
                        from django.utils.text import slugify
                        for item in parsed:
                            cat_name = item.get('category') or 'JioTV Live'
                            c_slug = slugify(cat_name) or 'jiotv-live'
                            cat, _ = Category.objects.get_or_create(
                                slug=c_slug,
                                defaults={'name': cat_name, 'icon': 'Tv', 'order': 1}
                            )
                            Channel.objects.update_or_create(
                                logo_url=item['logo'],
                                defaults={
                                    'name': item['name'],
                                    'stream_url': item['url'],
                                    'category': cat,
                                    'language': item.get('language', 'Tamil'),
                                    'is_active': True,
                                }
                            )
                            extracted_count += 1
                        break
            except Exception as e:
                sources_checked.append({'source': url, 'status': 'not_running', 'error': str(e)})

        # 2. Check public Indian IPTV live channels (Tamil, Hindi, English)
        public_iptv_url = "https://iptv-org.github.io/iptv/countries/in.m3u"
        try:
            req = urllib.request.Request(public_iptv_url, headers={'User-Agent': 'Mozilla/5.0'})
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
                text = resp.read().decode('utf-8', errors='ignore')
                if '#EXTINF' in text:
                    parsed_pub = parse_m3u_text_helper(text)
                    sources_checked.append({'source': public_iptv_url, 'status': 'connected', 'count': len(parsed_pub)})
                    from django.utils.text import slugify
                    for item in parsed_pub[:60]:
                        cat_name = item.get('category') or 'General Entertainment'
                        c_slug = slugify(cat_name) or 'general-ent'
                        cat, _ = Category.objects.get_or_create(
                            slug=c_slug,
                            defaults={'name': cat_name, 'icon': 'Tv', 'order': 2}
                        )
                        Channel.objects.get_or_create(
                            stream_url=item['url'],
                            defaults={
                                'name': item['name'],
                                'logo_url': item['logo'],
                                'category': cat,
                                'language': item.get('language', 'Tamil'),
                                'is_active': True,
                            }
                        )
                        extracted_count += 1
        except Exception as e:
            sources_checked.append({'source': public_iptv_url, 'status': 'failed', 'error': str(e)})

        return Response({
            'status': 'success',
            'extracted_channels': extracted_count,
            'sources_checked': sources_checked,
            'message': f"Successfully extracted & synced {extracted_count} live channels into StreamPulse!"
        })


