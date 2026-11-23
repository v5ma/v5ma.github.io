#!/usr/bin/env python3
"""Vendored TeX normalization and line-breaking helpers for the Hydrogen Part I & II
house-style PDF build pipeline, so shared/build_paper.py runs without importing
external workspace scripts outside this commit.
"""

from __future__ import annotations

import re

MOJIBAKE = {
    "\u00e2\u20ac\u201d": " - ",
    "\u00e2\u20ac\u201c": "-",
    "\u00e2\u20ac\u2011": "-",
    "\u00e2\u02c6\u2019": "-",
    "\u00e2\u20ac\u0153": '"',
    "\u00e2\u20ac\u009d": '"',
    "\u00e2\u20ac\u02dc": "'",
    "\u00e2\u20ac\u2122": "'",
    "\u00e2\u20ac\u00a6": "...",
    "\u00c2": "",
    "\u00ef\u00ac\x81": "fi",
    "\u00ef\u00ac\x82": "fl",
    "\u2011": "-",
    "\u2012": "-",
    "\u2013": "-",
    "\u2014": " - ",
    "\u2212": "-",
}

UNICODE_TEX_MATH = {
    "\u03c3": r"\sigma", "\u2265": r"\geq", "\u2264": r"\leq", "\u03b6": r"\zeta",
    "\u03c6": r"\phi", "\u2208": r"\in", "\u03b5": r"\varepsilon", "\u03c8": r"\psi",
    "\u03b4": r"\delta", "\u03bc": r"\mu", "\u03c9": r"\omega", "\u03c0": r"\pi",
    "\u03b3": r"\gamma", "\u03c1": r"\rho", "\u03bb": r"\lambda", "\u03b8": r"\theta",
    "\u03ba": r"\kappa", "\u03b7": r"\eta", "\u03c4": r"\tau", "\u03b9": r"\iota",
    "\u03b1": r"\alpha", "\u03c7": r"\chi", "\u03b2": r"\beta", "\u03be": r"\xi",
    "\u2113": r"\ell", "\u2102": r"\mathbb{C}", "\u211d": r"\mathbb{R}",
    "\u2124": r"\mathbb{Z}", "\U0001d509": r"\mathfrak{F}", "\U0001d52e": r"\mathfrak{q}",
    "\U0001d4ae": r"\mathcal{S}", "\U0001d4af": r"\mathcal{T}", "\U0001d4e1": r"\mathcal{R}",
    "\U0001d4aa": r"\mathcal{O}", "\U0001d4a2": r"\mathcal{G}", "\U0001d49f": r"\mathcal{D}",
    "\U0001d4db": r"\mathcal{L}", "\U0001d4b3": r"\mathcal{X}", "\u2080": r"{}_{0}",
    "\u2081": r"{}_{1}", "\u2082": r"{}_{2}", "\u2083": r"{}_{3}", "\u2084": r"{}_{4}",
    "\u2085": r"{}_{5}", "\u2086": r"{}_{6}", "\u2087": r"{}_{7}", "\u2088": r"{}_{8}",
    "\u2089": r"{}_{9}", "\u2070": r"{}^{0}", "\u00b9": r"{}^{1}", "\u00b2": r"{}^{2}",
    "\u00b3": r"{}^{3}", "\u2074": r"{}^{4}", "\u2075": r"{}^{5}", "\u2076": r"{}^{6}",
    "\u2077": r"{}^{7}", "\u2078": r"{}^{8}", "\u2079": r"{}^{9}", "\u207b": r"{}^{-}",
    "\u207a": r"{}^{+}", "\u2032": "'", "\u2033": "''", "\u220e": r"\blacksquare",
    "\u27e8": r"\langle", "\u27e9": r"\rangle", "\u2286": r"\subseteq",
    "\u2282": r"\subset", "\u2284": r"\not\subset", "\u2285": r"\not\supset",
    "\u2288": r"\not\subseteq", "\u228a": r"\subsetneq", "\u2224": r"\not\mid",
    "\u2260": r"\neq", "\u2261": r"\equiv",
    "\u223c": r"\sim", "\u2248": r"\approx", "\u2245": r"\cong", "\u224d": r"\asymp",
    "\u2ab0": r"\succeq", "\u2aaf": r"\preceq", "\u2202": r"\partial", "\u222b": r"\int",
    "\u220f": r"\prod", "\u2229": r"\cap", "\u222a": r"\cup", "\u2209": r"\notin",
    "\u220b": r"\ni", "\u2216": r"\setminus", "\u22a5": r"\perp", "\u2308": r"\lceil",
    "\u2309": r"\rceil", "\u230a": r"\lfloor", "\u230b": r"\rfloor",
    "\u27fa": r"\Longleftrightarrow", "\u21a6": r"\mapsto",
    "\u21aa": r"\hookrightarrow", "\u21ba": r"\circlearrowleft", "\u22ef": r"\cdots",
    "\u27f8": r"\Longleftarrow", "\u27f9": r"\Longrightarrow",
}


