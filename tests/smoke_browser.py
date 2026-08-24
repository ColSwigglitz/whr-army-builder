from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8000/'

with sync_playwright() as p:
    browser=p.chromium.launch()
    page=browser.new_page(viewport={"width":1440,"height":1000})
    console_errors=[]
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
    page.on('pageerror', lambda err: console_errors.append(str(err)))
    page.on('dialog', lambda d: d.accept())

    page.goto(BASE, wait_until='domcontentloaded', timeout=30000)
    page.wait_for_selector('.army-card.available', timeout=30000)
    army_ids=page.locator('.army-card.available').evaluate_all("els => els.map(e => e.dataset.armyId)")
    assert army_ids, 'No available army cards rendered'

    failures=[]
    for army_id in army_ids:
        try:
            page.locator(f'[data-army-id="{army_id}"]').click()
            page.wait_for_selector('#builderScreen:not([hidden])', timeout=30000)
            page.wait_for_selector('.unit-choice', timeout=30000)

            # Add and edit a representative choice. This catches broken data/indexing/editor wiring.
            page.locator('.unit-choice').first.click()
            page.wait_for_selector('.roster-card', timeout=10000)
            edit=page.locator('.roster-card .edit-button').first
            if edit.count():
                edit.click()
                page.wait_for_selector('#editDialog[open]', timeout=10000)
                page.locator('#dialogCancelBtn').click()

            # Clear the temporary roster, then return to selection.
            page.locator('#clearArmyBtn').click()
            page.wait_for_timeout(150)
            page.locator('#backToArmiesBtn').click()
            page.wait_for_selector('#armySelectionScreen:not([hidden])', timeout=10000)
        except Exception as exc:
            failures.append(f'{army_id}: {exc}')
            page.goto(BASE, wait_until='domcontentloaded', timeout=30000)
            page.wait_for_selector('.army-card.available', timeout=30000)

    browser.close()

    if console_errors:
        print('Browser console errors:')
        for err in console_errors:
            print(' -', err)
    if failures:
        raise AssertionError('Army smoke failures:\n'+'\n'.join(failures))
    print(f'Browser smoke test passed for {len(army_ids)} available armies.')
