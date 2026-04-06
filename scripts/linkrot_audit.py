#!/usr/bin/env python3
"""Build a canonical outbound-link inventory for Jekyll posts."""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
DEFAULT_OUTPUT = ROOT / "data" / "link_inventory_posts.json"

HTTP_URL_RE = re.compile(r"https?://[^\s<>()\[\]\"']+")
HTML_LINK_RE = re.compile(
    r"<a\b[^>]*?\bhref=(?P<quote>[\"'])(?P<url>https?://.*?)(?P=quote)[^>]*>(?P<text>.*?)</a>",
    re.IGNORECASE,
)
MARKDOWN_INLINE_RE = re.compile(
    r"(?P<image>!?)\[(?P<text>[^\]]+)\]\((?P<url>https?://[^)\s]+)(?:\s+\".*?\")?\)"
)
MARKDOWN_REF_DEF_RE = re.compile(
    r"^\s{0,3}\[(?P<id>[^\]]+)\]:\s*(?P<url>https?://\S+)",
    re.IGNORECASE,
)
MARKDOWN_REF_USE_RE = re.compile(
    r"(?P<image>!?)\[(?P<text>[^\]]+)\]\[(?P<id>[^\]]*)\]"
)
FRONT_MATTER_RE = re.compile(r"\A---\n(.*?)\n---\n?", re.DOTALL)
TITLE_RE = re.compile(r"^title:\s*(.+?)\s*$", re.MULTILINE)
PERMALINK_RE = re.compile(r"^permalink:\s*(.+?)\s*$", re.MULTILINE)


def strip_wrapping_punctuation(url: str) -> str:
    while url and url[-1] in ".,;:!?":
        url = url[:-1]
    return url


def normalize_url(url: str) -> str:
    url = strip_wrapping_punctuation(url)
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    netloc = parts.netloc.lower()
    path = parts.path or "/"
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    fragment = parts.fragment
    return urlunsplit((scheme, netloc, path, parts.query, fragment))


def clean_html_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def trim_context(line: str, max_len: int = 240) -> str:
    text = html.unescape(re.sub(r"\s+", " ", line.strip()))
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def parse_front_matter(text: str) -> tuple[dict[str, str], str]:
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return {}, text
    front_matter = match.group(1)
    body = text[match.end() :]
    data: dict[str, str] = {}
    title_match = TITLE_RE.search(front_matter)
    permalink_match = PERMALINK_RE.search(front_matter)
    if title_match:
        data["title"] = title_match.group(1).strip().strip("'\"")
    if permalink_match:
        data["permalink"] = permalink_match.group(1).strip().strip("'\"")
    return data, body


def make_occurrence(
    *,
    post_path: Path,
    post_meta: dict[str, str],
    line_no: int,
    line_text: str,
    url: str,
    source_type: str,
    link_text: str | None = None,
    reference_id: str | None = None,
    reference_usage_lines: list[int] | None = None,
    reference_link_texts: list[str] | None = None,
) -> dict[str, Any]:
    rel_path = post_path.relative_to(ROOT).as_posix()
    post_date = post_path.name[:10] if re.match(r"\d{4}-\d{2}-\d{2}", post_path.name[:10]) else None
    occurrence: dict[str, Any] = {
        "file": rel_path,
        "line": line_no,
        "post_date": post_date,
        "post_title": post_meta.get("title"),
        "permalink": post_meta.get("permalink"),
        "url": url,
        "normalized_url": normalize_url(url),
        "source_type": source_type,
        "context": trim_context(line_text),
    }
    if link_text:
        occurrence["link_text"] = clean_html_text(link_text)
    if reference_id is not None:
        occurrence["reference_id"] = reference_id
    if reference_usage_lines:
        occurrence["reference_usage_lines"] = reference_usage_lines
    if reference_link_texts:
        occurrence["reference_link_texts"] = sorted(set(filter(None, reference_link_texts)))
    return occurrence


def collect_reference_uses(lines: list[str]) -> dict[str, list[dict[str, Any]]]:
    uses: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for line_no, line in enumerate(lines, start=1):
        for match in MARKDOWN_REF_USE_RE.finditer(line):
            ref_id = (match.group("id") or match.group("text")).strip().lower()
            uses[ref_id].append(
                {
                    "line": line_no,
                    "text": clean_html_text(match.group("text")),
                }
            )
    return uses


