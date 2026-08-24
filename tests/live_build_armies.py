from playwright.sync_api import sync_playwright

BASE = "https://whrarmybuilder.com/"
TARGET_ARMIES = [
    "The Empire",
    "High Elves",
    "Orcs & Goblins",
    "Dwarfs",
    "Tomb Kings",
]


def accept_dialogs(page):
    page.on("dialog", lambda dialog: dialog.accept())


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    accept_dialogs(page)

    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: console_errors.append(str(err)))

    results = []

    for army_name in TARGET_ARMIES:
        page.goto(BASE, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_selector(".army-card.available", timeout=45000)

        card = page.locator(".army-card.available").filter(has=page.locator("h3", has_text=army_name)).first
        if card.count() == 0:
            raise AssertionError(f"Army card not found on LIVE: {army_name}")

        card.click()
        page.wait_for_selector("#builderScreen:not([hidden])", timeout=45000)
        page.wait_for_selector(".unit-choice", timeout=45000)

        choices = page.locator(".unit-choice")
        available = choices.count()
        if available < 3:
            raise AssertionError(f"{army_name}: expected at least 3 army choices, found {available}")

        # Build a small throwaway army using three different choices.
        for index in range(3):
            before = page.locator(".roster-card").count()
            choices.nth(index).click()
            page.wait_for_function(
                "expected => document.querySelectorAll('.roster-card').length > expected",
                arg=before,
                timeout=15000,
            )

        roster_count = page.locator(".roster-card").count()
        if roster_count < 3:
            raise AssertionError(f"{army_name}: only {roster_count} roster entries after test build")

        total_text = page.locator("#armyTotal").inner_text().strip()
        try:
            total = int("".join(ch for ch in total_text if ch.isdigit()))
        except ValueError:
            total = 0
        if total <= 0:
            raise AssertionError(f"{army_name}: army total did not increase ({total_text!r})")

        # Exercise the editor on one of the generated roster entries.
        edit = page.locator(".roster-card .edit-button").first
        if edit.count():
            edit.click()
            page.wait_for_selector("#editDialog[open]", timeout=10000)
            page.locator("#dialogCancelBtn").click()

        results.append((army_name, roster_count, total))

    browser.close()

    if console_errors:
        print("Console errors observed while exercising LIVE:")
        for err in console_errors:
            print(" -", err)

    print("LIVE army-building tests passed:")
    for army_name, roster_count, total in results:
        print(f" - {army_name}: {roster_count} entries, {total} pts")
