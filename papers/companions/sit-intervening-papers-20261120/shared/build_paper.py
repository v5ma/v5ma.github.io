#!/usr/bin/env python3
"""Hydrogen Part I & II house-style Markdown -> LaTeX -> XeLaTeX PDF builder
and strict post-build auditor for the SIT Intervening Papers Upgrade Program.

Self-contained within this package: uses vendored shared/house_style_header.tex
and shared/house_style_tex_helpers.py and locates pandoc / xelatex via PATH
(or PANDOC_BIN / XELATEX_BIN environment overrides with local Windows fallbacks).
Enforces the internal-identity firewall (zero NPxx/Zxxxxxxxx codes, zero private
paths, zero overfull/undefined/?? defects, US Letter 612x792 pt, Times New Roman).
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from pypdf import PdfReader

SHARED_DIR = Path(__file__).resolve().parent
PACKAGE_ROOT = SHARED_DIR.parent
HEADER = SHARED_DIR / "house_style_header.tex"

# Optional external donor asset directory (only used if ../assets/ links remain unlocalized)
DEFAULT_EXTERNAL_ASSETS = (
    PACKAGE_ROOT.parent / "78-paper-house-style-release-20260729" / "build"
)

ABSTRACT_OPEN_MARKER = "MICHAHABSTRACTOPENMARKER"
ABSTRACT_CLOSE_MARKER = "MICHAHABSTRACTCLOSEMARKER"

INTERNAL_ID_RE = re.compile(r"\b(?:NP\d{2}|Z\d{8})\b")
PRIVATE_PATH_RE = re.compile(
    r"(?i)(?:[A-Z]:\\(?:Users|micahone)\\|/D:/micahone/|C:\\Users\\micah\\)"
)

sys.path.insert(0, str(SHARED_DIR))
import house_style_tex_helpers as bhs  # noqa: E402


def _resolve_binary(env_var: str, exe_name: str, fallbacks: list[Path]) -> Path:
    override = os.environ.get(env_var)
    if override and Path(override).is_file():
        return Path(override)
    found = shutil.which(exe_name)
    if found:
        return Path(found)
    for fb in fallbacks:
        if fb.is_file():
            return fb
    raise FileNotFoundError(
        f"Required executable '{exe_name}' not found on PATH, via {env_var}, or in fallbacks."
    )


def get_pandoc() -> Path:
    return _resolve_binary(
        "PANDOC_BIN",
        "pandoc",
        [
            PACKAGE_ROOT.parent
            / "78-paper-house-style-release-20260729"
            / "vendor"
            / "pypandoc"
            / "files"
            / "pandoc.exe",
        ],
    )


def get_xelatex() -> Path:
    return _resolve_binary(
        "XELATEX_BIN",
        "xelatex",
        [
            Path.home()
            / "AppData"
            / "Local"
            / "Programs"
            / "MiKTeX"
            / "miktex"
            / "bin"
            / "x64"
            / "xelatex.exe",
        ],
    )


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text_lf(path: Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def _rel_posix(path: Path) -> str:
    try:
        return path.resolve().relative_to(PACKAGE_ROOT.resolve()).as_posix()
    except ValueError:
        return path.name


def build_house_style_pdf(
    markdown_path: Path,
    out_dir: Path,
    pdf_filename: str,
    public_title: str,
    public_authors: str = "Micah Blumberg",
    extra_resource_dirs: list[Path] | None = None,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    md_text = markdown_path.read_text(encoding="utf-8")

    # Localize any ../assets/... figure references if present
    def _copy_asset(m: re.Match[str]) -> str:
        rel_asset = m.group(1)
        src_asset = DEFAULT_EXTERNAL_ASSETS / "assets" / rel_asset
        if src_asset.is_file():
            dst_asset = out_dir / "assets" / rel_asset
            dst_asset.parent.mkdir(parents=True, exist_ok=True)
            if not dst_asset.exists():
                shutil.copy2(src_asset, dst_asset)
            return f"assets/{rel_asset}"
        return m.group(0)

    if "../assets/" in md_text:
        md_text = re.sub(r"\.\./assets/([^\)\s\"']+)", _copy_asset, md_text)
        markdown_path.write_text(md_text, encoding="utf-8", newline="\n")

    # Pre-build firewall check on Markdown
    id_hits = INTERNAL_ID_RE.findall(md_text)
    path_hits = PRIVATE_PATH_RE.findall(md_text)
    if id_hits:
        raise ValueError(f"Internal IDs leaked into {markdown_path.name}: {sorted(set(id_hits))}")
    if path_hits:
        raise ValueError(f"Private paths leaked into {markdown_path.name}: {sorted(set(path_hits))}")

    tex_path = out_dir / (Path(pdf_filename).stem + ".tex")
    pdf_path = out_dir / pdf_filename
    log_path = out_dir / (Path(pdf_filename).stem + ".xelatex.log")

    resource_parts = [str(markdown_path.parent), str(out_dir)]
    if DEFAULT_EXTERNAL_ASSETS.is_dir():
        resource_parts.append(str(DEFAULT_EXTERNAL_ASSETS))
    if extra_resource_dirs:
        resource_parts.extend(str(p) for p in extra_resource_dirs if p.is_dir())

    pandoc_bin = get_pandoc()
    xelatex_bin = get_xelatex()

    cmd = [
        str(pandoc_bin),
        "--standalone",
        "--from=markdown+tex_math_dollars+tex_math_single_backslash+pipe_tables"
        "+fenced_code_blocks+raw_tex+strikeout+task_lists+autolink_bare_uris",
        "--to=latex",
        "--wrap=none",
        "--top-level-division=section",
        "--metadata=lang:en-US",
        f"--metadata=title-meta:{public_title}",
        f"--metadata=author-meta:{public_authors}",
        "--variable=documentclass:article",
        "--variable=fontsize:11pt",
        "--variable=papersize:letter",
        "--variable=geometry:margin=1in",
        "--variable=mainfont:Times New Roman",
        "--variable=colorlinks:true",
        "--variable=linkcolor:blue",
        "--variable=urlcolor:blue",
        "--variable=citecolor:blue",
        f"--include-in-header={HEADER}",
        "--resource-path=" + os.pathsep.join(resource_parts),
        "--output",
        str(tex_path),
        str(markdown_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    if proc.returncode != 0:
        raise RuntimeError(f"Pandoc failed on {markdown_path.name}:\n{proc.stderr or proc.stdout}")

    tex_text = bhs.clean_text(tex_path.read_text(encoding="utf-8"))
    tex_text = tex_text.replace(
        r"\usepackage{unicode-math} % this also loads fontspec",
        r"\usepackage{fontspec}",
    )
    tex_text = tex_text.replace(ABSTRACT_OPEN_MARKER, r"\begin{abstract}").replace(
        ABSTRACT_CLOSE_MARKER, r"\end{abstract}"
    )
    tex_text = bhs.replace_unicode_math(tex_text)
    tex_text = bhs.make_tex_tokens_breakable(bhs.convert_display_math(tex_text))
    tex_path.write_text(tex_text, encoding="utf-8", newline="\n")

    # Compile 2 passes with XeLaTeX
    env = os.environ.copy()
    env["PATH"] = str(xelatex_bin.parent) + os.pathsep + env.get("PATH", "")
    logs = []
    for pnum in (1, 2):
        res = subprocess.run(
            [
                str(xelatex_bin),
                "--interaction=nonstopmode",
                "--halt-on-error",
                f"--output-directory={out_dir}",
                str(tex_path),
            ],
            cwd=str(out_dir),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
            timeout=240,
        )
        logs.append(f"=== PASS {pnum} ===\n" + res.stdout + "\n" + res.stderr)
        if res.returncode != 0:
            log_path.write_text("\n\n".join(logs), encoding="utf-8")
            raise RuntimeError(
                f"XeLaTeX failed on {tex_path.name} pass {pnum}:\n"
                + "\n".join(res.stdout.splitlines()[-35:])
            )

    log_text = "\n\n".join(logs)
    log_path.write_text(log_text, encoding="utf-8")

    # Verify built PDF independently
    reader = PdfReader(str(pdf_path))
    pages = len(reader.pages)
    box = reader.pages[0].mediabox
    width_pt = round(float(box.width), 2)
    height_pt = round(float(box.height), 2)
    fonts = set()
    extracted_pages = []
    for page in reader.pages:
        res_dict = page.get("/Resources")
        if res_dict and "/Font" in res_dict:
            for _, v in res_dict["/Font"].items():
                fonts.add(str(v.get_object().get("/BaseFont", "")))
        extracted_pages.append(page.extract_text() or "")
    full_pdf_text = "\n".join(extracted_pages)
    p1_text = extracted_pages[0] if extracted_pages else ""

    pdf_id_hits = INTERNAL_ID_RE.findall(full_pdf_text)
    pdf_path_hits = PRIVATE_PATH_RE.findall(full_pdf_text)
    qmark_hits = len(re.findall(r"\?\?", full_pdf_text))
    last_pass_log = logs[-1]
    undef_refs = [l for l in last_pass_log.splitlines() if "Undefined" in l or "multiply-defined" in l]
    missing_chars = [l.strip() for l in last_pass_log.splitlines() if "Missing character:" in l]
    has_times = any("TimesNewRoman" in f for f in fonts)
    is_letter = abs(width_pt - 612.0) < 1.0 and abs(height_pt - 792.0) < 1.0

    audit = {
        "built_utc": datetime.now(timezone.utc).isoformat(),
        "title": public_title,
        "markdown": _rel_posix(markdown_path),
        "markdown_sha256": sha256_text_lf(markdown_path),
        "tex": _rel_posix(tex_path),
        "tex_sha256": sha256_text_lf(tex_path),
        "pdf": _rel_posix(pdf_path),
        "pdf_bytes": pdf_path.stat().st_size,
        "pdf_sha256": sha256_file(pdf_path),
        "pages": pages,
        "page_box_pt": [width_pt, height_pt],
        "is_us_letter": is_letter,
        "has_times_new_roman": has_times,
        "first_page_has_author_label": "Author: Micah Blumberg" in p1_text,
        "first_page_has_institute": "Self Aware Networks Research Institute" in p1_text,
        "first_page_has_website": "selfawarenetworks.com" in p1_text,
        "internal_id_hits": pdf_id_hits,
        "private_path_hits": pdf_path_hits,
        "question_mark_placeholder_hits": qmark_hits,
        "undefined_or_multiply_defined_warnings": undef_refs,
        "missing_character_warnings": missing_chars,
        "pass": (
            is_letter
            and has_times
            and ("Author: Micah Blumberg" in p1_text)
            and ("Self Aware Networks Research Institute" in p1_text)
            and ("selfawarenetworks.com" in p1_text)
            and len(pdf_id_hits) == 0
            and len(pdf_path_hits) == 0
            and qmark_hits == 0
            and len(undef_refs) == 0
            and len(missing_chars) == 0
        ),
    }
    if not audit["pass"]:
        raise RuntimeError("PDF house-style audit failed: " + json.dumps(audit, indent=2))
    return audit


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    ap.add_argument("--pdf-name", required=True)
    ap.add_argument("--title", required=True)
    args = ap.parse_args()
    res = build_house_style_pdf(args.md, args.out_dir, args.pdf_name, args.title)
    print(json.dumps(res, indent=2))
