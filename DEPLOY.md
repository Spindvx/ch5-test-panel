# Deploying CH5 to the TS-1070 Panel

Operational reference for getting `office-v3-ui.ch5z` onto the TS-1070 touch panel.
Written for an agent with zero prior context — read top-to-bottom, then act.

---

## Panel Facts

| Field | Value |
|---|---|
| Model | Crestron TS-1070 (1280x800) |
| IP | `192.168.50.105` |
| Hostname | `TS-1070-C442680F1403.crestron` |
| Username | `admin` |
| Password | `CNZav2114` |
| Firmware (last seen) | `3.002.0043` (build Mon Sep 22 15:04:26 EDT 2025 / 581636) |
| MAC | `c4:42:68:0f:14:03` |
| Serial | `2151JBH00472` |
| HTTP port | 80 (redirects → 443) |
| HTTPS port | 443 (self-signed cert; use `curl -k`) |
| SSH/SFTP port | 22 (admin/CNZav2114, used by `ch5-cli deploy`) |
| Console (CTP) | 41795 (text-protocol, alternative path) |

**Cert CN** is `TS-1070-C442680F1403.crestron`. Self-signed by Crestron; always pass `-k` to curl.

---

## The CH5 Project

| Item | Path |
|---|---|
| Source | `app/`, `config/`, `webpack.*.js` |
| Build output | `dist/prod/office-v3-ui.ch5z` |
| Build command | `npm run build:archive` |
| Deploy command (npm) | `npm run build:deploy` (no password — needs SSH key) |
| Deploy command (pwd) | `npm run build:deploywithpassword` |
| One-step | `npm run build:onestepwithpassword` |
| Panel-side landing path | `display/office-v3-ui.ch5z` (relative to SFTP root) |
| Panel-side install path | `/data/web/tmp/projectload/html5/` |

The `.ch5z` is just a renamed zip with the compiled HTML/JS/CSS plus a Crestron manifest. The panel's webserver does **not** serve the CH5 project over HTTP/443 — it runs locally on the panel display only.

---

## Deploy Methods

### Method 1: `ch5-cli deploy` driven via pty (CONFIRMED WORKING)

