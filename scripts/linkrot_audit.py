#!/usr/bin/env python3
"""Build a canonical outbound-link inventory and link check report for Jekyll posts."""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import request as urlrequest
from urllib.parse import urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
DEFAULT_OUTPUT = ROOT / "data" / "link_inventory_posts.json"
DEFAULT_REPORT_OUTPUT = ROOT / "data" / "link_check_report_posts.json"
DEFAULT_TIMEOUT = 15.0
DEFAULT_USER_AGENT = "martinstabe-linkrot-audit/1.0"

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


def is_internal_martinstabe_url(url: str) -> bool:
    hostname = urlsplit(url).hostname or ""
    hostname = hostname.lower().rstrip(".")
    return hostname == "martinstabe.com" or hostname.endswith(".martinstabe.com")


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
            if is_internal_martinstabe_url(match.group("url")):
                continue
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
            if is_internal_martinstabe_url(match.group("url")):
                continue
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
            if is_internal_martinstabe_url(ref_match.group("url")):
                consumed_spans.append(ref_match.span("url"))
                continue
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
            if is_internal_martinstabe_url(match.group(0)):
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


def build_inventory(post_paths: list[Path], posts_dir: Path) -> dict[str, Any]:
    occurrences: list[dict[str, Any]] = []
    for post_path in post_paths:
        occurrences.extend(extract_occurrences(post_path))

    return {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "scope": {
            "posts_dir": posts_dir.relative_to(ROOT).as_posix() if posts_dir.is_relative_to(ROOT) else str(posts_dir),
            "excluded_paths": ["slides/", "index.html", "about/index.html", "links/index.md"],
            "excluded_domains": ["martinstabe.com", "*.martinstabe.com"],
            "file_count": len(post_paths),
        },
        "summary": {
            "total_occurrences": len(occurrences),
            "unique_normalized_urls": len({item["normalized_url"] for item in occurrences}),
        },
        "occurrences": occurrences,
        "unique_urls": build_unique_urls(occurrences),
    }


def request_with_method(url: str, method: str, timeout: float, user_agent: str) -> dict[str, Any]:
    req = urlrequest.Request(url, headers={"User-Agent": user_agent}, method=method)
    try:
        with urlrequest.urlopen(req, timeout=timeout) as response:
            status = getattr(response, "status", response.getcode())
            return {
                "status": int(status) if status is not None else None,
                "final_url": response.geturl(),
                "error": None,
                "method": method,
            }
    except urlerror.HTTPError as exc:
        return {
            "status": int(exc.code) if exc.code is not None else None,
            "final_url": exc.geturl() or url,
            "error": None,
            "method": method,
        }
    except Exception as exc:
        return {
            "status": None,
            "final_url": url,
            "error": f"{type(exc).__name__}: {exc}",
            "method": method,
        }


def should_retry_with_get(result: dict[str, Any]) -> bool:
    if result["method"] != "HEAD":
        return False
    if result["error"] is not None:
        return True
    status = result["status"]
    return status in {
        400,
        403,
        405,
        408,
        409,
        425,
        429,
        500,
        501,
        502,
        503,
        504,
        520,
        521,
        522,
        523,
        524,
        525,
        526,
        999,
    }


def check_url(url: str, timeout: float, user_agent: str) -> dict[str, Any]:
    result = request_with_method(url, "HEAD", timeout, user_agent)
    if should_retry_with_get(result):
        result = request_with_method(url, "GET", timeout, user_agent)
    return result


def build_link_check_report(
    inventory: dict[str, Any],
    timeout: float,
    user_agent: str,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    report: list[dict[str, Any]] = []
    unique_items = inventory["unique_urls"] if limit is None else inventory["unique_urls"][:limit]
    for item in unique_items:
        representative_url = item["original_urls"][0]
        result = check_url(representative_url, timeout=timeout, user_agent=user_agent)
        report.append(
            {
                "url": representative_url,
                "normalized_url": item["normalized_url"],
                "original_urls": item["original_urls"],
                "status": result["status"],
                "final_url": result["final_url"],
                "error": result["error"],
                "method": result["method"],
                "occurrences": item["occurrences"],
                "count": item["occurrence_count"],
                "files": item["files"],
                "posts": item["posts"],
                "sample_link_texts": item["sample_link_texts"],
            }
        )

    report.sort(
        key=lambda entry: (
            entry["status"] is None,
            -(entry["count"]),
            entry["url"],
        )
    )
    return report


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
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check each unique extracted URL and emit a report.",
    )
    parser.add_argument(
        "--report-output",
        type=Path,
        default=DEFAULT_REPORT_OUTPUT,
        help="Path to write the JSON link check report.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=DEFAULT_TIMEOUT,
        help="Network timeout in seconds for each request.",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help="User-Agent string to send while checking links.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only check the first N unique URLs from the inventory.",
    )
    args = parser.parse_args()

    posts_dir = args.posts_dir.resolve()
    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    report_output_path = args.report_output.resolve()
    report_output_path.parent.mkdir(parents=True, exist_ok=True)

    post_paths = sorted(posts_dir.glob("*.md")) + sorted(posts_dir.glob("*.markdown")) + sorted(posts_dir.glob("*.html"))
    data = build_inventory(post_paths, posts_dir)

    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote inventory to {output_path}")
    print(
        f"Inventory contains {data['summary']['total_occurrences']} occurrences across "
        f"{data['summary']['unique_normalized_urls']} unique normalized URLs"
    )

    if args.check:
        report = build_link_check_report(
            data,
            timeout=args.timeout,
            user_agent=args.user_agent,
            limit=args.limit,
        )
        report_output_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote link check report with {len(report)} unique URLs to {report_output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
