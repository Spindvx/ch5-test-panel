#!/usr/bin/env python3
"""
drive_deploy.py — pty driver for `ch5-cli deploy -p` to upload office-v3-ui.ch5z to the TS-1070.

`ch5-cli deploy -p` uses inquirer for interactive SFTP user/password prompts. Piping stdin fails
with `ERR_USE_AFTER_CLOSE: readline was closed`, so we give it a real PTY via Python's pty
module and answer the prompts as they appear.

Usage (from the repo root):
    npm run build:archive            # → dist/prod/office-v3-ui.ch5z
    python3 deploy/drive_deploy.py

Success signal in the deploy output (verbatim):
    Device output: Success. Restarting UI...

That's the panel firmware confirming the .ch5z was extracted and the UI subsystem restarted.
The REST API has no CH5-project introspection, so this string is the canonical confirmation.

Reference: DEPLOY.md (Method 1).
"""

import os
import pty
import re
import select
import sys
import time
from pathlib import Path

# -- Configuration ---------------------------------------------------------------------------

PANEL_HOST = "192.168.50.105"
SFTP_USER = b"admin"
SFTP_PASS = b"CNZav2114"
TARGET = "touchscreen"

REPO_ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = REPO_ROOT / "dist" / "prod" / "office-v3-ui.ch5z"

CMD = [
    "npx", "ch5-cli", "deploy", "-p",
    "-H", PANEL_HOST,
    "-t", TARGET,
    str(ARCHIVE.relative_to(REPO_ROOT)),  # ch5-cli expects path relative to cwd
]

DEADLINE_SECONDS = 240


def main() -> int:
    if not ARCHIVE.exists():
        print(f"ERROR: archive not found: {ARCHIVE}", file=sys.stderr)
        print("Run `npm run build:archive` first.", file=sys.stderr)
        return 2

    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(REPO_ROOT)
        os.execvp(CMD[0], CMD)

    buf = b""
    sent_user = sent_pass = False
    deadline = time.time() + DEADLINE_SECONDS
    strip_ansi = re.compile(rb"\x1b\[[0-9;?]*[A-Za-z]")
    saw_success = False

    try:
        while True:
            if time.time() > deadline:
                print("\n[drive_deploy] timeout, sending Ctrl-C to ch5-cli", file=sys.stderr)
                os.write(fd, b"\x03")
                break

            r, _, _ = select.select([fd], [], [], 1.0)
            if r:
                try:
                    chunk = os.read(fd, 4096)
                except OSError:
                    break
                if not chunk:
                    break

                buf += chunk
                clean = strip_ansi.sub(b"", buf)
                sys.stdout.buffer.write(chunk)
                sys.stdout.flush()

                if not sent_user and b"Enter SFTP user" in clean:
                    time.sleep(0.2)
                    os.write(fd, SFTP_USER + b"\r")
                    sent_user = True
                elif not sent_pass and sent_user and b"Enter SFTP password" in clean:
                    time.sleep(0.2)
                    os.write(fd, SFTP_PASS + b"\r")
                    sent_pass = True

                if b"Success. Restarting UI" in clean:
                    saw_success = True

            try:
                wpid, _ = os.waitpid(pid, os.WNOHANG)
                if wpid != 0:
                    break
            except ChildProcessError:
                break
    finally:
        try:
            os.close(fd)
        except OSError:
            pass

    print("\n[drive_deploy] " + ("✅ Success. Restarting UI confirmed." if saw_success else "⚠ Did not see 'Success. Restarting UI...' — check output above."))
    return 0 if saw_success else 1


if __name__ == "__main__":
    sys.exit(main())
