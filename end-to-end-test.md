# Phase 7: End-to-End Test Log

## Test: Deploy CH5 App to TS-1070

### Goal
Deploy `crestron-ref.ch5z` to TS-1070 at 192.168.50.105 and verify it loads.

### Steps

1. ✅ **Build artifact created**
   - File: `/home/node/.openclaw/workspace-crestron-dev/crestron/crestron-ref/dist/prod/crestron-ref.ch5z`
   - Size: 9.3MB
   - Format: .ch5z (ZIP archive)

2. ⚠️ **SFTP upload — BLOCKED**
   - SSH access to TS-1070: `admin` account is blocked
   - Error: "The user account (admin) is blocked"
   - Cause: Multiple failed password attempts via SSH (from earlier failed logins)
   - Status: Waiting for account to unblock (~15 min lockout)

3. ⏸️ **Activate on panel** — pending (blocked by step 2)
   - Would run: `cd /sdcard && tar -xzf crestron-ref.ch5z`

4. ⏸️ **Verify via browser** — pending
   - Navigate: `https://192.168.50.105/` to see if new app loads

### Deploy Script Test
```bash
./deploy-hardware.sh 192.168.50.105 admin CNZav2114 \
  /home/node/.openclaw/workspace-crestron-dev/crestron/crestron-ref/dist/prod/crestron-ref.ch5z touchscreen
```
**Status:** Cannot execute — SSH blocked

### Workaround Used
Since SSH/SFTP is blocked, tested alternative HTTP-based verification:
- TS-1070 `/logs` endpoint accessible ✅ (HTTP 301 redirect)
- TS-1070 `/programload` endpoint returns auth challenge ✅
- CP3 at .113 requires Basic Auth ✅

### Mitigation for Next Attempt
1. Wait for TS-1070 admin account to unblock (~15 min)
2. Or use Zima PC as jump host to avoid triggering block
3. Or add SSH key to TS-1070 authorized_keys for key-based auth

### Result
**INCOMPLETE** — SSH blocked. Will retry in next session.

---

## CIP Communication Test

### Goal
Verify cip-probe.js can communicate with CP3 at 192.168.50.113:41794

### Previous Status (from session notes)
- TCP handshake works ✅
- Registration with IPID 0x0C: CP3 sends reg-request but doesn't complete registration ❌
- IPID 0x0C may already be claimed by another client

### Next Test (pending)
```bash
node cip-probe.js subscribe 14 serial   # Subscribe to SSID heartbeat
node cip-probe.js set 101 digital 1     # Set power LED join 101
```

### Result
**INCOMPLETE** — Need to resolve CIP registration issue. IPID conflict suspected.