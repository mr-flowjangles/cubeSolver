#!/usr/bin/env python3
"""Regenerate the generated half of site/catalog.json.

    make catalog

Runs on plain system `python3` (3.9 or newer), standard library only. No venv, no pip
install: Mission Control has to open on day one of a project, before there is a toolchain.

`site/catalog.json` has two halves, and the split is the most important thing
about this system.

**Generated.** These keys are rebuilt from the docs on every run. Editing them by hand
appears to work and is silently reverted by the next `make catalog`. To change one, change
the document it comes from.

- `milestones`, `dod` and `project.phase` / `project.banner` / `project.updated`
  ← `docs/07-build-plan.md`
- `decisions` ← `docs/99-open-questions.md`
- `glossary` ← the "Domain vocabulary" section of `CLAUDE.md`
- `docs` ← every `docs/*.md`, converted to HTML
- `generated_at` ← today's date

**Hand-written.** `services`, `sections`, and `project.name` / `project.repo` are written
directly into the JSON and this script never touches them.

The reason for the split: a status page that can quietly stop mentioning something is
worse than no status page. Generating the build, decision and design sections from their
sources means the page cannot fall behind them, and `make catalog` leaving the tree dirty
is the signal that it had.
"""

from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "site" / "catalog.json"
DOCS = ROOT / "docs"
BUILD_PLAN = DOCS / "07-build-plan.md"
QUESTIONS = DOCS / "99-open-questions.md"
VOCABULARY = ROOT / "CLAUDE.md"

#: Where a link to a repo file that is not a doc should point, e.g.
#: "https://github.com/<owner>/<repo>/blob/main/". Left empty, it falls back to
#: `project.repo` in catalog.json (as "<owner>/<repo>" on github.com); if that is empty
#: too, such links are dropped and their text kept.
REPO_URL = ""

#: The Design tab: every doc under docs/, in filename order.
DESIGN_DOCS = tuple(sorted(p.name for p in DOCS.glob("*.md")))

COMMENT = re.compile(r"<!--.*?-->", re.S)


def strip_comments(text: str) -> str:
    """Drop HTML comments. They are notes to the author, not content, and a commented-out
    example (a `## Question` in the open-questions template) must not count as real."""
    return COMMENT.sub("", text)


# --------------------------------------------------------------------------
# Markdown → HTML
#
# A small converter, so this script needs nothing beyond the standard library. It covers
# what the docs use: headings, paragraphs, bullet and numbered lists (nested), task boxes,
# bold, italic, inline code, fenced code, links, images, tables, blockquotes and
# horizontal rules. Raw HTML in the markdown is escaped, not run.
# --------------------------------------------------------------------------
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)")
HEADING = re.compile(r"^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$")
HR = re.compile(r"^ {0,3}([-*_])(?:\s*\1){2,}\s*$")
LIST_ITEM = re.compile(r"^( *)([-*+]|\d{1,9}[.)])( +|$)(.*)$")
QUOTE = re.compile(r"^ {0,3}> ?(.*)$")
TABLE_SEP = re.compile(r"^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$")


def _slug(text: str) -> str:
    """GitHub's heading anchor, near enough: lowercase, punctuation dropped, spaces to dashes."""
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"\s", "-", text.strip())


def _indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


