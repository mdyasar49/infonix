from django.core.management.base import BaseCommand
from channels_app.models import Category, Channel

CHANNELS_DATA = [
    # --- TAMIL LIVE ---
    {
        "name": "DD Tamil HD",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "https://d2lk5u59tns74c.cloudfront.net/out/v1/abf46b14847e45499f4a47f3a9afe93d/index.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_DD_TAMIL/images/LOGO_HD/image.png",
        "quality": "1080p HD",
        "language": "Tamil",
    },
    {
        "name": "Colors Tamil HD",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "https://da86m1sqpm3o0.cloudfront.net/28072023/smil:colorstamilhd11.smil/playlist.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_COLORS_TAMIL/images/LOGO_HD/image.png",
        "quality": "720p HD",
        "language": "Tamil",
    },
    {
        "name": "Polimer TV",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "https://cdn-2.pishow.tv/live/1241/master.m3u8",
        "logo_url": "https://dtil.tmsimg.com/assets/s143665_ld_h15_aa.png?lock=720x540",
        "quality": "720p HD",
        "language": "Tamil",
    },
    {
        "name": "Kalaignar TV",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "http://103.72.101.252:8080/live/1209.m3u8",
        "logo_url": "https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/transparentImages/Kalaignar%20TV.png",
        "quality": "576p SD",
        "language": "Tamil",
    },
    {
        "name": "Jaya TV",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "http://103.72.101.252:8080/live/419.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_JAYA_TV/images/LOGO_HD/image.png",
        "quality": "1080p HD",
        "language": "Tamil",
    },
    {
        "name": "IBC Tamil",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "https://ibc.massstream.net/IBC/index.m3u8",
        "logo_url": "https://i.imgur.com/uVt9vBa.png",
        "quality": "1080p HD",
        "language": "Tamil",
    },
    {
        "name": "Makkal TV",
        "category": "Tamil Live",
        "cat_slug": "tamil-live",
        "cat_icon": "live_tv",
        "cat_order": 1,
        "stream_url": "https://5k8q87azdy4v-hls-live.wmncdn.net/MAKKAL/271ddf829afeece44d8732757fba1a66.sdp/playlist.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_MAKKAL_TV/images/LOGO_HD/image.png",
        "quality": "576p SD",
        "language": "Tamil",
    },

    # --- KIDS & CARTOONS ---
    {
        "name": "Hungama TV (Shinchan & Doraemon)",
        "category": "Kids & Cartoons",
        "cat_slug": "kids",
        "cat_icon": "child_care",
        "cat_order": 2,
        "stream_url": "http://103.185.24.134:3001/HUNGAMA/index.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_HUNGAMA/images/LOGO_HD/image.png",
        "quality": "576p SD",
        "language": "Tamil / Hindi",
    },
    {
        "name": "Disney Channel HD",
        "category": "Kids & Cartoons",
        "cat_slug": "kids",
        "cat_icon": "child_care",
        "cat_order": 2,
        "stream_url": "http://66.102.126.10:8000/play/a013/index.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_DISNEY_CHANNEL_HD/images/LOGO_HD/image.png",
        "quality": "1080p HD",
        "language": "Tamil / English",
    },
    {
        "name": "Disney Channel",
        "category": "Kids & Cartoons",
        "cat_slug": "kids",
        "cat_icon": "child_care",
        "cat_order": 2,
        "stream_url": "http://202.70.146.135:8000/play/a01q/index.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_DISNEY_CHANNEL/images/LOGO_HD/image.png",
        "quality": "576p SD",
        "language": "Tamil",
    },
    {
        "name": "Nickelodeon (Nick)",
        "category": "Kids & Cartoons",
        "cat_slug": "kids",
        "cat_icon": "child_care",
        "cat_order": 2,
        "stream_url": "http://103.185.24.134:3001/NICK/index.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NICK/images/LOGO_HD/image.png",
        "quality": "576p SD",
        "language": "Tamil / Hindi",
    },
    {
        "name": "ETV Bal Bharat",
        "category": "Kids & Cartoons",
        "cat_slug": "kids",
        "cat_icon": "child_care",
        "cat_order": 2,
        "stream_url": "http://103.185.24.134:3001/ETV-BAL-BHARAT/index.m3u8",
        "logo_url": "https://i.imgur.com/zsTxPV9.png",
        "quality": "576p SD",
        "language": "Tamil / Multi",
    },

    # --- NEWS 24x7 ---
    {
        "name": "News18 Tamil Nadu",
        "category": "News 24x7",
        "cat_slug": "news",
        "cat_icon": "newspaper",
        "cat_order": 3,
        "stream_url": "https://n18syndication.akamaized.net/bpk-tv/News18_Tamil_Nadu_NW18_MOB/output01/master.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NEWS18_TAMIL_NADU/images/LOGO_HD/image.png",
        "quality": "1080p HD",
        "language": "Tamil",
    },
    {
        "name": "News7 Tamil",
        "category": "News 24x7",
        "cat_slug": "news",
        "cat_icon": "newspaper",
        "cat_order": 3,
        "stream_url": "https://segment.yuppcdn.net/240122/news7/playlist.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NEWS7_TAMIL/images/LOGO_HD/image.png",
        "quality": "576p SD",
        "language": "Tamil",
    },
    {
        "name": "Polimer News",
        "category": "News 24x7",
        "cat_slug": "news",
        "cat_icon": "newspaper",
        "cat_order": 3,
        "stream_url": "https://segment.yuppcdn.net/110322/polimernews/playlist.m3u8",
        "logo_url": "https://dtil.tmsimg.com/assets/s143664_ld_h9_aa.png?lock=720x540",
        "quality": "576p SD",
        "language": "Tamil",
    },
    {
        "name": "Puthiya Thalaimurai",
        "category": "News 24x7",
        "cat_slug": "news",
        "cat_icon": "newspaper",
        "cat_order": 3,
        "stream_url": "https://segment.yuppcdn.net/240122/puthiyathalaimurai/playlist.m3u8",
        "logo_url": "https://dtil.tmsimg.com/assets/s143692_ld_h15_aa.png?lock=720x540",
        "quality": "576p SD",
        "language": "Tamil",
    },
    {
        "name": "News Tamil 24x7",
        "category": "News 24x7",
        "cat_slug": "news",
        "cat_icon": "newspaper",
        "cat_order": 3,
        "stream_url": "https://cdn-3.pishow.tv/live/1433/master.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NEWS_TAMIL_24X7/images/LOGO_HD/image.png",
        "quality": "576p SD",
        "language": "Tamil",
    },

    # --- MUSIC & LIFESTYLE ---
    {
        "name": "7S Music",
        "category": "Music & Lifestyle",
        "cat_slug": "music",
        "cat_icon": "music_note",
        "cat_order": 4,
        "stream_url": "https://cdn.pishow.tv/ott/live/1257/master.m3u8",
        "logo_url": "https://i.imgur.com/zDiIhdN.png",
        "quality": "576p SD",
        "language": "Tamil",
    },
    {
        "name": "NDTV Good Times",
        "category": "Music & Lifestyle",
        "cat_slug": "music",
        "cat_icon": "music_note",
        "cat_order": 4,
        "stream_url": "https://amg01448-samsungin-ndtvgoodtimes-samsungin-ad-gp.amagi.tv/playlist/amg01448-samsungin-ndtvgoodtimes-samsungin/playlist.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_GOOD_TIMES/images/LOGO_HD/image.png",
        "quality": "1080p HD",
        "language": "English / Hindi",
    },
    {
        "name": "Isai Aruvi",
        "category": "Music & Lifestyle",
        "cat_slug": "music",
        "cat_icon": "music_note",
        "cat_order": 4,
        "stream_url": "https://segment.yuppcdn.net/140622/isaiaruvi/playlist.m3u8",
        "logo_url": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_ISAI_ARUVI/images/LOGO_HD/image.png",
        "quality": "480p SD",
        "language": "Tamil",
    },
    {
        "name": "History TV18 HD",
        "category": "Infotainment",
        "cat_slug": "infotainment",
        "cat_icon": "public",
        "cat_order": 5,
        "stream_url": "http://103.154.3.101:5001/live/577.m3u8",
        "logo_url": "https://dtil.tmsimg.com/assets/s143133_ld_h15_aa.png?lock=720x540",
        "quality": "1080p HD",
        "language": "Tamil / Multi",
    }
]

class Command(BaseCommand):
    help = "Populate verified 100% free active IPTV channels and categories"

    def handle(self, *args, **options):
        self.stdout.write("Loading categories and verified channels...")
        
        categories_map = {}
        for item in CHANNELS_DATA:
            cat_slug = item["cat_slug"]
            if cat_slug not in categories_map:
                category, _ = Category.objects.get_or_create(
                    slug=cat_slug,
                    defaults={
                        "name": item["category"],
                        "icon": item["cat_icon"],
                        "order": item["cat_order"]
                    }
                )
                categories_map[cat_slug] = category

            Channel.objects.update_or_create(
                name=item["name"],
                defaults={
                    "category": categories_map[cat_slug],
                    "stream_url": item["stream_url"],
                    "logo_url": item["logo_url"],
                    "quality": item["quality"],
                    "language": item["language"],
                    "is_active": True
                }
            )

        total_cats = Category.objects.count()
        total_chans = Channel.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Successfully loaded {total_chans} channels across {total_cats} categories!"))
