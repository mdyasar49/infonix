"""
ASGI config for iptv_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iptv_backend.settings')

django_http_app = get_asgi_application()

async def application(scope, receive, send):
    if scope['type'] == 'websocket':
        from channels_app.ws_manager import asgi_websocket_handler
        await asgi_websocket_handler(scope, receive, send)
    else:
        await django_http_app(scope, receive, send)