`ch5-cli deploy -p` uses [`inquirer`](https://github.com/SBoudrias/Inquirer.js) for interactive prompts. **Piping stdin (`printf "user\npass\n" | ch5-cli ...`) fails** with:

```
Error [ERR_USE_AFTER_CLOSE]: readline was closed
```

You must give it a real PTY. There is no `sshpass` or `expect` on this host, so use a Python `pty` driver. Save this as `/tmp/panel/drive_deploy.py`:

```python
#!/usr/bin/env python3
import os, pty, select, sys, time, re

CMD = ["npx", "ch5-cli", "deploy", "-p",
       "-H", "192.168.50.105",
       "-t", "touchscreen",
       "dist/prod/office-v3-ui.ch5z"]
USER = b"admin"
PASS = b"CNZav2114"

pid, fd = pty.fork()
if pid == 0:
    os.chdir("/home/node/.openclaw/workspace-crestron-dev/crestron/office-v3-ui")
    os.execvp(CMD[0], CMD)

buf = b""
sent_user = sent_pass = False
deadline = time.time() + 240
strip_ansi = re.compile(rb"\x1b\[[0-9;?]*[A-Za-z]")
while True:
    if time.time() > deadline:
        os.write(fd, b"\x03"); break
    r,_,_ = select.select([fd], [], [], 1.0)
    if r:
        try: chunk = os.read(fd, 4096)
        except OSError: break
        if not chunk: break
        buf += chunk
        clean = strip_ansi.sub(b"", buf)
        sys.stdout.buffer.write(chunk); sys.stdout.flush()
        if not sent_user and b"Enter SFTP user" in clean:
            time.sleep(0.2); os.write(fd, USER + b"\r"); sent_user=True
        elif not sent_pass and sent_user and b"Enter SFTP password" in clean:
            time.sleep(0.2); os.write(fd, PASS + b"\r"); sent_pass=True
    try:
        wpid, status = os.waitpid(pid, os.WNOHANG)
        if wpid != 0: break
    except ChildProcessError: break
```

Run with:

```bash
python3 /tmp/panel/drive_deploy.py
```

Expected success output (verbatim ending):

```
Connected to device. Uploading archive file.
Trying to upload file to display/office-v3-ui.ch5z.
Uploaded file.
Closing sftp connection.
Sending reload command to touchscreen device:projectload
Connected via ssh to device
Device output:
Device output: Success. Restarting UI...
Device output:
TS-1070>
Connection closed.
Connection has ended. Success executing command.
```

The `Success. Restarting UI...` line is the panel firmware itself confirming the project was extracted and the UI subsystem restarted. **This is the authoritative success signal.**

### Method 2: SSH key-based (no prompts)

If a key is registered with the panel (`/Device/Authentication/...` has `IdentityFile` support), `npm run build:deploy` works without pty drama:

```bash
npx ch5-cli deploy -H 192.168.50.105 -t touchscreen \
  -u admin -i ~/.ssh/id_ed25519 \
  dist/prod/office-v3-ui.ch5z
```

Key is registered via the panel's web UI (Authentication → SSH Keys) or via the auth-management REST endpoints. Worth the one-time setup if doing repeated deploys.

### Method 3: Manual SFTP + console reload (fallback)

If `ch5-cli` itself is broken/unavailable:

```bash
# Upload (SFTP non-interactive needs sshpass — install if missing)
sshpass -p 'CNZav2114' sftp -oStrictHostKeyChecking=no \
  admin@192.168.50.105 <<'EOF'
cd display
put dist/prod/office-v3-ui.ch5z
EOF

# Reload via SSH console
sshpass -p 'CNZav2114' ssh -oStrictHostKeyChecking=no admin@192.168.50.105 \
  'projectload'
```

The `projectload` console command is what `ch5-cli deploy` issues internally after upload.

### Method 4: Browser via panel web UI

The panel's web UI at `https://192.168.50.105/` has a project upload form (login → "Application" / "Manage Projects"). Manual, slow, but works as last resort.

---

## REST API Access

Useful for diagnostics — **not** for deploying (the API doesn't expose CH5 project upload).

### Authentication

The login endpoint is **picky about Origin and Referer**. Without them you get `HTTP 403`.

```bash
mkdir -p /tmp/panel
curl -sk -c /tmp/panel/cookies.txt \
  -X POST "https://192.168.50.105/userlogin.html" \
  -H "Origin: https://192.168.50.105" \
  -H "Referer: https://192.168.50.105/userlogin.html" \
  --data-urlencode "login=admin" \
  --data-urlencode "passwd=CNZav2114" \
  -D /tmp/panel/login_headers.txt -o /dev/null
```

Successful login returns:
- `Set-Cookie: AuthByPasswd=crypt:...` (the auth cookie)
- `Set-Cookie: userid=...`, `userstr=...`, `iv=...`, `tag=...`
- `CREST-XSRF-TOKEN: <urlencoded-token>` header — **required** on all subsequent requests

Extract the XSRF token:

```bash
XSRF=$(grep -i "CREST-XSRF-TOKEN:" /tmp/panel/login_headers.txt \
  | sed 's/CREST-XSRF-TOKEN: //I' | tr -d '\r\n')
```

Then call any `/Device/...` endpoint:

```bash
curl -sk -b /tmp/panel/cookies.txt \
  -H "CREST-XSRF-TOKEN: $XSRF" \
  "https://192.168.50.105/Device/DeviceInfo" | python3 -m json.tool
```

### Useful Endpoints

| Path | Purpose |
|---|---|
| `/Device/DeviceInfo` | Model, firmware, MAC, serial, **RebootReason** |
| `/Device` | Full device tree (~92 KB) — search this when looking for unknown keys |
| `/Device/Display` | LCD state, brightness, beep, virtual buttons, ProjectDisplay |
| `/Device/UiUserProject` | SmartGraphics `.vtz` project info (**NOT** CH5 — see gotcha below) |
| `/Device/FilePaths/Project` | Where firmware looks for project files on local FS |
| `/Device/SchedulingPanel/...` | Scheduling-panel mode config (Fusion/Exchange/Google) |
| `/Device/SystemClock` | NTP sync status |
| `/Device/Ethernet/Adapters` | Network state |

### Endpoints That Don't Exist (will return `UNSUPPORTED PROPERTY`)

```
/Device/Html5UserProject     /Device/HTML5UserProject
/Device/Ch5UserProject       /Device/CH5UserProject
/Device/UserProject          /Device/Programs
/Device/Applications         /Device/AppMode
/Device/SystemMode           /Device/UserInterface
/Device/Project              /Device/WebProject
```

The REST API has **no CH5-project introspection endpoint**. If you need to know which CH5 project is loaded, you must look at the panel screen (or pull the panel's error log via SSH `err` command).

---

## Pre-Flight Checklist

Before deploying:

```bash
# 1. Panel reachable?
curl -sk --max-time 5 https://192.168.50.105/ -o /dev/null -w "%{http_code}\n"
# Want: 200 (panel served login page)

# 2. Build exists?
ls -la dist/prod/office-v3-ui.ch5z
# Want: ~9 MB file. If missing: npm run build:archive

# 3. Build is fresh?
stat -c '%Y %n' dist/prod/office-v3-ui.ch5z
git log -1 --format='%ct %s'
# If git commit newer than .ch5z mtime: npm run build:archive
```

---

## Verifying Whether It's Actually a Boot Loop

Users say "boot loop" when they see anything from a real reboot cycle to a stuck spinner. **Always verify before assuming.**

```bash
XSRF=$(grep -i "CREST-XSRF-TOKEN:" /tmp/panel/login_headers.txt | sed 's/CREST-XSRF-TOKEN: //I' | tr -d '\r\n')
for i in 1 2 3 4 5 6 7; do
  curl -sk -b /tmp/panel/cookies.txt -H "CREST-XSRF-TOKEN: $XSRF" --max-time 5 \
    "https://192.168.50.105/Device/DeviceInfo" -D /tmp/panel/h.txt -o /dev/null \
    -w "[%d] HTTP=%{http_code} " $i
  grep -i "^Date:" /tmp/panel/h.txt | tr -d '\r'
  sleep 5
done
```

**Reading the result:**

| Symptom | Diagnosis |
|---|---|
| `Date:` increases monotonically by ~5s/poll | Panel uptime is climbing — **NOT rebooting**. Look for: no project loaded, OOTB spinner, scheduling panel waiting, project init crash |
| `Date:` resets to `Jan 1 1970 00:00:xx` periodically | Real reboot loop — firmware crash, hardware, or a project crashing the panel |
| HTTP code drops to 0/timeout intermittently | Network or firmware issue — verify with ping (NB: container has no `ping`, use curl) |
| Auth cookie keeps getting invalidated | Webserver subsystem restarting — likely real reboot or aggressive UI restart |

**Pre-NTP-sync gotcha:** Until the panel syncs an NTP server it reports `Date: Jan 1 1970` always. That alone does **not** mean it just rebooted — check whether the date is *increasing* between polls.

---

## Common Failure Modes

### "It's a boot loop!" but actually no project is loaded

**Symptom:** Panel shows spinning circle / "Connecting..." / Crestron OOTB welcome screen on a loop.

**Check:** `/Device/UiUserProject.ProjectName` empty (it tracks SmartGraphics .vtz, but if the panel was provisioned for that and isn't getting one, it loops on OOTB). Also `SchedulingPanel.Monitoring.Scheduling.ConnectionStatus = 'Disconnected'` + Fusion `Waiting For Registration` produce the same visual symptom.

**Fix:** Deploy a CH5 project. The CH5 project takes precedence over OOTB.

### `HTTP 403` on `POST /userlogin.html`

**Cause:** Missing `Origin` and/or `Referer` header. Crestron firmware enforces same-origin on the login form.

**Fix:** Always include both headers (see auth example above).

### `HTTP 403` after several auth attempts

**Cause:** Lockout. The panel rate-limits failed auth (default ~5 attempts per minute → temporary block).

**Fix:** Wait ~5 minutes. If you have a valid session, reuse the existing cookies — don't re-auth on every request.

### `Error [ERR_USE_AFTER_CLOSE]: readline was closed`

**Cause:** You piped stdin to `ch5-cli deploy -p`. Inquirer needs a TTY.

**Fix:** Use the Python pty driver (Method 1 above).

### `ch5-cli` reports success but panel screen unchanged

**Diagnostic chain:**
1. Was `Success. Restarting UI...` in the deploy output? If no, the panel rejected the project — corrupted .ch5z or version mismatch.
2. Try rebuild: `npm run clean && npm run build:archive`.
3. Pull panel error log via SSH `err` command (see below).
4. Try `slow-mode` upload: add `-s` to `ch5-cli deploy` (resolves sporadic SFTP "Permission denied" on busy panel).

### SFTP `Permission denied` mid-upload

**Fix:** Re-run with `-s` (slow mode) flag to `ch5-cli deploy`.

### `UiUserProject.ProjectName` is empty after deploy

**Not actually a problem.** That endpoint tracks SmartGraphics (`.vtz`) projects, not CH5. The CH5 project state has no REST endpoint. The deploy tool's `Success. Restarting UI...` is the canonical success signal.

### Panel clock stuck at 1970

**Cause:** `Device/SystemClock/SyncStatus = NotInitiated`. NTP can't reach a server.

**Impact:** Visual annoyance + breaks any time-sensitive UI logic + invalidates HTTPS certs that check time. **Does NOT cause a boot loop.**

**Fix:** Check `/Device/SystemClock/Ntp/Servers` and confirm panel can reach `pool.ntp.org` (or whatever's configured). Network-level issue, not deploy-level.

---

## Pulling Diagnostic Logs

Log file upload is supported (`/Device/DeviceCapabilities/IsLogFileUploadSupported = true`).

Via SSH console (after `ssh admin@192.168.50.105`):

```
err            # Show recent errors
errlog         # Full error log
ver            # Firmware version
projectinfo    # Currently-loaded project metadata
ipconfig       # Network state
reboot         # Reboot panel (USE WITH CARE)
```

Via REST: there's no documented log-pull endpoint, but `/Device/Logging/...` exposes log levels.

---

## What "Just Worked" on 2026-04-28

For reference — the procedure that successfully resolved the user-reported boot loop:

1. Auth via REST → confirmed panel firmware healthy (uptime climbing, not rebooting).
2. Found `UiUserProject.ProjectName = ""` → no project loaded → spinner was OOTB UI.
3. Used `dist/prod/office-v3-ui.ch5z` (already built, 9.4 MB, dated Apr 28 06:01).
4. Ran Method 1 (Python pty driver) → got `Success. Restarting UI...`.
5. Visual confirmation needed from user — REST can't verify CH5 project name.

Total time from cold start to deployed: ~5 minutes including diagnosis.

---

## Don't-Do List

- Don't run `reboot` via SSH unless the user explicitly asks. Panels in some installs power-cycle other AV gear on boot, and a TS-1070 reboot takes 60-90s.
- Don't change `/Device/Authentication/AuthenticationState/IsEnabled` — locking yourself out requires physical access to the panel to recover.
- Don't deploy without a fresh `npm run build:archive` if any source files changed since the last `.ch5z` mtime.
- Don't assume "no Date in REST response" = rebooting. The webserver runs even during UI restarts; only a full firmware reboot drops it.
- Don't store the `admin` password anywhere outside this repo + `~/.openclaw/` config. The panel is on a LAN segment and isn't internet-exposed.
