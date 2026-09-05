"""One-time checked transport of owned UTF-8 sources, never workflow files.
The temporary input is removed before the generated source is committed/tested.
"""
from pathlib import Path
import base64,gzip,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'.flow-transfer'
if folder.exists():
    paths=[folder/'part-0.txt']+[folder/f'chunk-{i:02}.txt' for i in range(2,12)]
    data=base64.b64decode(''.join(p.read_text().strip() for p in paths),validate=True)
    assert hashlib.sha256(data).hexdigest()=='fc166964eee72de6447e55f1ce2c7c50934d313e509e3b878646143ed603e24c','Transport checksum mismatch'
    envelope=json.loads(gzip.decompress(data))
    assert envelope['version']==1 and len(envelope['files'])==17
    for name,record in envelope['files'].items():
        p=Path(name)
        assert not p.is_absolute() and '..' not in p.parts
        assert name.startswith('mario-maker-clone/svgn-paper-route/route-flow') or name.startswith('mario-maker-clone/svgn-paper-route/planning/') or name in ['scripts/install-route-flow.py','scripts/compile-route-flow.cjs','scripts/package-flow-plans.cjs','tests/route_flow.test.cjs','tests/flow_browser.py','tests/flow-fixture.cjs'],name
        text=record['text'].encode('utf-8');assert hashlib.sha256(text).hexdigest()==record['sha256'],name
        target=ROOT/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(text)
    shutil.rmtree(folder)
# Undo intentionally clears editor selection. Reselect via UI before asking for
# a second proposal; do not inject selection or document state in the browser.
p=ROOT/'tests/flow_browser.py'
s=p.read_text()
s=s.replace("    page.locator('#flow-fit').click();page.wait_for_function('!!RouteFlowEditor.state.proposal||!!RouteFlowEditor.state.error')", "    page.locator('#maker-outline [data-track=\"0\"]').click();page.locator('#flow-fit').click();page.wait_for_function('!!RouteFlowEditor.state.proposal||!!RouteFlowEditor.state.error')")
p.write_text(s)
print('Verified flow sources installed; transport removed.')
