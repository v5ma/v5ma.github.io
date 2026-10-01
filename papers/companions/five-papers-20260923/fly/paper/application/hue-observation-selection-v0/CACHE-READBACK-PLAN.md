# Non-executing Python 3.8 cache readback

The exact pinned cache acquired in intake 40 is 5,633 bytes and includes the
missing function name. Its header records a 3,896-byte source file, different
from the current source file. It must be treated as a separately dated archived
artifact, not silently substituted for the present source.

Read only CPython tag v3.8.18's `Python/marshal.c` and `Lib/opcode.py` to verify
the data format and instruction names. Budget each response at 100 KB. Implement
a bounded inert-object reader, not a bytecode interpreter. Limit input bytes,
object depth and collection sizes; never import, execute or evaluate the
downloaded cache. Reject unsupported data tags rather than improvising.

Record function names, constants and named wordcode instructions. Recover the
small excitation transformation only if its operands and operations are
unambiguous. Cross-check the reader against functions also preserved in the
plain source. Keep original offsets and source bytes for review. Any manually
transcribed numerical function is new local code, not native execution.

No installation, database access, response fitting or biological-identity
inference is authorized by this step. If the static readback fails, preserve
that outcome and continue with explicitly conditional assumptions elsewhere.