class Markdown:
    """One document's conversion. `link` rewrites an href: it returns (href, opens_elsewhere),
    or (None, False) to drop the link and keep its text."""

    def __init__(self, doc_id: str, link) -> None:
        self.doc_id = doc_id
        self.link = link
        self.title = ""
        self.toc: List[Dict[str, str]] = []

    # ---- inline ----------------------------------------------------------
    def inline(self, text: str) -> str:
        stash: List[str] = []

        def keep(fragment: str) -> str:
            stash.append(fragment)
            return f"\x00{len(stash) - 1}\x00"

        # Code spans, then backslash escapes: nothing inside either is formatting.
        text = re.sub(
            r"(`+)(.+?)\1",
            lambda m: keep(f"<code>{html.escape(m.group(2).strip(), quote=False)}</code>"),
            text,
        )
        text = re.sub(r"\\([\\`*_{}\[\]()#+\-.!|>~])", lambda m: keep(html.escape(m.group(1))), text)
        text = html.escape(text, quote=False)

        def image(m: re.Match) -> str:
            alt, src = html.unescape(m.group(1)), html.unescape(m.group(2))
            if src.startswith("../site/"):
                src = src[len("../site/"):]
            return keep(f'<img src="{html.escape(src)}" alt="{html.escape(alt)}">')

        def anchor(m: re.Match) -> str:
            words = self.emphasis(m.group(1))
            href, away = self.link(html.unescape(m.group(2)))
            if href is None:
                return keep(words)
            extra = ' target="_blank" rel="noopener"' if away else ""
            return keep(f'<a href="{html.escape(href)}"{extra}>{words}</a>')

        def autolink(m: re.Match) -> str:
            url = html.unescape(m.group(1))
            return keep(
                f'<a href="{html.escape(url)}" target="_blank" rel="noopener">{m.group(1)}</a>'
            )

        text = re.sub(r'!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)', image, text)
        text = re.sub(r'\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)', anchor, text)
        text = re.sub(r"&lt;((?:https?|mailto):[^\s&]+)&gt;", autolink, text)
        text = self.emphasis(text)
        text = re.sub(r" {2,}\n", "<br>\n", text)
        for _ in range(4):  # a stashed link can hold a stashed code span
            text = re.sub(r"\x00(\d+)\x00", lambda m: stash[int(m.group(1))], text)
        return text

    @staticmethod
    def emphasis(text: str) -> str:
        text = re.sub(r"\*\*(?=\S)(.+?)(?<=\S)\*\*", r"<strong>\1</strong>", text)
        text = re.sub(r"(?<![\w_])__(?=\S)(.+?)(?<=\S)__(?![\w_])", r"<strong>\1</strong>", text)
        text = re.sub(r"(?<![*\w])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![*\w])", r"<em>\1</em>", text)
        text = re.sub(r"(?<![\w_])_(?=[^\s_])(.+?)(?<=[^\s_])_(?![\w_])", r"<em>\1</em>", text)
        return text

    # ---- blocks ----------------------------------------------------------
    def starts_block(self, line: str) -> bool:
        """Can this line interrupt a paragraph?"""
        return bool(
            FENCE.match(line) or HEADING.match(line) or HR.match(line) or QUOTE.match(line)
            or LIST_ITEM.match(line) and LIST_ITEM.match(line).group(4).strip()  # type: ignore
        )

    def blocks(self, lines: List[str], tight: bool = False) -> str:
        out: List[str] = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if not line.strip():
                i += 1
                continue

            fence = FENCE.match(line)
            if fence:
                mark, lang = fence.group(1), fence.group(2)
                body: List[str] = []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith(mark):
                    body.append(lines[i])
                    i += 1
                i += 1
                cls = f' class="language-{html.escape(lang)}"' if lang else ""
                code = html.escape("\n".join(body), quote=False)
                out.append(f"<pre><code{cls}>{code}\n</code></pre>" if body else "<pre><code></code></pre>")
                continue

            head = HEADING.match(line)
            if head:
                out.append(self.heading(len(head.group(1)), head.group(2)))
                i += 1
                continue

            if HR.match(line):
                out.append("<hr>")
                i += 1
                continue

            if "|" in line and i + 1 < len(lines) and "|" in lines[i + 1] and TABLE_SEP.match(lines[i + 1]):
                rows = [line, lines[i + 1]]
                i += 2
                while i < len(lines) and lines[i].strip() and "|" in lines[i]:
                    rows.append(lines[i])
                    i += 1
                out.append(self.table(rows))
                continue

            if QUOTE.match(line):
                inner: List[str] = []
                while i < len(lines) and lines[i].strip():
                    q = QUOTE.match(lines[i])
                    inner.append(q.group(1) if q else lines[i])
                    i += 1
                out.append(f"<blockquote>\n{self.blocks(inner)}</blockquote>")
                continue

            if LIST_ITEM.match(line):
                i, rendered = self.list_block(lines, i)
                out.append(rendered)
                continue

            para = [line.strip()]
            i += 1
            while i < len(lines) and lines[i].strip() and not self.starts_block(lines[i]):
                para.append(lines[i].strip())
                i += 1
            body_html = self.inline("\n".join(para))
            out.append(body_html if tight else f"<p>{body_html}</p>")
        return "".join(part + "\n" for part in out)

    def heading(self, level: int, words: str) -> str:
        anchor = _slug(words)
        hid = f"{self.doc_id}--{anchor}"
        if level == 1 and not self.title:
            self.title = words
        if level == 2:
            self.toc.append({"id": hid, "text": words})
        return f'<h{level} id="{html.escape(hid)}">{self.inline(words)}</h{level}>'

    def table(self, rows: List[str]) -> str:
        def cells(row: str) -> List[str]:
            row = row.strip()
            if row.startswith("|"):
                row = row[1:]
            if row.endswith("|") and not row.endswith("\\|"):
                row = row[:-1]
            return [c.strip() for c in re.split(r"(?<!\\)\|", row)]

        aligns = []
        for spec in cells(rows[1]):
            left, right = spec.startswith(":"), spec.endswith(":")
            aligns.append("center" if left and right else "right" if right else "left" if left else "")

        def row_html(row: str, tag: str) -> str:
            parts = cells(row)
            parts += [""] * (len(aligns) - len(parts))
            out = []
            for n, cell in enumerate(parts[: len(aligns)]):
                style = f' style="text-align:{aligns[n]}"' if aligns[n] else ""
                out.append(f"<{tag}{style}>{self.inline(cell)}</{tag}>")
            return "<tr>" + "".join(out) + "</tr>"

        body = "".join(row_html(r, "td") + "\n" for r in rows[2:])
        return (
            f"<table>\n<thead>\n{row_html(rows[0], 'th')}\n</thead>\n"
            + (f"<tbody>\n{body}</tbody>\n" if body else "")
            + "</table>"
        )

    def list_block(self, lines: List[str], i: int) -> Tuple[int, str]:
        first = LIST_ITEM.match(lines[i])
        assert first
        base = len(first.group(1))
        ordered = first.group(2)[0].isdigit()
        start = int(first.group(2)[:-1]) if ordered else 1

        items: List[List[str]] = []
        loose = False
        offset = 0
        while i < len(lines):
            line = lines[i]
            item = LIST_ITEM.match(line)
            same_kind = item is not None and item.group(2)[0].isdigit() == ordered
            if item and same_kind and _indent(line) < max(offset, base + 1) and _indent(line) >= base:
                # A sibling item. Its content starts after the marker and its spaces.
                spaces = len(item.group(3)) if item.group(4) else 1
                spaces = spaces if spaces <= 4 else 1
                offset = len(item.group(1)) + len(item.group(2)) + spaces
                items.append([item.group(4)])
                i += 1
                continue
            if not line.strip():
                # A blank line continues the list only if the list goes on after it.
                j = i + 1
                while j < len(lines) and not lines[j].strip():
                    j += 1
                if j >= len(lines):
                    break
                nxt = LIST_ITEM.match(lines[j])
                ind = _indent(lines[j])
                sibling = nxt is not None and nxt.group(2)[0].isdigit() == ordered and base <= ind < offset
                if sibling or ind >= offset:
                    # A blank between items, or before a paragraph inside one, makes the
                    # list loose (paragraphs in <p>). A blank before a nested list does not.
                    if sibling or not nxt:
                        loose = True
                    items[-1].append("")
                    i += 1
                    continue
                break
            if _indent(line) >= offset:
                items[-1].append(line[offset:])
                i += 1
                continue
            # A lazy continuation: a less-indented line straight after item text.
            if items[-1][-1].strip() and not self.starts_block(line):
                items[-1].append(line.strip())
                i += 1
                continue
            break

        tag = "ol" if ordered else "ul"
        attr = f' start="{start}"' if ordered and start != 1 else ""
        parts = []
        for content in items:
            while content and not content[-1].strip():
                content.pop()
            box = ""
            task = re.match(r"^\[( |x|X)\]\s+", content[0]) if content else None
            if task:
                checked = " checked" if task.group(1) != " " else ""
                box = f'<input type="checkbox" disabled{checked}> '
                content[0] = content[0][task.end():]
            inner = self.blocks(content, tight=not loose).strip()
            parts.append(f"<li>{box}{inner}</li>")
        return i, f"<{tag}{attr}>\n" + "\n".join(parts) + f"\n</{tag}>"