def clean_text(value: str) -> str:
    for broken, replacement in MOJIBAKE.items():
        value = value.replace(broken, replacement)
    value = value.replace("\ufeff", "")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    return value


def replace_unicode_math(tex_text: str) -> str:
    for character, command in UNICODE_TEX_MATH.items():
        tex_text = tex_text.replace(character, rf"\ensuremath{{{command}}}")
    return tex_text


def convert_display_math(tex_text: str) -> str:
    def replace(match: re.Match[str]) -> str:
        content = match.group(1).strip()
        if re.search(r"\\begin\{(?:equation|align|gather|multline)", content):
            return match.group(0)
        tag_match = re.search(r"\s*(\\tag\{[^}]+\})\s*$", content)
        bracket_tag_match = re.search(r"\s*\\qquad\s*\[(\d+)\]\s*$", content)
        if tag_match:
            tag = tag_match.group(1)
            core = content[: tag_match.start()].strip()
        elif bracket_tag_match:
            tag = rf"\tag{{{bracket_tag_match.group(1)}}}"
            core = content[: bracket_tag_match.start()].strip()
        else:
            tag = ""
            core = content
        chain_lines = [line.strip() for line in core.splitlines() if line.strip()]
        is_standalone_arrow_chain = (
            len(chain_lines) >= 7
            and len(chain_lines) % 2 == 1
            and all(line == r"\rightarrow" for line in chain_lines[1::2])
        )
        arrow_chunks = re.split(
            r"(\\(?:rightleftarrows|rightarrow|leftarrow|leftrightarrow))",
            core,
        )
        compact_core = re.sub(r"\s+", " ", core).strip()
        is_wide_text_arrow_chain = (
            len(compact_core) > 125
            and r"\begin{aligned}" not in core
            and compact_core.startswith(r"\text{")
            and len(arrow_chunks) >= 3
            and len(arrow_chunks) % 2 == 1
            and all(part.strip() for part in arrow_chunks[0::2])
        )
        if is_standalone_arrow_chain:
            arrow_parts = chain_lines[0::2]
            rows = [arrow_parts[0] + r" &\rightarrow " + arrow_parts[1]]
            rows.extend(r"{} &\rightarrow " + part for part in arrow_parts[2:])
            content = (
                "\\begin{aligned}\n"
                + " \\\\\n".join(rows)
                + "\n\\end{aligned}"
                + ("\n" + tag if tag else "")
            )
        elif is_wide_text_arrow_chain:
            rows = [r"& " + arrow_chunks[0].strip()]
            rows.extend(
                rf"& {arrow_chunks[index]} {arrow_chunks[index + 1].strip()}"
                for index in range(1, len(arrow_chunks), 2)
            )
            content = (
                "\\begin{aligned}\n"
                + " \\\\\n".join(rows)
                + "\n\\end{aligned}"
                + ("\n" + tag if tag else "")
            )
        else:
            expression_parts = [
                part.strip()
                for part in re.split(r"(?m)^\s*\\qquad\s*$", core)
            ]
            if (
                len(expression_parts) == 1
                and len(compact_core) > 125
                and r"\qquad" in core
            ):
                expression_parts = [
                    part.strip()
                    for part in re.split(r"\s*\\qquad\s*", core)
                ]
            if len(expression_parts) >= 2 and all(expression_parts):
                aligned_parts = [r"& " + part for part in expression_parts]
                content = (
                    "\\begin{aligned}\n"
                    + " \\\\\n".join(aligned_parts)
                    + "\n\\end{aligned}"
                    + ("\n" + tag if tag else "")
                )
            elif tag:
                content = core + "\n" + tag
        return "\\begin{equation}\n" + content + "\n\\end{equation}"

    return re.sub(r"\\\[\s*(.*?)\s*\\\]", replace, tex_text, flags=re.S)


