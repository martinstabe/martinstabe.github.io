#!/usr/bin/env python3
"""Enrich phase-3 link decisions with Wayback candidate captures."""

from __future__ import annotations

import argparse
import datetime as dt
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DECISIONS_INPUT = ROOT / "data" / "linkrot_decisions_target_domains.json"
DEFAULT_INVENTORY_INPUT = ROOT / "data" / "link_inventory_posts.json"
DEFAULT_OUTPUT = ROOT / "data" / "linkrot_decisions_target_domains_wayback.json"
WAYBACK_AVAILABILITY_URL = "https://archive.org/wayback/available"
DEFAULT_TIMEOUT = 8.0
DEFAULT_USER_AGENT = "martinstabe-linkrot-audit/1.0"
DEFAULT_WORKERS = 8


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def build_occurrence_post_date_map(inventory: dict[str, Any]) -> dict[tuple[str, int], str]:
    mapping: dict[tuple[str, int], str] = {}
    for occurrence in inventory.get("occurrences", []):
        post_date = occurrence.get("post_date")
        if not post_date:
            continue
        mapping[(occurrence["file"], occurrence["line"])] = post_date
    return mapping


def infer_reference_post_date(decision: dict[str, Any], post_date_map: dict[tuple[str, int], str]) -> str | None:
    dates = []
    for occurrence in decision.get("occurrences", []):
        key = (occurrence.get("file"), occurrence.get("line"))
        post_date = post_date_map.get(key)
        if post_date:
            dates.append(post_date)
    if not dates:
        return None
    return min(dates)


def yyyymmddhhmmss_from_date(date_str: str | None, future_bias: bool = False) -> str | None:
    if not date_str:
        return None
    suffix = "235959" if future_bias else "000000"
    return date_str.replace("-", "") + suffix


def wayback_request(url: str, *, timestamp: str | None, timeout: float, user_agent: str) -> dict[str, Any]:
    query = {"url": url}
    if timestamp:
        query["timestamp"] = timestamp
    request_url = f"{WAYBACK_AVAILABILITY_URL}?{urlparse.urlencode(query)}"
    req = urlrequest.Request(request_url, headers={"User-Agent": user_agent})
    with urlrequest.urlopen(req, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload


def simplify_wayback_response(payload: dict[str, Any]) -> dict[str, Any] | None:
    archived = payload.get("archived_snapshots", {})
    closest = archived.get("closest")
    if not closest:
        return None
    return {
        "available": bool(closest.get("available")),
        "status": closest.get("status"),
        "timestamp": closest.get("timestamp"),
        "url": closest.get("url"),
    }


def build_enriched_decision(
    decision: dict[str, Any],
    post_date_map: dict[tuple[str, int], str],
    *,
    timeout: float,
    user_agent: str,
) -> dict[str, Any]:
    enriched = dict(decision)
    reference_post_date = infer_reference_post_date(decision, post_date_map)
    lookup_errors: list[str] = []

    latest_capture = None
    try:
        latest_payload = wayback_request(
            decision["url"],
            timestamp=yyyymmddhhmmss_from_date("2099-12-31", future_bias=True),
            timeout=timeout,
            user_agent=user_agent,
        )
        latest_capture = simplify_wayback_response(latest_payload)
    except Exception as exc:
        lookup_errors.append(f"latest_capture_lookup_failed: {type(exc).__name__}: {exc}")

    nearest_capture = None
    if reference_post_date:
        try:
            nearest_payload = wayback_request(
                decision["url"],
                timestamp=yyyymmddhhmmss_from_date(reference_post_date),
                timeout=timeout,
                user_agent=user_agent,
            )
            nearest_capture = simplify_wayback_response(nearest_payload)
        except Exception as exc:
            lookup_errors.append(f"closest_to_post_date_lookup_failed: {type(exc).__name__}: {exc}")

    candidate_url = None
    candidate_basis = None
    if latest_capture and latest_capture.get("url"):
        candidate_url = latest_capture["url"]
        candidate_basis = "latest_available_capture"
    elif nearest_capture and nearest_capture.get("url"):
        candidate_url = nearest_capture["url"]
        candidate_basis = "closest_to_post_date"

    wayback_status = "no_capture_found"
    if candidate_url:
        wayback_status = "candidate_generated"
    elif lookup_errors:
        wayback_status = "lookup_error"

    notes = list(enriched.get("notes", []))
    if candidate_url:
        notes.append(f"Wayback candidate generated from {candidate_basis}.")
    elif lookup_errors:
        notes.append("Wayback lookup failed for at least one request.")
    else:
        notes.append("No Wayback capture was returned by the availability API.")

    enriched["reference_post_date"] = reference_post_date
    enriched["wayback"] = {
        "status": wayback_status,
        "latest_capture": latest_capture,
        "closest_to_post_date": nearest_capture,
        "candidate_url": candidate_url,
        "candidate_basis": candidate_basis,
        "lookup_errors": lookup_errors,
    }
    enriched["archive_candidate_url"] = candidate_url
    enriched["notes"] = notes
    return enriched


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--decisions-input", type=Path, default=DEFAULT_DECISIONS_INPUT)
    parser.add_argument("--inventory-input", type=Path, default=DEFAULT_INVENTORY_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    parser.add_argument("--limit", type=int, default=None, help="Only enrich the first N decisions.")
    args = parser.parse_args()

    decisions_doc = load_json(args.decisions_input)
    inventory = load_json(args.inventory_input)
    post_date_map = build_occurrence_post_date_map(inventory)

    decisions = decisions_doc.get("decisions", [])
    if args.limit is not None:
        decisions = decisions[: args.limit]

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        enriched_decisions = list(
            executor.map(
                lambda decision: build_enriched_decision(
                    decision,
                    post_date_map,
                    timeout=args.timeout,
                    user_agent=args.user_agent,
                ),
                decisions,
            )
        )

    summary = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "decision_count": len(enriched_decisions),
        "candidate_generated": sum(1 for item in enriched_decisions if item["wayback"]["candidate_url"]),
        "no_capture_found": sum(1 for item in enriched_decisions if item["wayback"]["status"] == "no_capture_found"),
        "lookup_error": sum(1 for item in enriched_decisions if item["wayback"]["status"] == "lookup_error"),
    }

    output = {
        "source_decisions": str(args.decisions_input.resolve()),
        "source_inventory": str(args.inventory_input.resolve()),
        "summary": summary,
        "decisions": enriched_decisions,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(enriched_decisions)} Wayback-enriched decisions to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