def _repo_base(catalog: Dict[str, Any]) -> str:
    if REPO_URL:
        return REPO_URL
    repo = (catalog.get("project") or {}).get("repo") or ""
    return f"https://github.com/{repo}/blob/main/" if repo else ""


def _rewrite_href(href: str, doc_id: str, repo_base: str) -> Tuple[Optional[str], bool]:
    """Where a link in a doc should go on the page. Returns (href, opens_elsewhere)."""
    if re.match(r"^[a-z]+:", href):
        return href, True
    if href.startswith("#"):
        return f"#design/{doc_id}/{href[1:]}", False
    path, _, frag = href.partition("#")
    target = (DOCS / path).resolve()
    if target.parent == DOCS.resolve() and target.name in DESIGN_DOCS:
        return f"#design/{target.stem}" + (f"/{frag}" if frag else ""), False
    try:
        rel = target.relative_to(ROOT.resolve()).as_posix()
    except ValueError:
        return href, True
    if not repo_base:
        return None, False
    return repo_base + rel + (f"#{frag}" if frag else ""), True


def render_doc(text: str, doc_id: str, repo_base: str) -> Dict[str, Any]:
    """One markdown doc as `{title, html, toc}`."""
    text = strip_comments(text).replace("\t", "    ")
    # `{#key}` task keys in the build plan show as code, not as stray braces.
    text = re.sub(r"\{#([a-z0-9-]+)\}", r"`#\1`", text)
    md = Markdown(doc_id, lambda href: _rewrite_href(href, doc_id, repo_base))
    out = md.blocks(text.splitlines())

    # The docs name each other in backticks far more than they link. A backticked doc name
    # becomes a link to that doc on the Design tab, so "see `01-architecture.md`" is one click.
    def _doc_link(m: re.Match) -> str:
        name = m.group(2)
        if name not in DESIGN_DOCS:
            return m.group(0)
        return f'<a href="#design/{Path(name).stem}"><code>{m.group(1) or ""}{name}</code></a>'

    out = re.sub(r"<code>(docs/)?([\w.-]+\.md)</code>", _doc_link, out)
    # Tables scroll inside their own box rather than widening the page.
    out = out.replace("<table>", '<div class="doc-table"><table>')
    out = out.replace("</table>", "</table></div>")
    return {"title": md.title or doc_id, "html": out, "toc": md.toc}


