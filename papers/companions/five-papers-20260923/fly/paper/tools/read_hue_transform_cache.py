"""Bounded Python-3.8 marshal data reader. No code objects or interpreter.

Format checked against CPython v3.8.18 marshal.c and opcode.py (intake 41).
This decodes inert dictionaries and labels wordcode; it never runs wordcode.
"""
import ast
import datetime as dt
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'sources/hue-transform-cache-intake-40/transform.cpython-38.pyc'
OUT = ROOT / 'application/hue-observation-selection-v0/cache-readback-01'


class Reader:
    def __init__(self, data):
        if len(data) > 100000:
            raise ValueError('Input too large')
        self.data, self.pos, self.refs, self.codes = data, 0, [], []

    def take(self, n):
        if not 0 <= n <= 100000 or self.pos + n > len(self.data):
            raise ValueError('Invalid or truncated byte extent')
        out = self.data[self.pos:self.pos+n]
        self.pos += n
        return out

    def integer(self):
        return struct.unpack('<i', self.take(4))[0]

    def obj(self, depth=0):
        if depth > 32 or len(self.refs) > 10000:
            raise ValueError('Object budget exceeded')
        offset = self.pos
        raw = self.take(1)[0]
        flag, tag = raw & 128, chr(raw & 127)
        slot = None
        if flag:
            slot = len(self.refs)
            self.refs.append(None)
        if tag == 'r':
            n = self.integer()
            if not 0 <= n < len(self.refs) or self.refs[n] is None:
                raise ValueError('Unresolved object reference')
            value = self.refs[n]
        elif tag == 'N':
            value = None
        elif tag == 'F':
            value = False
        elif tag == 'T':
            value = True
        elif tag == '.':
            value = {'literal': 'Ellipsis'}
        elif tag == 'i':
            value = self.integer()
        elif tag == 'g':
            value = struct.unpack('<d', self.take(8))[0]
        elif tag in ('s', 't', 'u', 'a', 'A', 'z', 'Z'):
            n = self.take(1)[0] if tag in ('z', 'Z') else self.integer()
            value = self.take(n)
            if tag != 's':
                value = value.decode('utf-8' if tag in ('t', 'u') else 'ascii')
        elif tag in ('(', ')', '['):
            n = self.take(1)[0] if tag == ')' else self.integer()
            if not 0 <= n <= 10000:
                raise ValueError('Collection budget exceeded')
            value = []
            if slot is not None:
                self.refs[slot] = value
            for _ in range(n):
                value.append(self.obj(depth+1))
        elif tag == 'c':
            value = {'kind': 'code_data', 'marshal_offset': offset,
                     'file_offset': offset + 16}
            for key in ('argcount', 'posonlyargcount', 'kwonlyargcount', 'nlocals', 'stacksize', 'flags'):
                value[key] = self.integer()
            for key in ('code', 'consts', 'names', 'varnames', 'freevars', 'cellvars', 'filename', 'name'):
                value[key] = self.obj(depth+1)
            value['firstlineno'] = self.integer()
            value['lnotab'] = self.obj(depth+1)
            value['end_file_offset'] = self.pos + 16
            self.codes.append(value)
        else:
            raise ValueError(f'Unsupported marshal tag {tag!r} at {offset}')
        if slot is not None:
            self.refs[slot] = value
        return value


def opcodes():
    tree = ast.parse((ROOT / 'sources/python38-format-intake-41/opcode.py').read_text(encoding='utf-8'))
    names, hasname = {}, set()
    for node in tree.body:
        if not isinstance(node, ast.Expr) or not isinstance(node.value, ast.Call):
            continue
        call = node.value
        if not isinstance(call.func, ast.Name) or call.func.id not in ('def_op', 'name_op', 'jrel_op', 'jabs_op'):
            continue
        name, number = [ast.literal_eval(a) for a in call.args]
        names[number] = name
        if call.func.id == 'name_op':
            hasname.add(number)
    return names, hasname


def plain(value):
    if isinstance(value, bytes):
        return {'bytes_hex': value.hex()}
    if isinstance(value, list):
        return [plain(v) for v in value]
    if isinstance(value, dict) and value.get('kind') == 'code_data':
        return {'code_reference': value['name'], 'file_offset': value['file_offset']}
    return value


def label(code, names, hasname):
    data = code['code']
    if len(data) % 2:
        raise ValueError('Odd wordcode size')
    rows, extended = [], 0
    for offset in range(0, len(data), 2):
        op, smallarg = data[offset:offset+2]
        arg = smallarg | extended
        row = {'offset': offset, 'opcode': op, 'name': names[op], 'arg': arg}
        if op == 100:
            row['operand'] = plain(code['consts'][arg])
        elif op in hasname:
            row['operand'] = code['names'][arg]
        elif op in (124, 125, 126):
            row['operand'] = code['varnames'][arg]
        rows.append(row)
        extended = arg << 8 if op == 144 else 0
    return {key: plain(value) for key, value in code.items()} | {'instructions': rows}


def main():
    body = CACHE.read_bytes()
    assert hashlib.sha256(body).hexdigest() == 'e87d974b7be5a4201d3aed70888828f875bd35f34c038cf0beb5947d609b954f'
    assert body[:4].hex() == '550d0d0a'
    reader = Reader(body[16:])
    module = reader.obj()
    assert reader.pos == len(body)-16
    assert module['name'] == '<module>'
    names, hasname = opcodes()
    codes = [label(c, names, hasname) for c in reader.codes]
    by_name = {c['name']: c for c in codes}
    # These two functions also exist in the reviewed plain source. Pin every
    # byte and operand rather than executing either copy.
    assert by_name['identity']['code']['bytes_hex'] == '7c005300'
    assert by_name['identity']['varnames'] == ['X']
    assert by_name['contrast']['code']['bytes_hex'] == '7c00640118005300'
    assert by_name['contrast']['consts'] == [None, 1]
    rejected = []
    for name, bad in [('truncated', body[16:-1]), ('unknown_tag', b'?'),
                      ('oversize_bytes', b's' + struct.pack('<i', 100001)),
                      ('bad_reference', b'r' + struct.pack('<i', 9999))]:
        try:
            Reader(bad).obj()
        except (ValueError, KeyError, IndexError):
            rejected.append(name)
    assert len(rejected) == 4
    receipt = {'created_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
               'source_sha256': hashlib.sha256(body).hexdigest(),
               'tool_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               'entire_payload_consumed': True, 'function_and_module_objects': len(codes),
               'code_executed': False, 'python_code_objects_created': False,
               'source_header_time_utc': dt.datetime.fromtimestamp(struct.unpack('<I', body[8:12])[0], dt.timezone.utc).isoformat(),
               'source_header_size': struct.unpack('<I', body[12:16])[0],
               'plain_source_identity_and_contrast_byte_checks': 'pass',
               'corruptions_rejected': rejected, 'objects': codes}
    OUT.mkdir(exist_ok=False)
    (OUT / 'STATIC-READBACK.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    selected = ('excitation', 'excitation_contrast', 'inverse_excc')
    print(json.dumps({k:v for k,v in receipt.items() if k != 'objects'}, indent=2))
    for name in selected:
        print(json.dumps(by_name[name], indent=2))


if __name__ == '__main__':
    main()