def extract_occurrences(post_path: Path) -> list[dict[str, Any]]:
    text = post_path.read_text(encoding="utf-8")
    post_meta, body = parse_front_matter(text)
    lines = body.splitlines()
    reference_uses = collect_reference_uses(lines)
    occurrences: list[dict[str, Any]] = []

    for line_no, line in enumerate(lines, start=1):
        consumed_spans: list[tuple[int, int]] = []

        for match in HTML_LINK_RE.finditer(line):
            consumed_spans.append(match.span("url"))
            occurrences.append(
                make_occurrence(
                    post_path=post_path,
                    post_meta=post_meta,
                    line_no=line_no,
                    line_text=line,
                    url=match.group("url"),
                    source_type="html_anchor",
                    link_text=match.group("text"),
                )
            )

        for match in MARKDOWN_INLINE_RE.finditer(line):
            consumed_spans.append(match.span("url"))
            occurrences.append(
                make_occurrence(
                    post_path=post_path,
                    post_meta=post_meta,
                    line_no=line_no,
                    line_text=line,
                    url=match.group("url"),
                    source_type="markdown_inline_image" if match.group("image") else "markdown_inline",
                    link_text=match.group("text"),
                )
            )

        ref_match = MARKDOWN_REF_DEF_RE.match(line)
        if ref_match:
            ref_id = ref_match.group("id").strip().lower()
            ref_uses = reference_uses.get(ref_id, [])
            occurrences.append(
                make_occurrence(
                    post_path=post_path,
                    post_meta=post_meta,
                    line_no=line_no,
                    line_text=line,
                    url=ref_match.group("url"),
                    source_type="markdown_reference_definition",
                    reference_id=ref_id,
                    reference_usage_lines=[item["line"] for item in ref_uses],
                    reference_link_texts=[item["text"] for item in ref_uses],
                )
            )
            consumed_spans.append(ref_match.span("url"))

        for match in HTTP_URL_RE.finditer(line):
            span = match.span()
            if any(not (span[1] <= start or span[0] >= end) for start, end in consumed_spans):
                continue
            occurrences.append(
                make_occurrence(
                    post_path=post_path,
                    post_meta=post_meta,
                    line_no=line_no,
                    line_text=line,
                    url=match.group(0),
                    source_type="raw_url",
                )
            )

    return occurrences


def build_unique_urls(occurrences: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    by_normalized: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for occurrence in occurrences:
        by_normalized[occurrence["normalized_url"]].append(occurrence)

    for normalized_url, items in by_normalized.items():
        original_urls = sorted({item["url"] for item in items})
        grouped[normalized_url] = {
            "normalized_url": normalized_url,
            "original_urls": original_urls,
            "occurrence_count": len(items),
            "files": sorted({item["file"] for item in items}),
            "posts": sorted(
                {
                    item["permalink"] or item["file"]
                    for item in items
                }
            ),
            "sample_link_texts": sorted(
                {
                    text
                    for item in items
                    for text in (
                        ([item["link_text"]] if item.get("link_text") else [])
                        + item.get("reference_link_texts", [])
                    )
                    if text
                }
            )[:10],
            "occurrences": [
                {
                    "file": item["file"],
                    "line": item["line"],
                    "source_type": item["source_type"],
                }
                for item in items
            ],
        }

    return sorted(grouped.values(), key=lambda item: (-item["occurrence_count"], item["normalized_url"]))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--posts-dir",
        type=Path,
        default=POSTS_DIR,
        help="Directory containing post source files.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Path to write the JSON inventory.",
    )
    args = parser.parse_args()

    posts_dir = args.posts_dir.resolve()
    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    post_paths = sorted(posts_dir.glob("*.md")) + sorted(posts_dir.glob("*.markdown")) + sorted(posts_dir.glob("*.html"))
    occurrences: list[dict[str, Any]] = []
    for post_path in post_paths:
        occurrences.extend(extract_occurrences(post_path))

    data = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "scope": {
            "posts_dir": posts_dir.relative_to(ROOT).as_posix() if posts_dir.is_relative_to(ROOT) else str(posts_dir),
            "excluded_paths": ["slides/", "index.html", "about/index.html", "links/index.md"],
            "file_count": len(post_paths),
        },
        "summary": {
            "total_occurrences": len(occurrences),
            "unique_normalized_urls": len({item["normalized_url"] for item in occurrences}),
        },
        "occurrences": occurrences,
        "unique_urls": build_unique_urls(occurrences),
    }

    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"Wrote {len(occurrences)} occurrences across "
        f"{data['summary']['unique_normalized_urls']} unique normalized URLs to {output_path}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
