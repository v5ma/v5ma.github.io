"""Ordinary UI preference for lengthy software-GPU regression journeys.
Not used by the separate Prismatic appearance/runtime acceptance.
"""
def balanced_graphics(page, mode="balanced"):
    page.locator('#settings-button').click()
    page.locator('#visual-quality').select_option(mode)
    page.locator('#settings-dialog form button').click()
    page.wait_for_function('!document.querySelector("dialog[open]")')
