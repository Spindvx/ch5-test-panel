# Deploy

## Build & deploy in two steps

```bash
# 1. Produce the archive
npm run build:archive
#    → dist/prod/office-v3-ui.ch5z (~9 MB)

# 2. Push it to the panel
python3 deploy/drive_deploy.py
```

The pty driver wraps `ch5-cli deploy -p` and answers its inquirer prompts (`Enter SFTP user`, `Enter SFTP password`) as they appear. Piping stdin to `ch5-cli` fails with `ERR_USE_AFTER_CLOSE: readline was closed`; the pty form is the proven-working method.

## Success signal

The driver looks for the panel firmware printing:

```
Device output: Success. Restarting UI...
```

That's the canonical confirmation that the `.ch5z` was extracted on-panel and the UI subsystem restarted. The REST API has no CH5-project introspection endpoint, so this string is what proves the deploy landed.

## Configuration

Defaults are baked in (TS-1070 at `192.168.50.105`, `admin` / `CNZav2114`, target `touchscreen`). To override, edit the constants at the top of `drive_deploy.py`.

## Alternative methods

See `DEPLOY.md` at the repo root for the full reference (Method 2 = SSH key, Method 3 = manual SFTP+console, Method 4 = browser upload). Use Method 1 (this driver) by default.

## Pre-flight checklist

```bash
# Panel reachable?
curl -sk --max-time 5 https://192.168.50.105/ -o /dev/null -w "%{http_code}\n"
# Want: 200

# Build is fresh?
stat -c '%Y %n' dist/prod/office-v3-ui.ch5z
git log -1 --format='%ct %s'
# If git commit newer than .ch5z mtime: rebuild
```

If the panel returns `403` after a few requests, you've tripped the auth lockout — wait ~5 min before retrying.
