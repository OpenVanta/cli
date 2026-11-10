# Loom script: `vanta login --browser` against staging (scenes A–H)

A copy-paste script for recording the would-be production CLI from
[#45](https://github.com/OpenVanta/cli/pull/45) against staging. Every block is
one paste. Under each block: **Say** is a line to narrate, and **Expect** is
what should appear on screen. The A–H sequence was run end to end against a
local mock server with the built binary. The staging-specific results
(consent page, roles, revoke) are what this recording checks.

Takes about 8 minutes on camera. Run it in a normal macOS terminal (Terminal or
iTerm), not inside Claude Code or another agent. Those switch the CLI's output
to a compact agent format.

---

## Prep (off camera)

### 1. Browser

In your **default** browser, sign in to `https://app.staging.vanta.com` as the
test user, with the `rest_user_oauth_enabled` workspace active. Close other tabs.
Use an **editor** role, so the create in scene C works.

### 2. Terminal

Open a fresh terminal in your `OpenVanta/cli` clone, make the font large
(⌘+ a few times), and paste:

```bash
git fetch origin && git checkout nikhilbh2/cli-browser-login-staging-test && git pull
pnpm install && pnpm generate && pnpm test && pnpm build:binaries
```

Expect `101 passing` with no Keychain prompt.

### 3. Helpers

Paste the helpers. They exist only in this terminal; if you open a new one,
paste them again.

```bash
API=https://api.staging.vanta.com/v1
WEB=https://app.staging.vanta.com
alias vdev="$PWD/dist/binaries/vanta-darwin-$( [ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64 )"
CLIENT_ID=$(grep -o 'vci_[0-9a-f]\{48\}' src/user-login.ts)
kc() { security find-generic-password -s com.vanta.cli -a oauth -w | sed 's/^go-keyring-base64://' | base64 -d; }
kcset() { local new; new=$(kc | jq -c "$1" | base64); security add-generic-password -U -s com.vanta.cli -a oauth -w "go-keyring-base64:$new" -T /usr/bin/security; }
expire() { kcset '.cached_token_expires="2020-01-01T00:00:00Z"'; }
poison() { kcset '.cached_access_token="not-a-real-token" | .cached_token_expires="2099-01-01T00:00:00Z"'; }
kcsummary() { kc | jq '{auth_mode, api_base, web_base, oauth_client_id, secret_empty: ((.oauth_client_secret // "") == ""), has_refresh_token: ((.oauth_refresh_token // "") != ""), cached_token_expires}'; }
rtfp() { kc | jq -r '.oauth_refresh_token // ""' | shasum | cut -c1-8; }
tryrefresh() { curl -s https://api.staging.vanta.com/oauth/token -d grant_type=refresh_token -d client_id="$CLIENT_ID" -d refresh_token="$1" | jq -c 'if .access_token then "STILL VALID: got new tokens" else . end'; }
scene() { clear; printf '\n\033[1m%s\033[0m\n\n' "$*"; }
```

### 4. Back up your login and start signed out

```bash
security find-generic-password -s com.vanta.cli -a oauth -w > ~/vanta-keychain-backup.txt 2>/dev/null
cp ~/.vanta/config.json ~/vanta-config-backup.json 2>/dev/null
vdev logout
```

### 5. Rehearse (recommended)

Run scenes B and C once, then do step 4's `vdev logout` again. This clears any
first-time macOS Keychain prompt (click **Allow**, never "Reset To Defaults")
and makes sure the consent page works before you record. Then `clear`.

---

## Start recording

### Intro

**Say:** "This is the CLI from PR #45. Browser sign-in is opt-in behind
`vanta login --browser` while the server gate rolls out. I'm pointing it at
staging with `--api-base` and `--web-base`, the same way a user on another
region would."

### Scene A. Plain `vanta login` is unchanged

```bash
scene "A. Opt-in: plain vanta login is unchanged"
vdev login --help
```

**Expect:** `--browser … (beta)` and `--no-open` in the options.

```bash
vdev login --api-base "$API"
```

Press **Enter** at "API base URL". When "OAuth client ID:" appears, press
**Ctrl-C**.

**Say:** "Without `--browser`, existing users and scripts get exactly the same
prompts: client ID and secret. Nothing changes for them."

### Scene B. Sign in with the browser

```bash
scene "B. Sign in with the browser"
vdev login --browser --api-base "$API" --web-base "$WEB"
```

Press **Enter** three times (API base URL, Web app URL, OAuth scope). The browser
opens the staging consent page. Show it, then click **Approve**. Show the tab
saying "Signed in to the Vanta CLI.", then switch back to the terminal.

**Expect:** `Signed in. Credentials saved to macOS Keychain` and `Access token
cached (expires at …); it refreshes automatically`.

```bash
kcsummary
```

**Expect:** `"auth_mode": "user"`, the staging `api_base` and `web_base`,
`"secret_empty": true` and `"has_refresh_token": true`.

**Say:** "No client secret is stored. It's a person's sign-in, with a refresh
token in the Keychain."

### Scene C. Commands run as you

```bash
scene "C. Commands run as the signed-in person"
vdev organization get
vdev controls list --page-size 3
```

```bash
VID=$(vdev vendors create --json '{"name":"CLI OAuth demo","websiteUrl":"https://example.com"}' | tee /dev/stderr | jq -r .id)
vdev vendors delete --id "$VID" && echo "deleted $VID"
```

**Expect:** the new vendor's JSON, then `deleted <id>`.

**Say:** "No flags after login: it remembers staging. Permissions follow the
person, so an employee-role user would get a 403 on the create."

### Scene D. Expired token: silent refresh

```bash
scene "D. Expired access token refreshes silently"
BEFORE=$(rtfp); expire
vdev controls list --page-size 1
echo "refresh token fingerprint: $BEFORE -> $(rtfp)"
```

**Expect:** the list prints normally and the two fingerprints **differ**.

**Say:** "I forced the cached access token to look expired. The CLI refreshed
it with no prompt and saved the rotated refresh token. The fingerprint is a
hash, so no token is on screen."

### Scene E. Token rejected early: one refresh and retry

```bash
scene "E. Rejected token: refresh and retry once"
poison
vdev --verbose controls list --page-size 1 > /dev/null
```

**Expect:**

```
-> GET https://api.staging.vanta.com/v1/controls?pageSize=1
<- 401
-> GET https://api.staging.vanta.com/v1/controls?pageSize=1 (retry after refresh)
<- 200
```

```bash
vdev --verbose controls list --page-size 1 > /dev/null
```

**Expect:** one `-> GET` and `<- 200`, with no retry.

**Say:** "If the server rejects a token the CLI thought was still good, for
example after it was revoked, the CLI refreshes and retries once, then saves
the good token."

### Scene F. `--dry-run` never touches the sign-in

```bash
scene "F. --dry-run does not rotate tokens"
BEFORE=$(rtfp); expire
vdev --dry-run controls list --page-size 1
echo "after dry run:  $BEFORE -> $(rtfp)   (same)"
vdev controls list --page-size 1 > /dev/null
echo "after real call: $(rtfp)   (rotated)"
```

**Expect:** `DRY RUN GET …`, then the **same** fingerprint twice, then a **new**
one after the real call.

### Scene G. Signing in again revokes the old sign-in

```bash
scene "G. Re-login revokes the previous sign-in"
OLD_RT=$(kc | jq -r .oauth_refresh_token)
vdev login --browser
```

Press **Enter** three times. Staging is already filled in as the default. Approve
in the browser, then come back.

```bash
tryrefresh "$OLD_RT"; unset OLD_RT
```

**Expect:** `{"error":"invalid_grant"}`

**Say:** "The old refresh token is dead on the server, so repeated logins don't
leave live grants behind or use up the per-user limit."

### Scene H. Logout revokes on the server

```bash
scene "H. Logout revokes on the server"
RT=$(kc | jq -r .oauth_refresh_token)
expire
vdev logout
tryrefresh "$RT"; unset RT
```

**Expect:** `Signed out. Credentials removed from macOS Keychain.`, then
`{"error":"invalid_grant"}`.

```bash
vdev controls list
vdev logout
```

**Expect:** `missing auth credentials: run \`vanta login\` …` (exit 1), then
`Not signed in; nothing to remove.`

**Say:** "Logout revokes the grant on the server, even though the access token
had already expired. It then clears the Keychain, and running it again is
harmless."

### Outro

**Say:** "That's #45: opt-in browser sign-in, silent refresh, retry on 401,
and revocation on re-login and logout, with client credentials unchanged."

**Stop recording.**

---

## After recording: restore your login

```bash
vdev logout
[ -s ~/vanta-keychain-backup.txt ] && security add-generic-password -U -s com.vanta.cli -a oauth -w "$(cat ~/vanta-keychain-backup.txt)" -T /usr/bin/security
[ -f ~/vanta-config-backup.json ] && cp ~/vanta-config-backup.json ~/.vanta/config.json
rm -f ~/vanta-keychain-backup.txt ~/vanta-config-backup.json
```

## If a scene goes wrong

| What you see | What to do |
|---|---|
| G or H prints `STILL VALID: got new tokens` | Real bug: stop and report it on #45 with the output |
| `server_error` after Approve | Gate is off for the active workspace; switch workspace in the browser and redo B |
| Consent page opens on app.vanta.com | `$WEB` is empty: the helpers weren't pasted in this terminal |
| C's create returns 403 | The user isn't an editor; say so on camera (it shows permissions follow the person) or switch user |
| `command not found: scene` / `vdev` / `kc` | Paste the helpers (prep step 3) again |
| Output looks like `data[1]{id,name}` instead of JSON | You're in an agent terminal; use a plain one |
| `timed out after 300s` | Approve took over 5 minutes; rerun the scene's login |
| A command hangs silently | Press Ctrl-C and re-paste the block (a `jq` is waiting on the keyboard) |

Scenes are independent from D onward, so you can re-record a single scene. Scenes
D–H need a signed-in state: if you're signed out, rerun B first.