def parse_docs(repo_base: str) -> List[Dict[str, Any]]:
    out = []
    for name in DESIGN_DOCS:
        doc_id = Path(name).stem
        rendered = render_doc((DOCS / name).read_text(), doc_id, repo_base)
        out.append({"id": doc_id, "file": f"docs/{name}", **rendered})
    return out


# --------------------------------------------------------------------------
# Glossary — the "Domain vocabulary" section of CLAUDE.md
#
# Entries are `- **Term** — definition`. Indented `  - **Part** — definition` lines are
# parts of the term above. A sentence like `Not "worker", not "helper".` in a definition
# is pulled out into the term's banned synonyms.
# --------------------------------------------------------------------------
TERM = re.compile(r"^- \*\*(.+?)\*\* — (.*)$")
SUBTERM = re.compile(r"^  - \*\*(.+?)\*\* — (.*)$")
BANNED_SENTENCE = re.compile(r"\s*Not\s+[“\"][^.]*\.\s*", re.IGNORECASE)
BANNED_TERM = re.compile(r"[“\"]([^”\"]+)[”\"]")


def parse_glossary(text: str) -> List[Dict[str, Any]]:
    """Every term in CLAUDE.md's Domain vocabulary, with its banned synonyms split out."""
    text = strip_comments(text)
    if "## Domain vocabulary" not in text:
        return []
    block = text.split("## Domain vocabulary", 1)[1].split("\n## ", 1)[0]

    entries: List[Dict[str, Any]] = []
    for line in block.splitlines():
        sub = SUBTERM.match(line)
        top = None if sub else TERM.match(line)
        if top:
            entries.append({"term": top.group(1), "definition": top.group(2).strip(), "parts": []})
        elif sub and entries:
            entries[-1]["parts"].append({"term": sub.group(1), "definition": sub.group(2).strip()})
        elif line.startswith("    ") and entries and entries[-1]["parts"]:
            entries[-1]["parts"][-1]["definition"] += " " + line.strip()
        elif line.startswith("  ") and line.strip() and entries and not line.lstrip().startswith("- "):
            entries[-1]["definition"] += " " + line.strip()

    for entry in entries:
        banned = BANNED_SENTENCE.search(entry["definition"])
        if not banned:
            continue
        entry["never"] = BANNED_TERM.findall(banned.group(0))
        entry["definition"] = BANNED_SENTENCE.sub(" ", entry["definition"]).strip()
    return entries


