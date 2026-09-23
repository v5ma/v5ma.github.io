"""Inventory one named public archive through strict bounded HTTP ranges.

No member extraction, code execution, recursive search, or whole-archive read.
"""
from collections import Counter
import ctypes
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import time
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import zipfile

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "sources/hue-archive-intake-12"
OUT = HOME / "download"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(name, value):
    with (OUT / name).open("x", encoding="utf-8") as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False, allow_nan=False)


class RemoteReader(io.RawIOBase):
    def __init__(self, plan):
        self.plan = plan
        self.limits = plan["limits"]
        self.started = time.monotonic()
        self.size = None
        self.position = 0
        self.receipts = []
        self.total = 0
        self.validator = None
        self.range(0, 0)

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        target = offset if whence == 0 else (self.position + offset if whence == 1 else self.size + offset)
        if whence not in (0, 1, 2) or target < 0 or target > self.size:
            raise ValueError("Invalid bounded seek")
        self.position = target
        return target

    def read(self, length=-1):
        if length < 0:
            length = self.size - self.position
        length = min(length, self.size - self.position)
        if length == 0:
            return b""
        result = self.range(self.position, self.position + length - 1)
        self.position += len(result)
        return result

    def range(self, begin, end):
        length = end - begin + 1
        if length < 1 or length > self.limits["maximumResponseBytes"] or self.total + length > self.limits["maximumTotalBodyBytes"]:
            raise ValueError("Range/body budget exceeded; whole archive is prohibited")
        if len(self.receipts) >= self.limits["maximumRequests"] or time.monotonic() - self.started > self.limits["maximumSeconds"]:
            raise ValueError("Request/time budget exceeded")
        url = self.plan["archiveUrl"]
        if urlparse(url).hostname != "zenodo.org" or urlparse(url).scheme != "https":
            raise ValueError("Unapproved archive host")
        row = {"start": begin, "end": end, "requestedBytes": length, "requestedUtc": datetime.now(timezone.utc).isoformat()}
        self.receipts.append(row)
        req = Request(url, headers={"Range": "bytes=" + str(begin) + "-" + str(end), "Accept-Encoding": "identity", "User-Agent": "SAN-bounded-source-intake"})
        try:
            with urlopen(req, timeout=self.limits["socketTimeoutSeconds"]) as response:
                row.update(status=response.status, finalUrl=response.geturl(), contentRange=response.headers.get("Content-Range"), contentLength=response.headers.get("Content-Length"), etag=response.headers.get("ETag"), lastModified=response.headers.get("Last-Modified"))
                if response.status != 206:
                    raise ValueError("Server did not honor range; no response body read")
                if urlparse(response.geturl()).hostname != "zenodo.org":
                    raise ValueError("Unexpected final host")
                unit, interval = row["contentRange"].split(" ", 1)
                bounds, total = interval.split("/", 1)
                lower, upper = bounds.split("-", 1)
                if unit != "bytes" or (int(lower), int(upper)) != (begin, end):
                    raise ValueError("Unexpected returned byte interval")
                if self.size is not None and self.size != int(total):
                    raise ValueError("Archive length changed during intake")
                self.size = int(total)
                if not 1_000_000_000 < self.size < 3_000_000_000:
                    raise ValueError("Archive size differs from the named source boundary")
                validator = (row["etag"], row["lastModified"])
                if self.validator is not None and validator != self.validator:
                    raise ValueError("Archive validators changed during intake")
                self.validator = validator
                if row["contentLength"] is not None and int(row["contentLength"]) != length:
                    raise ValueError("Unexpected Content-Length")
                body = response.read(length + 1)
                if len(body) != length:
                    raise ValueError("Wrong returned byte count")
                self.total += len(body)
            filename = "range-" + str(begin) + "-" + str(end) + ".bin"
            with (OUT / filename).open("xb") as stream:
                stream.write(body)
            row.update(receivedBytes=len(body), sha256=hashlib.sha256(body).hexdigest(), savedAs=filename)
            return body
        except Exception as error:
            row["error"] = str(error)
            raise


def main():
    if os.name == "nt":
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
    OUT.mkdir(exist_ok=False)
    plan = json.loads((HOME / "PLAN.json").read_text("utf-8"))
    report = {"createdUtc": datetime.now(timezone.utc).isoformat(), "planSha256": sha(HOME / "PLAN.json"), "scriptSha256": sha(Path(__file__)), "archiveUrl": plan["archiveUrl"], "wholeArchiveDownloaded": False, "wholeArchiveMd5Verified": False, "archiveMembersRead": 0, "externalCodeExecuted": False}
    reader = None
    try:
        # Keep the object available even if the initial network request fails.
        reader = RemoteReader.__new__(RemoteReader)
        reader.__init__(plan)
        with zipfile.ZipFile(reader, "r") as archive:
            entries = archive.infolist()
            if len(entries) > plan["limits"]["maximumEntries"]:
                raise ValueError("Too many archive entries for bounded inspection")
            manifest = [{"name": i.filename, "uncompressedBytes": i.file_size, "compressedBytes": i.compress_size, "compression": i.compress_type, "crc32": format(i.CRC, "08x"), "localHeaderOffset": i.header_offset, "directory": i.is_dir(), "encrypted": bool(i.flag_bits & 1)} for i in entries]
            write("MEMBERS.json", manifest)
            candidates = [r for r in manifest if any(term in Path(r["name"]).name.lower() for term in ("model", "circuit", "param", "weight", "fit")) and not r["directory"]]
            files = [r for r in manifest if not r["directory"]]
            report.update(status="directory_complete", archiveBytes=reader.size, entries=len(entries), files=len(files), totalUncompressedBytes=sum(r["uncompressedBytes"] for r in files), basenames=dict(Counter(Path(r["name"]).name for r in files)), topDirectories=dict(Counter("/".join(r["name"].split("/")[:2]) for r in files)), fittedAssetFilenameCandidates=candidates, memberManifestSha256=sha(OUT / "MEMBERS.json"))
    except Exception as error:
        report.update(status="stopped_safely", error=str(error))
    if reader is not None:
        report.update(requests=reader.receipts, totalBodyBytes=reader.total, seconds=time.monotonic()-reader.started)
    write("INTAKE.json", report)
    print(json.dumps({k: v for k, v in report.items() if k != "requests"}, indent=2))


if __name__ == "__main__":
    main()
