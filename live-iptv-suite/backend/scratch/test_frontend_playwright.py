import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1366, 'height': 768})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)

        print("Navigating to http://localhost:5173/ ...")
        await page.goto("http://localhost:5173/", wait_until="networkidle")

        # 1. Click Tamil Movies tab
        print("Clicking 'Tamil Movies' tab...")
        await page.click("text=Tamil Movies")
        await page.wait_for_timeout(1000)

        # 2. Check filters
        filters = await page.query_selector_all("text=2026 Releases")
        print(f"Found '2026 Releases' filter chips: {len(filters)}")

        # 3. Click 2026 Releases filter chip
        if filters:
            await filters[0].click()
            await page.wait_for_timeout(800)

        # 4. Take screenshot of Movies Grid
        await page.screenshot(path=r"C:\Users\HP\.gemini\antigravity-ide\brain\a1e230c9-3442-4fe9-84b5-116c469d8222\movies_catalog_2026_view.png", full_page=False)
        print("Saved movies_catalog_2026_view.png")

        # 5. Click on first movie card
        cards = await page.query_selector_all(".movie-poster")
        print(f"Found {len(cards)} movie cards.")
        if cards:
            print("Clicking first movie card...")
            await cards[0].click()
            await page.wait_for_timeout(2500)

            # Check if player appeared
            player = await page.query_selector(".player-container, video")
            print("Player found:", bool(player))

            # Click Center Play Button if visible
            center_btn = await page.query_selector("button:has-text('CLICK TO PLAY')")
            if center_btn:
                print("Found 'CLICK TO PLAY' button, clicking it...")
                await center_btn.click()
                await page.wait_for_timeout(3000)

            # Capture video player playing screenshot
            await page.screenshot(path=r"C:\Users\HP\.gemini\antigravity-ide\brain\a1e230c9-3442-4fe9-84b5-116c469d8222\movie_playing_stealth_success.png", full_page=False)
            print("Saved movie_playing_stealth_success.png")

        print("Console errors:", console_errors)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
