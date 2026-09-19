"""Temporary scoped assembly dispatcher; remove all assembly helpers before merge."""
from pathlib import Path
import runpy
HERE=Path(__file__).resolve().parent
runpy.run_path(str(HERE/'finalize-xr-repair-base.py'),run_name='__main__')
runpy.run_path(str(HERE/'review-xr-repair.py'),run_name='__main__')
