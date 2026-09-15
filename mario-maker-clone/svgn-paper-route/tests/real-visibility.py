"""Run native visibility acceptance without Playwright's always-focused override.

This changes one test-driver option, never application code or DOM visibility.
The exact pinned-driver statement must match once, or execution fails closed.
The original file is restored even when the child test raises an exception.
"""
from pathlib import Path
import os
import runpy
import sys
import playwright

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: real-visibility.py path/to/browser-test.py')
    target = Path(sys.argv[1]).resolve()
    if not target.is_file():
        raise SystemExit('Missing browser acceptance script')
    driver = Path(playwright.__file__).resolve().parent / 'driver/package/lib/server/chromium/crPage.js'
    original = driver.read_text()
    statement = 'this._client.send("Emulation.setFocusEmulationEnabled", { enabled: true })'
    if original.count(statement) != 1:
        raise SystemExit('Pinned Playwright focus override changed; review the driver before testing visibility')
    try:
        driver.write_text(original.replace(statement, statement.replace('true', 'false')))
        os.environ['HEADED'] = '1'
        print('Native visibility: disabled only Playwright forced-focus emulation; no DOM events or hidden values injected.', flush=True)
        runpy.run_path(str(target), run_name='__main__')
    finally:
        driver.write_text(original)

if __name__ == '__main__':
    main()