# --------------------------------------------------------------------------
# Milestones — docs/07-build-plan.md
#
# `## M<N> — Title` starts a milestone. `Goal:` and `**Done when:**` lines describe it.
# `- [ ]` / `- [x]` are its tasks. A task that starts `{#key}` carries a key; a task
# containing `*(blocked …)*` is blocked rather than merely unticked.
# --------------------------------------------------------------------------
MS_HEAD = re.compile(r"^## (M\d+) — (.+?)\s*$")
TASK = re.compile(r"^\s*- \[( |x)\] (.+?)\s*$")
TASK_KEY = re.compile(r"^\{#([a-z0-9-]+)\}\s*")
DONE_WHEN = re.compile(r"^\*\*Done when:\*\*\s*(.*)$")
GOAL = re.compile(r"^Goal:\s*(.+?)\s*$")


def _task(done: bool, text: str) -> Dict[str, Any]:
    """One checkbox, with its key split off the text when it has one."""
    key = TASK_KEY.match(text)
    out: Dict[str, Any] = {"done": done, "text": text[key.end():] if key else text}
    if key:
        out["key"] = key.group(1)
    return out


def parse_milestones(text: str) -> List[Dict[str, Any]]:
    """Milestones in build order, with their real task counts.

    Status is derived, never declared: all boxes ticked is `done`, some ticked
    is `active`, none is `planned`. The plan is the source of truth for whether
    something is built, so the page cannot claim a milestone the plan hasn't.
    """
    out: List[Dict[str, Any]] = []
    cur: Optional[Dict[str, Any]] = None
    collecting_done_when = False

    for line in strip_comments(text).splitlines():
        head = MS_HEAD.match(line)
        if head:
            collecting_done_when = False
            cur = {"id": head.group(1), "title": head.group(2), "goal": "", "tasks": [], "done_when": ""}
            out.append(cur)
            continue
        if cur is None:
            continue

        if line.startswith("## ") or line.startswith("---"):
            collecting_done_when = False
            if line.startswith("## "):
                cur = None
            continue

        goal = GOAL.match(line)
        if goal:
            cur["goal"] = goal.group(1)
            continue

        task = TASK.match(line)
        if task:
            collecting_done_when = False
            cur["tasks"].append(_task(task.group(1) == "x", task.group(2)))
            continue

        # A task wraps onto indented lines in the source. Keep them, or an expanded
        # milestone shows half a sentence.
        if cur["tasks"] and line.startswith("      ") and line.strip():
            cur["tasks"][-1]["text"] += " " + line.strip()
            continue

        dw = DONE_WHEN.match(line)
        if dw:
            cur["done_when"] = dw.group(1)
            collecting_done_when = True
            continue

        # "Done when:" wraps across lines in the source. Keep gathering until a blank line.
        if collecting_done_when:
            if not line.strip():
                collecting_done_when = False
            else:
                cur["done_when"] = (cur["done_when"] + " " + line.strip()).strip()

    for m in out:
        total = len(m["tasks"])
        done = sum(1 for t in m["tasks"] if t["done"])
        m["task_total"] = total
        m["task_done"] = done
        m["status"] = "done" if total and done == total else "active" if done else "planned"
        # A task carrying `*(blocked …)*` has a reason it is not ticked. "Not done" and
        # "blocked" are different conversations; the page shows them apart.
        m["blocked"] = [t["text"] for t in m["tasks"] if not t["done"] and "*(blocked" in t["text"]]
    return out


def parse_dod(text: str) -> List[Dict[str, Any]]:
    """The v1 Definition of Done checklist: the boxes under `## v1 — Definition of Done`."""
    out: List[Dict[str, Any]] = []
    inside = False
    for line in strip_comments(text).splitlines():
        if line.startswith("## v1 — Definition of Done"):
            inside = True
            continue
        if inside and (line.startswith("---") or line.startswith("## ")):
            break
        if not inside:
            continue
        task = TASK.match(line)
        if task:
            out.append(_task(task.group(1) == "x", task.group(2)))
        elif out and line.strip() and not line.startswith(("#", "-", "*")):
            out[-1]["text"] += " " + line.strip()
    return out


