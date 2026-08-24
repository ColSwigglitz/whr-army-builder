from playwright.sync_api import sync_playwright

BASE = 'https://whrarmybuilder.com/'

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.set_default_timeout(10000)
    page.on('dialog', lambda d: d.accept())

    page.goto(BASE, wait_until='domcontentloaded', timeout=30000)
    page.wait_for_selector('.army-card.available', timeout=30000)
    army_ids = page.locator('.army-card.available').evaluate_all("els => els.map(e => e.dataset.armyId)")
    assert army_ids, 'No available army cards rendered on deployed LIVE site'

    failures = []
    for army_id in army_ids:
        try:
            page.locator(f'[data-army-id="{army_id}"]').click()
            page.wait_for_selector('#builderScreen:not([hidden])', timeout=20000)
            page.wait_for_selector('.unit-choice', timeout=20000)

            choices = page.locator('.unit-choice')
            choice_count = choices.count()
            assert choice_count > 0, f'{army_id}: no unit choices available'
            for idx in range(min(3, choice_count)):
                choices.nth(idx).click()
                page.wait_for_timeout(100)

            roster_count = page.locator('.roster-card').count()
            assert roster_count > 0, f'{army_id}: adding choices produced no roster cards'

            total_text = page.locator('#armyTotal').inner_text(timeout=5000)
            digits = ''.join(ch for ch in total_text if ch.isdigit())
            assert digits and int(digits) > 0, f'{army_id}: roster points did not increase ({total_text!r})'

            edit = page.locator('.roster-card .edit-button').first
            if edit.count():
                edit.click()
                page.wait_for_selector('#editDialog[open]', timeout=5000)
                page.locator('#dialogCancelBtn').click()

            page.locator('#clearArmyBtn').click()
            page.wait_for_timeout(100)
            page.locator('#backToArmiesBtn').click()
            page.wait_for_selector('#armySelectionScreen:not([hidden])', timeout=10000)
            print(f'PASS {army_id}: {roster_count} roster entries, {total_text}')
        except Exception as exc:
            failures.append(f'{army_id}: {exc}')
            page.goto(BASE, wait_until='domcontentloaded', timeout=30000)
            page.wait_for_selector('.army-card.available', timeout=30000)

    browser.close()

    if failures:
        raise AssertionError('Deployed LIVE army-building failures:\n' + '\n'.join(failures))
    print(f'Deployed LIVE army-building test passed for {len(army_ids)} available armies.')