def make_tex_tokens_breakable(tex_text: str) -> str:
    tex_text = re.sub(
        r"\\url\{https://doi\.org/([^{}]+)\}",
        lambda match: (
            r"\href{https://doi.org/"
            + match.group(1)
            + r"}{doi:\nolinkurl{"
            + match.group(1)
            + r"}}"
        ),
        tex_text,
    )

    tex_text = re.sub(
        r"\\texttt\{([0-9A-Fa-f]{24,})\}",
        r"\\nolinkurl{\1}",
        tex_text,
    )

    def replace_long_code(match: re.Match[str]) -> str:
        value = match.group(1)
        if len(value) < 18 or " " in value or r"\ " in value:
            return match.group(0)
        if re.fullmatch(r"[A-Za-z0-9]+", value):
            breakable = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", r"\\allowbreak{}", value)
            return rf"\texttt{{{breakable}}}"
        if not re.search(r"[./_-]|\\_", value):
            return match.group(0)
        value = (
            value.replace(r"\_", "_")
            .replace(r"\%", "%")
            .replace(r"\#", "#")
            .replace(r"\&", "&")
        )
        return rf"\nolinkurl{{{value}}}"

    tex_text = re.sub(r"\\texttt\{([^{}\n]{18,})\}", replace_long_code, tex_text)

    def break_bare_hex_token(match: re.Match[str]) -> str:
        protected_url = match.group(1)
        if protected_url:
            return protected_url
        value = match.group(2)
        return r"\allowbreak{}".join(
            value[index : index + 8] for index in range(0, len(value), 8)
        )

    tex_text = re.sub(
        r"(\\(?:url|nolinkurl)\{[^{}]*\})"
        r"|(?<![A-Za-z0-9/{])([0-9A-Fa-f]{32,64})(?![A-Za-z0-9])",
        break_bare_hex_token,
        tex_text,
    )

    def compact_longtable(match: re.Match[str]) -> str:
        block = match.group(0)
        block = block.replace(r"\raggedright", r"\RaggedRight")

        def break_citation_cluster(citation: re.Match[str]) -> str:
            values = citation.group(1).replace(",", r",\allowbreak{}")
            return r"{[}" + values + r"{]}"

        block = re.sub(
            r"\{\[\}([0-9]+(?:[-,][0-9]+)+)\{\]\}",
            break_citation_cluster,
            block,
        )
        preamble = block.split(r"\toprule", 1)[0]
        column_count = preamble.count(r"\real{")
        if not column_count:
            opening = preamble.splitlines()[0]
            spec_match = re.search(r"\{@\{\}([lrc]+)@\{\}\}", opening)
            column_count = len(spec_match.group(1)) if spec_match else 0
        if column_count >= 6:
            table_setup = r"\tiny\setlength{\tabcolsep}{2pt}"
        else:
            table_setup = r"\footnotesize\setlength{\tabcolsep}{4pt}"
        return (
            r"\begingroup"
            + table_setup
            + "\n"
            + block
            + "\n"
            + r"\endgroup"
        )

    return re.sub(
        r"\\begin\{longtable\}.*?\\end\{longtable\}",
        compact_longtable,
        tex_text,
        flags=re.S,
    )
