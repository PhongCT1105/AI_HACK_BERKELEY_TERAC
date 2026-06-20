#!/usr/bin/env python3
"""Prepare blind Fin-Fact-derived Captain America tasks for Terac."""
from __future__ import annotations
import argparse, csv, json, re, urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data"
TASK = "An AI financial research agent is deciding whether it can cite this claim/source. Judge whether the claim is trustworthy enough to use."
QUESTIONS = {
  "human_verdict": ["supported", "questionable", "unsupported", "insufficient_info"],
  "would_ai_cite": ["yes", "no", "caution"],
  "risk_tags": ["unsupported_financial_claim", "weak_or_missing_evidence", "no_clear_author", "promotional_language", "price_prediction", "conflict_of_interest", "outdated_information", "unclear_source", "looks_reliable", "other"],
  "reason": "one sentence",
}
ALIASES = {
  "claim": ["claim", "statement", "text", "post_text", "content"],
  "author": ["author", "user", "username", "account"],
  "posted_date": ["posted_date", "posted date", "date", "created_at", "timestamp"],
  "source": ["source", "platform", "publisher", "domain", "website"],
  "evidence_text": ["evidence_text", "evidence", "article_text", "context", "sci-digest"],
  "evidence_url": ["evidence_url", "evidence href", "url", "article_url", "source_url", "link"],
  "image_url": ["image_url", "image href", "image", "image_link", "media_url"],
  "id": ["id", "claim_id", "post_id", "uuid"],
}
FINANCE_KEYWORDS = re.compile(
  r"\b(stock|share|market|invest|fund|earnings|revenue|dividend|crypto|bitcoin|bond|interest rate|"
  r"inflation|economy|economic|price|trading|trader|nasdaq|dow|s&p|ipo|profit|loss|debt|loan|tax|"
  r"bank|fiscal|gdp|currency|asset|portfolio|valuation|merger|acquisition)\b",
  re.IGNORECASE,
)
def is_finance_related(claim, row):
  # Fin-Fact is a general fact-checking dataset (Snopes-derived), not finance-only.
  # Match on the claim/topic itself rather than evidence text — long fact-check
  # articles often mention money in passing, which produced false positives
  # (e.g. an unrelated claim whose linked article happened to say "fund").
  topic = as_text(row.get("category") or row.get("topic") or row.get("domain"))
  return bool(FINANCE_KEYWORDS.search(claim)) or bool(FINANCE_KEYWORDS.search(topic))
def clean_evidence_text(evidence):
  """Build readable evidence: extract sentence fields from JSON, strip href arrays, cap at 1200 chars."""
  if not evidence: return ""
  parsed = None
  try:
    parsed = json.loads(evidence)
  except (json.JSONDecodeError, TypeError):
    pass
  if isinstance(parsed, list):
    sentences = [as_text(item.get("sentence")).strip() for item in parsed if isinstance(item, dict) and as_text(item.get("sentence")).strip()]
    text = "\n".join("• " + s for s in sentences[:5])
  else:
    text = re.sub(r'"href"\s*:\s*\[[^\]]*\]\s*,?', "", str(evidence))
    text = re.sub(r"[ \t]+", " ", text).strip()
  return text[:1200]
def as_text(v):
  if v is None: return ""
  return json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else str(v).strip()
def find(row, fields):
  lower = {str(k).lower(): v for k, v in row.items()}
  for field in fields:
    if as_text(lower.get(field)): return as_text(lower[field])
  return ""
def read_local(path):
  path = Path(path)
  if path.suffix.lower() == ".jsonl":
    return [json.loads(x) for x in path.read_text().splitlines() if x.strip()]
  if path.suffix.lower() == ".json":
    payload = json.loads(path.read_text())
    if isinstance(payload, list): return payload
    return next(v for v in payload.values() if isinstance(v, list))
  with path.open(encoding="utf-8", newline="") as f: return list(csv.DictReader(f))
def read_remote():
  # The datasets-server API caps `length` at 100 rows per request, so page through
  # the whole dataset. Fin-Fact is a general fact-checking set (not finance-only),
  # so we need the full set to find enough finance-related rows.
  page_size = 100
  base = "https://datasets-server.huggingface.co/rows?dataset=amanrangapur%2FFin-Fact&config=default&split=train"
  rows, offset, total = [], 0, None
  while total is None or offset < total:
    endpoint = base + "&offset=" + str(offset) + "&length=" + str(page_size)
    req = urllib.request.Request(endpoint, headers={"User-Agent": "CaptainAmerica/1.0"})
    with urllib.request.urlopen(req, timeout=45) as resp: payload = json.load(resp)
    page_rows = [x.get("row", x) for x in payload.get("rows", []) if isinstance(x, dict)]
    if not page_rows: break
    rows.extend(page_rows)
    total = payload.get("num_rows_total", offset + len(page_rows))
    offset += page_size
  return rows
