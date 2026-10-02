#!/usr/bin/env python3
"""Extract the Change Request docx to markdown for the content pipeline.

The docx (Change Request/*.docx) is the owner's source of truth for service
page content and the price list. Rather than parse it by hand each session,
this script converts it to markdown under content/source/ so the page builder
and the price-reconciliation doc read stable text.

Handles: Heading1/2/3 -> #/##/###, numbered/bulleted ListParagraphs -> "- ",
tables -> markdown tables (the price list lives in tables), bold/italic runs,
and skips the auto-generated TOC paragraphs (they carry field chars, not text).
Run: python3 scripts/extract_change_docx.py
"""
import re
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DOCX = REPO / "Change Request" / "Dr Sumya - Website Content Service Pages  Price List.docx"
OUT = REPO / "content" / "source" / "website-content.md"


def para_text(p: str) -> str:
    """Visible text of one <w:p>, keeping bold/italic markers."""
    out = []
    for run in re.findall(r"<w:r[ >].*?</w:r>", p, re.S):
        if "<w:noProof/>" in run or "fldChar" in run or "instrText" in run:
            continue  # TOC field machinery, not content
        texts = re.findall(r"<w:t[^>]*>(.*?)</w:t>", run, re.S)
        if not texts:
            continue
        t = "".join(texts)
        t = (t.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
              .replace("&quot;", '"').replace("&apos;", "'"))
        if "<w:b/>" in run or '<w:b ' in run:
            t = f"**{t}**" if t.strip() else t
        if "<w:i/>" in run:
            t = f"*{t}*"
        out.append(t)
    return re.sub(r"\s+", " ", "".join(out)).strip()


def para_md(p: str) -> str | None:
    if "fldChar" in p and "<w:t" not in re.sub(r"<w:instrText.*?</w:instrText>", "", p, flags=re.S):
        return None
    style = re.search(r'<w:pStyle w:val="([^"]+)"', p)
    style = style.group(1) if style else ""
    if style.startswith("TOC"):
        return None
    text = para_text(p)
    if not text:
        return None
    if style == "Heading1":
        return f"# {text}"
    if style == "Heading2":
        return f"## {text}"
    if style == "Heading3":
        return f"### {text}"
    if style == "ListParagraph" or "<w:numPr>" in p:
        return f"- {text}"
    return text


def table_md(tbl: str) -> list[str]:
    rows = []
    for tr in re.findall(r"<w:tr[ >].*?</w:tr>", tbl, re.S):
        cells = []
        for tc in re.findall(r"<w:tc[ >].*?</w:tc>", tr, re.S):
            cell = "<br>".join(
                t for t in (para_text(p) for p in re.findall(r"<w:p[ >].*?</w:p>", tc, re.S)) if t
            )
            cells.append(cell.replace("|", "\\|"))
        rows.append(cells)
    if not rows:
        return []
    width = max(len(r) for r in rows)
    for r in rows:
        r.extend([""] * (width - len(r)))
    out = ["| " + " | ".join(rows[0]) + " |", "|" + "---|" * width]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return out


def main() -> None:
    xml = zipfile.ZipFile(DOCX).read("word/document.xml").decode("utf-8")
    body = re.search(r"<w:body>(.*)</w:body>", xml, re.S).group(1)
    # Top-level body children only: a table's rows contain w:p too, so strip
    # tables out before splitting paragraphs.
    blocks = []
    pos = 0
    for m in re.finditer(r"<w:tbl[ >].*?</w:tbl>", body, re.S):
        blocks.append(("p", body[pos:m.start()]))
        blocks.append(("tbl", m.group(0)))
        pos = m.end()
    blocks.append(("p", body[pos:]))

    lines = []
    for kind, chunk in blocks:
        if kind == "tbl":
            lines += table_md(chunk)
            lines.append("")
            continue
        for p in re.findall(r"<w:p[ >].*?</w:p>", chunk, re.S):
            md = para_md(p)
            if md is not None:
                lines.append(md)
    # collapse triple+ blank lines
    text = re.sub(r"\n{3,}", "\n\n", "\n".join(lines))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT} ({len(text.splitlines())} lines, {len(text)} chars)")


if __name__ == "__main__":
    sys.exit(main())
