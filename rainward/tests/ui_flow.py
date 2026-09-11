"""Shared browser test actions for public menus; never writes game state."""
import json
from pathlib import Path
EXPECTED_VERSION=json.loads((Path(__file__).resolve().parents[1]/'release.json').read_text())['version']
def finish_transition(page,target):
    """Accept the visible in-game confirmation when the tested action requires it."""
    page.wait_for_function('(target)=>Rainward.mode===target||Rainward.mode==="confirm"',arg=target)
    if page.evaluate('Rainward.mode')=='confirm':
        assert page.locator('#confirm-no').is_visible()
        assert page.locator('#confirm-yes').is_visible()
        page.locator('#confirm-yes').click()
    page.wait_for_function('(target)=>Rainward.mode===target',arg=target)