def hidden(row, terms):
  return " | ".join(str(k) + "=" + as_text(v) for k, v in row.items() if any(term in str(k).lower() for term in terms) and as_text(v))
def dump_jsonl(path, rows):
  with path.open("w", encoding="utf-8") as f:
    for row in rows: f.write(json.dumps(row, ensure_ascii=False) + "\n")
def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--limit", type=int, default=200)
  parser.add_argument("--input", help="Official Fin-Fact CSV, JSON, or JSONL already downloaded locally")
  args = parser.parse_args()
  if args.limit < 1: parser.error("--limit must be positive")
  try:
    raw, origin = (read_local(args.input), "local:" + args.input) if args.input else (read_remote(), "huggingface:amanrangapur/Fin-Fact")
  except Exception as error:
    raise SystemExit("Unable to load Fin-Fact. Pass --input after downloading the official dataset. " + str(error))
  tasks, private, seen, skipped = [], [], set(), Counter()
  for index, row in enumerate(raw):
    if not isinstance(row, dict): skipped["not_object"] += 1; continue
    claim = find(row, ALIASES["claim"])
    key = re.sub(r"[^a-z0-9]+", " ", claim.lower()).strip()
    if len(claim) < 12: skipped["empty_or_short_claim"] += 1; continue
    if key in seen: skipped["near_duplicate_claim"] += 1; continue
    if not is_finance_related(claim, row): skipped["not_finance_related"] += 1; continue
    seen.add(key)
    author, date, source = find(row, ALIASES["author"]), find(row, ALIASES["posted_date"]), find(row, ALIASES["source"])
    evidence, evidence_url, image_url = find(row, ALIASES["evidence_text"]), find(row, ALIASES["evidence_url"]), find(row, ALIASES["image_url"])
    evidence_text_clean = clean_evidence_text(evidence)
    task_id = "finfact_" + str(len(tasks) + 1).zfill(6)
    context = "Visible evidence excerpt: " + re.sub(r"\s+", " ", evidence)[:420] if evidence else "No evidence text was provided with this record."
    capsule = "Claim submitted for review: " + claim + " " + context
    tasks.append({"task_id": task_id, "task_type": "financial_claim_credibility", "research_task": TASK, "claim": claim, "author": author, "posted_date": date, "source": source, "evidence_text": evidence, "evidence_text_clean": evidence_text_clean, "evidence_url": evidence_url, "image_url": image_url, "capsule": capsule, "annotation_questions": QUESTIONS})
    private.append({"task_id": task_id, "original_dataset_id": find(row, ALIASES["id"]) or str(index), "hidden_original_label": hidden(row, ["label", "verdict", "classification", "gold"]), "hidden_original_justification": hidden(row, ["justification", "explanation", "fact_check"]), "hidden_original_issue": hidden(row, ["issue", "visualisation bias", "visual_bias"]), "source_file": "Fin-Fact"})
    if len(tasks) >= args.limit: break
  OUT.mkdir(exist_ok=True)
  dump_jsonl(OUT / "captain_america_terac_tasks.jsonl", tasks)
  columns = list(tasks[0]) if tasks else ["task_id", "task_type", "research_task", "claim", "author", "posted_date", "source", "evidence_text", "evidence_text_clean", "evidence_url", "image_url", "capsule", "annotation_questions"]
  with (OUT / "captain_america_terac_tasks.csv").open("w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=columns); writer.writeheader()
    writer.writerows([{**x, "annotation_questions": json.dumps(x["annotation_questions"])} for x in tasks])
  with (OUT / "hidden_original_labels.csv").open("w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(private[0]) if private else ["task_id", "original_dataset_id", "hidden_original_label", "hidden_original_justification", "hidden_original_issue", "source_file"]); writer.writeheader(); writer.writerows(private)
  (OUT / "README.md").write_text("Captain America Terac data. Public tasks are ready to annotate. hidden_original_labels.csv is admin-only: never seed it, expose it, or train on it for the Terac prize.\n", encoding="utf-8")
  print(json.dumps({"dataset": origin, "total_raw_rows": len(raw), "valid_rows": len(tasks) + sum(skipped.values()), "skipped_rows": sum(skipped.values()), "output_rows": len(tasks), "rows_with_evidence_urls": sum(bool(x["evidence_url"]) for x in tasks), "rows_with_image_urls": sum(bool(x["image_url"]) for x in tasks), "skip_reasons": dict(skipped)}, indent=2))
if __name__ == "__main__": main()
