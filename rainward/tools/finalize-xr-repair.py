"""Temporary scoped assembly dispatcher; remove all assembly helpers before merge."""
from pathlib import Path
import runpy
HERE=Path(__file__).resolve().parent
for name in ['finalize-xr-repair-base.py','review-xr-repair.py','review-xr-portal.py']:
 runpy.run_path(str(HERE/name),run_name='__main__')
