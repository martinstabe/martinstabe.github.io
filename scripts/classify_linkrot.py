#!/usr/bin/env python3
"""Classify link-check results into phase 3 remediation dispositions."""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "link_check_report_target_domains.json"
DEFAULT_OUTPUT = ROOT / "data" / "linkrot_decisions_target_domains.json"

TARGET_DOMAIN_HINTS = {
    "pressgazette.co.uk": "Legacy Press Gazette content often needs archive lookup or a modern Press Gazette search replacement.",
    "ft.com": "Legacy FT links may map to modern ft.com article URLs, but exact canonical targets usually need verification.",
    "blogs.ft.com": "Legacy FT blog URLs often moved or were retired; treat as likely archive or canonical-search candidates.",
    "retail-week.com": "Legacy Retail Week links may now require login, paywall, or archive fallback.",
    "drapersonline.com": "Drapers profile and article URLs may have changed structure and usually need manual verification.",
}


def get_hostname(url: str) -> str:
    return (urlsplit(url).hostname or "").lower().rstrip(".")


def base_domain_hint(hostname: str) -> str | None:
    for domain, hint in TARGET_DOMAIN_HINTS.items():
        if hostname == domain or hostname.endswith("." + domain):
            return hint
    return None


def classify_entry(entry: dict[str, Any]) -> dict[str, Any]:
    hostname = get_hostname(entry["url"])
    status = entry.get("status")
    error = entry.get("error")
    final_url = entry.get("final_url")
    decision = "manual-review"
    reason = ""
    review_priority = "medium"

    if isinstance(status, int) and 200 <= status < 300:
        if final_url and final_url != entry["url"]:
            decision = "alive-but-redirected"
            reason = f"Live check succeeded and redirected to {final_url}."
            review_priority = "low"
        else:
            decision = "alive-canonical"
            reason = "Live check succeeded without an observed redirect."
            review_priority = "low"
    elif status in {404, 410}:
        decision = "dead-unresolved"
        reason = f"Live check returned HTTP {status}; Wayback lookup is still needed before deciding a replacement."
        review_priority = "high"
    elif isinstance(status, int) and status in {301, 302, 303, 307, 308}:
        decision = "alive-but-redirected"
        reason = f"Live check returned redirect status {status}; canonical destination should be reviewed."
        review_priority = "medium"
    elif error:
        decision = "manual-review"
        reason = f"Automated live check was inconclusive: {error}"
        review_priority = "high"
    else:
        decision = "manual-review"
        reason = "Automated live check did not provide enough evidence to classify safely."
        review_priority = "medium"

    hint = base_domain_hint(hostname)
    notes: list[str] = []
    if hint:
        notes.append(hint)
    if hostname in {"news.ft.com", "blogs.ft.com", "ftalphaville.ft.com"}:
        notes.append("This hostname is legacy FT infrastructure, so a canonical modern FT destination is plausible but not inferable safely from the URL alone.")
    if hostname in {"blogs.pressgazette.co.uk", "discuss.pressgazette.co.uk"}:
        notes.append("This legacy Press Gazette subdomain likely needs archive-first review because the original site structure no longer looks current.")
    if entry.get("count", 0) >= 3:
        notes.append(f"High-impact URL: appears {entry['count']} times in `_posts`.")

    return {
        "url": entry["url"],
        "normalized_url": entry.get("normalized_url"),
        "hostname": hostname,
        "disposition": decision,
        "reason": reason,
        "review_priority": review_priority,
        "replacement_url": None,
        "status": status,
        "final_url": final_url,
        "error": error,
        "method": entry.get("method"),
        "count": entry.get("count"),
        "occurrences": entry.get("occurrences", []),
        "files": entry.get("files", []),
        "posts": entry.get("posts", []),
        "sample_link_texts": entry.get("sample_link_texts", []),
        "notes": notes,
    }


def summarize(decisions: list[dict[str, Any]]) -> dict[str, Any]:
    disposition_counts: dict[str, int] = {}
    hostname_counts: dict[str, int] = {}
    for item in decisions:
        disposition_counts[item["disposition"]] = disposition_counts.get(item["disposition"], 0) + 1
        hostname_counts[item["hostname"]] = hostname_counts.get(item["hostname"], 0) + 1

    return {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "decision_count": len(decisions),
        "dispositions": dict(sorted(disposition_counts.items())),
        "by_hostname": dict(sorted(hostname_counts.items())),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Path to a link check report JSON file.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to write the classified decisions JSON.")
    args = parser.parse_args()

    report = json.loads(args.input.read_text(encoding="utf-8"))
    decisions = [classify_entry(entry) for entry in report]
    data = {
        "source_report": str(args.input.resolve()),
        "summary": summarize(decisions),
        "decisions": decisions,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(decisions)} phase-3 decisions to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
