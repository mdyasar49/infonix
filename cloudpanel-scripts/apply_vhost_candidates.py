import asyncio
import sys
from playwright.async_api import async_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CP_URL = "https://cp.infogenx.com/login"
USERNAME = "infogenxsrv"
PASSWORD = "X5OyrnBy7XOkRTZ83Ima"

VHOST_CONFIG = '''server {
    listen 80;
    listen [::]:80;
    listen 443 quic;
    listen 443 ssl;
    listen [::]:443 quic;
    listen [::]:443 ssl;

    http2 on;
    http3 off;

    {{ssl_certificate_key}}
    {{ssl_certificate}}

    ssl_session_timeout 30m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    gzip on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;

    server_name candidates.infogenx.com;

    add_header X-Debug-Nginx "Yes";

    root /home/infogenx-candidates/htdocs/candidates.infogenx.com/dist;
    index index.html;

    {{nginx_access_log}}
    {{nginx_error_log}}

    if ($scheme != "https") {
        rewrite ^ https://$host$request_uri permanent;
    }

    location /.well-known {
        auth_basic off;
        allow all;
        root /home/infogenx-candidates/htdocs/candidates.infogenx.com;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|pdf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}'''

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = await ctx.new_page()

        print("[1] Logging into CloudPanel...", flush=True)
        await page.goto(CP_URL, wait_until="networkidle")
        await page.locator('input[name="userName"]').fill(USERNAME)
        await page.locator('input[name="password"]').fill(PASSWORD)
        await page.locator('button:has-text("Log In")').click()
        await page.wait_for_url("https://cp.infogenx.com/", timeout=15000)

        print("[2] Navigating to candidates.infogenx.com VHost...", flush=True)
        await page.goto("https://cp.infogenx.com/site/candidates.infogenx.com/vhost", wait_until="networkidle")
        await asyncio.sleep(2)

        # Update VHost via Ace editor in page
        await page.evaluate(f'''() => {{
            if (window.ace) {{
                const editor = ace.edit(document.querySelector('.ace_editor'));
                if (editor) {{
                    editor.setValue({repr(VHOST_CONFIG)});
                }}
            }}
            const ta = document.querySelector('textarea#site_vhost_vhost') || document.querySelector('textarea');
            if (ta) {{
                ta.value = {repr(VHOST_CONFIG)};
                ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
                ta.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        }}''')
        await asyncio.sleep(1)

        print("[3] Clicking Save...", flush=True)
        save_btn = page.locator('button:has-text("Save"), button:has-text("Update")')
        if await save_btn.count() > 0:
            await save_btn.first.click()
            await asyncio.sleep(4)
            print("[+] VHost updated and saved successfully in CloudPanel!", flush=True)

        await page.screenshot(path="D:\\infonix\\vhost_saved.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
