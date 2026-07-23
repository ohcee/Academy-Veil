#!/usr/bin/env python3
"""
check_content.py — validates lessons.js against the answer key.

Because the quiz lives in lessons.js and the answers live in answers.json on the
server, the two can drift. A drifted lesson fails in an unhelpful way: every
submission is rejected as malformed, or worse, scored against the wrong key.

Run this after editing either file:

    python3 check_content.py

Exits non-zero on any problem, so it can be wired into CI (the answer key is not
in the repo, so CI can only run the structural checks — pass --no-answers).
"""

import argparse
import json
import subprocess
import sys

VALID_OPTIONS = {"a", "b", "c", "d"}


def load_lessons(path="lessons.js"):
    """
    Load LESSONS by having node evaluate the real file and print it as JSON.

    Parsing JS object literals with regular expressions does not survive inline
    objects like `options: { a: "…", b: "…" }`, and this file is the source of
    truth for the whole site — it is worth using an actual JS engine.
    """
    # Evaluated as one unit so `const LESSONS` is in scope for the dump. A plain
    # require() would scope it to that module and leave LESSONS undefined here.
    script = (
        f"eval(require('fs').readFileSync({path!r}, 'utf8')"
        f" + ';console.log(JSON.stringify(LESSONS))')"
    )
    try:
        out = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, check=True, cwd=".",
        )
    except FileNotFoundError:
        raise SystemExit("node is required to run this check (it parses lessons.js)")
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"lessons.js failed to parse:\n{exc.stderr.strip()}")

    return json.loads(out.stdout)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--answers", default="answers.json")
    ap.add_argument("--no-answers", action="store_true",
                    help="skip answer-key checks (for CI, where the key is absent)")
    args = ap.parse_args()

    problems = []
    lessons = load_lessons()

    ids = [l["id"] for l in lessons]
    if sorted(ids) != list(range(1, len(ids) + 1)):
        problems.append(f"lesson ids must be a gapless 1..N sequence, got {sorted(ids)}")

    for lesson in lessons:
        lid = lesson["id"]

        if "answer" in json.dumps(lesson):
            problems.append(
                f"lesson {lid}: an 'answer' field is present in lessons.js. "
                "This file ships to the browser — answers must live only in answers.json."
            )

        if not lesson.get("quiz"):
            problems.append(f"lesson {lid}: no quiz")
            continue

        for qi, q in enumerate(lesson["quiz"]):
            if not q.get("prompt"):
                problems.append(f"lesson {lid} q{qi + 1}: missing prompt")
            opts = q.get("options", {})
            if len(opts) < 2:
                problems.append(f"lesson {lid} q{qi + 1}: needs at least 2 options")
            for k in opts:
                if k not in VALID_OPTIONS:
                    problems.append(f"lesson {lid} q{qi + 1}: bad option key {k!r}")

    if not args.no_answers:
        try:
            with open(args.answers, encoding="utf-8") as fh:
                key = {k: v for k, v in json.load(fh).items() if not k.startswith("_")}
        except FileNotFoundError:
            print(f"answer key not found at {args.answers} "
                  f"(use --no-answers to skip these checks)", file=sys.stderr)
            return 1

        for lesson in lessons:
            lid = str(lesson["id"])
            n = len(lesson.get("quiz", []))

            if lid not in key:
                problems.append(f"lesson {lid}: no entry in {args.answers}")
                continue

            if len(key[lid]) != n:
                problems.append(
                    f"lesson {lid}: {n} questions but {len(key[lid])} answers in the key"
                )
                continue

            for qi, (ans, q) in enumerate(zip(key[lid], lesson["quiz"])):
                if ans not in q.get("options", {}):
                    problems.append(
                        f"lesson {lid} q{qi + 1}: key says {ans!r} "
                        f"but options are {sorted(q.get('options', {}))}"
                    )

        for lid in key:
            if lid not in [str(l["id"]) for l in lessons]:
                problems.append(f"{args.answers} has lesson {lid}, which is not in lessons.js")

    if problems:
        print(f"✗ {len(problems)} problem(s):\n", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1

    total_q = sum(len(l["quiz"]) for l in lessons)
    total_xp = sum(l["xp"] for l in lessons)
    print(f"✓ {len(lessons)} lessons, {total_q} questions, {total_xp} XP — all consistent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
