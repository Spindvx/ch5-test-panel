# Deploy

## Default path — VS Code terminal (or any real TTY)

```bash
npm run build:onestepwithpassword
```

That's it. Builds `dist/prod/office-v3-ui.ch5z` and runs `ch5-cli deploy -p` against the TS-1070 at `192.168.50.105`. The `inquirer` prompts (SFTP user / password) work natively in any real TTY.

If you want the steps separately:

```bash
npm run build:archive          # → dist/prod/office-v3-ui.ch5z
npm run build:deploywithpassword
```

## Fallback path — headless / CI / non-TTY

If you're piping the deploy command through stdin / running from a CI script / running under any environment that isn't a real TTY, `ch5-cli`'s inquirer breaks with:

```
Error [ERR_USE_AFTER_CLOSE]: readline was closed
```

For that case use the pty driver:

```bash
npm run build:archive
python3 deploy/drive_deploy.py
```

It opens a real PTY via `pty.fork()`, watches for the SFTP prompts, and answers them. Defaults match the npm script (panel `192.168.50.105`, `admin` / `CNZav2114`, target `touchscreen`); override by editing constants at the top of the file.

## Success signal

Both paths look for the panel firmware printing:

```
Device output: Success. Restarting UI...
```

That's the canonical confirmation that the `.ch5z` was extracted on-panel and the UI subsystem restarted. The REST API has no CH5-project introspection, so this string is what proves the deploy landed.

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

## Other methods

See `DEPLOY.md` at the repo root for SSH-key auth, manual SFTP+console reload, and the panel web UI upload (Methods 2–4). Useful when SSH/SFTP itself is wonky on the panel.
