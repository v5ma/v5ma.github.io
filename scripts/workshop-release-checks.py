"""Isolate preview-only rewards/records while leaving normal gameplay intact."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'mario-maker-clone/svgn-paper-route/route-workshop.js';s=p.read_text()
if 'const previewLedgerWrite=' not in s:
    marker='  const poll=pollGamepadEdit;'
    assert marker in s
    hooks='''  // Preview completion must not write campaign ghosts, daily results or
  // delivery/win ledger events. Normal play still delegates to the originals.
  const previewLedgerWrite=ledger;
  window.ledger=function(...args){if(!S.testing)return previewLedgerWrite(...args);};
  const previewGhostWrite=saveGhost;
  window.saveGhost=function(...args){return S.testing?false:previewGhostWrite(...args);};
  const previewDailyFinish=dailyFinish;
  window.dailyFinish=function(...args){if(!S.testing)return previewDailyFinish(...args);};
'''
    s=s.replace(marker,hooks+marker)
    s=s.replace('S.testing=true;creditBefore=credits;close();', 'S.testSnapshot.pack=packPlaying;S.testSnapshot.daily=dailyCode;S.testSnapshot.cleared=clearedCode;S.testing=true;creditBefore=credits;close();')
    s=s.replace("__delivery.state.code='';__adventure.state.transition=null;resetKeys();", "__delivery.state.code='';__adventure.state.transition=null;packPlaying=null;dailyCode=null;clearedCode=null;resetKeys();")
    s=s.replace("if(!loadCode(code)){S.testing=false;open();message(", "if(!loadCode(code)){returnToDraft();message(")
    s=s.replace('loadCode(S.legacyCode||saved.code);if(creditBefore!==null)', 'loadCode(S.legacyCode||saved.code);packPlaying=saved.pack;dailyCode=saved.daily;clearedCode=saved.cleared;if(creditBefore!==null)')
    p.write_text(s)
p=root/'tests/workshop_browser.py';s=p.read_text()
# Envelopes increase run score; native credits are paid on finishing the level.
if 'click_world(page,10*36+18,59*36+18)' not in s:
    marker="            page.locator('#maker-tiles [data-tile=\"43\"]').click();click_world(page,12*36+18,59*36+18)"
    assert marker in s
    s=s.replace(marker,"            page.locator('#maker-tiles [data-tile=\"5\"]').click();click_world(page,10*36+18,59*36+18)\n"+marker)
s=s.replace("check(page.evaluate('credits')>credits,'A real collected envelope changes test coins before restoration')", "check(page.evaluate('gears>0&&pg(10,59)===T.EMPTY'),'The placed envelope is collected and counted in the real run')")
if 'A real finish payout changes only temporary preview coins' not in s:
    marker="            check(page.evaluate('won&&tries===1&&__adventure.state.transition===null'),'Reaching the edited finish completes the test without jumping to a featured campaign level')"
    assert marker in s
    s=s.replace(marker,marker+"\n            check(page.evaluate('credits')>credits,'A real finish payout changes only temporary preview coins')")
if 'persistent_before=' not in s:
    marker="credits=page.evaluate('credits')"
    assert marker in s
    s=s.replace(marker,marker+"\n        persistent_before=page.evaluate('Object.fromEntries([\"sprocket_ghosts\",\"sprocket_ledger_buf\",\"sprocket_pack_beaten\",\"sprocket_credits\"].map(k=>[k,localStorage.getItem(k)]))')")
    marker="        check(not errors,'No uncaught JavaScript errors in the tested editor flow')"
    assert marker in s
    s=s.replace(marker,"        check(page.evaluate('Object.fromEntries([\"sprocket_ghosts\",\"sprocket_ledger_buf\",\"sprocket_pack_beaten\",\"sprocket_credits\"].map(k=>[k,localStorage.getItem(k)]))')==persistent_before,'Preview and authoring do not write persistent ghosts, win logs, pack records or coins')\n"+marker)
p.write_text(s)
print('Native preview rewards are temporary; ghost, daily and ledger writes are excluded from playtests.')
