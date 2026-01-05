import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--event", required=True)
    parser.add_argument("--data", default="{}")
    parser.add_argument("--type", default="event")
    parser.add_argument("--timestamp", default="")
    parser.add_argument("--set-status", default="")
    args = parser.parse_args()

    run_dir = Path(args.run_dir)
    state_path = run_dir / "state.json"
    journal_path = run_dir / "journal.jsonl"

    state = json.loads(state_path.read_text(encoding="utf-8"))
    event_id = str(state.get("nextEventId", 1))

    timestamp = args.timestamp.strip() or _now_iso()
    try:
        data_obj = json.loads(args.data)
    except json.JSONDecodeError:
        data_obj = {"raw": args.data}

    entry = {
        "timestamp": timestamp,
        "type": args.type,
        "id": event_id,
        "event": args.event,
        "data": data_obj,
    }

    journal_path.parent.mkdir(parents=True, exist_ok=True)
    with journal_path.open("a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    state["nextEventId"] = int(event_id) + 1
    if args.set_status:
        state["status"] = args.set_status
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

