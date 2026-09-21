"""Check the local acceptance server before starting browser tests."""
import time
from urllib.request import urlopen
for attempt in range(30):
    try:
        with urlopen('http://127.0.0.1:8765/svgn-planet/native-menu-focus.mjs',timeout=2) as response:
            assert response.status==200
            assert response.headers.get_content_type() in ('text/javascript','application/javascript')
        break
    except Exception:
        if attempt==29:raise
        time.sleep(1)
print('Local server is ready and serves JavaScript modules with the correct MIME type.')