# --------------------------------------------------------------------------
# Open decisions — docs/99-open-questions.md
#
# Each `## Question?` with `**Status:**`, `**Resolution trigger:**` and `**Notes:**` lines.
# --------------------------------------------------------------------------
def parse_decisions(text: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    cur: Optional[Dict[str, Any]] = None
    field: Optional[str] = None
    for line in strip_comments(text).splitlines():
        if line.startswith("## "):
            cur = {"question": line[3:].strip(), "status": "", "trigger": "", "notes": ""}
            out.append(cur)
            field = None
            continue
        if cur is None:
            continue
        for label, key in (
            ("**Status:**", "status"),
            ("**Resolution trigger:**", "trigger"),
            ("**Notes:**", "notes"),
        ):
            if line.startswith(label):
                cur[key] = line[len(label):].strip()
                field = key
                break
        else:
            if field and line.strip():
                cur[field] = (cur[field] + " " + line.strip()).strip()
            elif not line.strip():
                field = None
    for d in out:
        s = d["status"].lower()
        d["state"] = (
            "resolved" if s.startswith(("resolved", "decided")) or "resolved" in s.split(" — ")[0]
            else "deferred" if "deferred" in s or "out of v1" in s
            else "open"
        )
    return out


# --------------------------------------------------------------------------
# Build state — counted from the milestones, never typed
# --------------------------------------------------------------------------
NOW = re.compile(r"^\*\*Now:\*\*\s*(.+)$", re.M)


def parse_now(plan: str) -> List[str]:
    """The milestones the build plan's `**Now:**` line names, in its order: `M2`, or `M2, M3`."""
    found = NOW.search(strip_comments(plan))
    return re.findall(r"\bM\d+\b", found.group(1)) if found else []


def _current_milestone(milestones: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """The first unfinished milestone, stepping over one whose only open tasks are blocked."""
    unfinished = [m for m in milestones if m["status"] != "done"]
    if not unfinished:
        return None
    for m in unfinished:
        if any(not t["done"] and "*(blocked" not in t["text"] for t in m["tasks"]):
            return m
    return unfinished[0]


def derive_phase(milestones: List[Dict[str, Any]], now: Optional[List[str]] = None) -> str:
    """Where the build is, in a pill's worth of words. Counted, never characterised."""
    if not milestones:
        return "No build plan"
    by_id = {m["id"]: m for m in milestones}
    named = [by_id[i] for i in now or [] if i in by_id and by_id[i]["status"] != "done"]
    if named:
        return "Building " + "; ".join(f"{m['id']} — {m['title']}" for m in named)
    current = _current_milestone(milestones)
    if current is None:
        return "v1 complete"
    return f"Building {current['id']} — {current['title']}"


def derive_banner(milestones: List[Dict[str, Any]], now: Optional[List[str]] = None) -> str:
    """The strip across the top of the page."""
    if not milestones:
        return ""
    done = sum(1 for m in milestones if m["status"] == "done")
    blocked = sum(len(m["blocked"]) for m in milestones)
    parts = [derive_phase(milestones, now), f"{done} of {len(milestones)} milestones complete"]
    if blocked:
        parts.append(f"{blocked} blocked task{'s' if blocked != 1 else ''}")
    return " · ".join(parts) + ". Anything marked planned is unticked in the build plan."


# --------------------------------------------------------------------------
def main() -> int:
    catalog: Dict[str, Any] = json.loads(CATALOG.read_text()) if CATALOG.exists() else {}

    plan = BUILD_PLAN.read_text() if BUILD_PLAN.exists() else ""
    catalog["milestones"] = parse_milestones(plan)
    catalog["dod"] = parse_dod(plan)
    catalog["decisions"] = parse_decisions(QUESTIONS.read_text()) if QUESTIONS.exists() else []
    catalog["glossary"] = parse_glossary(VOCABULARY.read_text()) if VOCABULARY.exists() else []
    catalog["docs"] = parse_docs(_repo_base(catalog))
    catalog["generated_at"] = date.today().isoformat()

    project = catalog.setdefault("project", {})
    now = parse_now(plan)
    project["phase"] = derive_phase(catalog["milestones"], now)
    project["banner"] = derive_banner(catalog["milestones"], now)
    project["updated"] = catalog["generated_at"]

    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")

    ms = catalog["milestones"]
    print(f"milestones : {len(ms)}  ({sum(1 for m in ms if m['status'] == 'done')} done)")
    print(f"dod        : {len(catalog['dod'])} items")
    print(f"phase      : {project['phase']}")
    print(f"decisions  : {len(catalog['decisions'])}")
    print(f"docs       : {len(catalog['docs'])} design docs")
    print(f"glossary   : {len(catalog['glossary'])} terms")
    print(f"wrote      : {CATALOG.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
