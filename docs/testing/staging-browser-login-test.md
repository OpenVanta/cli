# Vanta CLI browser sign-in: staging demo runbook (macOS)

Walks through every CLI behaviour that changes in
[OpenVanta/cli#45](https://github.com/OpenVanta/cli/pull/45), against staging,
in the order a reviewer would want to see it. Each step has the commands to
paste and what to expect. The code is exactly #45's: staging is reached only
through `--api-base` and `--web-base`, the way a user on another region would.

Steps marked **(needs an API client)** use a staging OAuth client ID and secret.
Skip them if you don't have one; everything else works without.

Run every block from the root of your `OpenVanta/cli` clone, in the same
terminal. Step 0 defines helpers that exist only in that terminal: **in a new
tab or window, run step 0 again**. Use Terminal or iTerm, not a terminal inside
Claude Code or another agent, which switches the CLI's output to a compact
agent format.

You need `jq` (`brew install jq`), Node 22 or newer, and a staging account in a
workspace with `rest_user_oauth_enabled` on, with the **editor** role.

## Before you start

- In your default browser, sign in to `https://app.staging.vanta.com` as the
  test user, with that workspace active.
- If macOS asks for Keychain access, click **Allow** or enter your password.
  **Never click "Reset To Defaults"**: it wipes your login keychain. Expect a
  prompt the first time a newly built binary reads an entry an older one wrote.

## 0. Setup (run in every new terminal)

```bash
API=https://api.staging.vanta.com/v1
WEB=https://app.staging.vanta.com
VDEV="$PWD/dist/binaries/vanta-darwin-$( [ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64 )"
vdev() { "$VDEV" "$@"; }   # a function, so `VAR=x vdev …` works in bash and zsh

# Optional: a staging API client, for the steps marked "needs an API client".
CID=""      # e.g. vci_…
CSECRET=""  # e.g. vcs_…

# The first-party client id, read from source so it isn't copied around.
CLIENT_ID=$(grep -o 'vci_[0-9a-f]\{48\}' src/user-login.ts)

# Print the CLI's Keychain entry as JSON. It contains tokens: don't show it on camera.
kc() { security find-generic-password -s com.vanta.cli -a oauth -w | sed 's/^go-keyring-base64://' | base64 -d; }

# Rewrite the Keychain entry with a jq filter.
kcset() { local new; new=$(kc | jq -c "$1" | base64); security add-generic-password -U -s com.vanta.cli -a oauth -w "go-keyring-base64:$new" -T /usr/bin/security; }

# Mark the cached access token as expired, so the next command has to refresh it.
expire() { kcset '.cached_token_expires="2020-01-01T00:00:00Z"'; }

# Replace the cached access token with junk that still looks unexpired, so the API answers 401.
poison() { kcset '.cached_access_token="not-a-real-token" | .cached_token_expires="2099-01-01T00:00:00Z"'; }

# Show the stored login without printing any token. Safe on camera.
kcsummary() { kc | jq '{auth_mode, oauth_client_id, secret_empty: ((.oauth_client_secret // "") == ""), has_refresh_token: ((.oauth_refresh_token // "") != ""), cached_token_expires}'; echo "config.json:"; jq '{api_base, web_base}' ~/.vanta/config.json; }

# Fingerprint of the stored refresh token, for showing it changed without showing it.
rtfp() { kc | jq -r '.oauth_refresh_token // ""' | shasum | cut -c1-8; }

# Try to use a refresh token directly. "invalid_grant" means the grant is dead.
tryrefresh() { curl -s https://api.staging.vanta.com/oauth/token -d grant_type=refresh_token -d client_id="$CLIENT_ID" -d refresh_token="$1" | jq -c 'if .access_token then "STILL VALID: got new tokens" else . end'; }

# Clear the screen and print a step title.
step() { clear; printf '\n\033[1m%s\033[0m\n\n' "$*"; }
```

## 1. Pull and build

```bash
git fetch origin
git checkout nikhilbh2/cli-browser-login-staging-test
git pull
pnpm install                  # no pnpm? run: npm install -g pnpm@12.6.0
pnpm generate && pnpm test    # expect 108 passing and no Keychain prompt
pnpm build:binaries
vdev --version                # prints "dev"
```

## 2. Back up your current login and start signed out

```bash
security find-generic-password -s com.vanta.cli -a oauth -w > ~/vanta-keychain-backup.txt 2>/dev/null
cp ~/.vanta/config.json ~/vanta-config-backup.json 2>/dev/null
vdev logout
```

If you plan to record, run steps 4 and 5 once now as a rehearsal, then
`vdev logout` again. That gets the first-time Keychain prompt out of the way.

---

## 3. What's new in `--help`

```bash
step "3. New options in --help"
vdev --help | grep -A3 -- '--web-base'
vdev login --help
vdev logout --help
```

**Expect:** a global `--web-base <url>` for the consent page; `login` lists
`--browser … (beta)` and `--no-open`; `logout` exists.

## 4. `vanta login` now asks how to sign in

### 4a. Enter keeps the existing flow

```bash
step "4a. The sign-in question; Enter is the old flow"
vdev login --api-base "$API"
```

**Expect:**

```
How do you want to sign in?
  1) With an API client ID and secret
  2) With your Vanta account in the browser (beta; may not be enabled for your workspace yet)
Choice [1]:
```

Press **Enter**. Then "API base URL", then **"OAuth client ID:"**, exactly as
today. Press **Ctrl-C** there. Nothing is saved.

### 4b. A wrong answer is asked again

```bash
vdev login --api-base "$API"
```

Type `yes`, Enter. **Expect:** `Enter 1 or 2.` and the `Choice [1]:` prompt
again. Press **Ctrl-C**.

### 4c. Piped input never sees the question

```bash
printf '\n' | vdev login --api-base "$API"; echo "exit $?"
```

**Expect:** no question; the old prompts print directly, and it fails with
`no input for "OAuth client ID"` and **exit 1**. (Before #45, a login with no
input exited 0 having saved nothing.)

### 4d. Flags skip the question

```bash
vdev login --client-id demo-client --api-base "$API"
```

**Expect:** no question, and the client ID prompt is pre-filled:
`OAuth client ID [demo-client]:`. Before #45 the global `--client-id` was
dropped by `login`. Press **Ctrl-C**.

```bash
vdev login --browser --client-id x; echo "exit $?"
vdev login --no-open; echo "exit $?"
```

**Expect:** two refusals, exit 1 each: `--browser` can't be combined with
client credentials, and `--no-open` needs `--browser`.

## 5. Sign in with the browser (option 2)

```bash
step "5. Browser sign-in via option 2"
vdev login --api-base "$API" --web-base "$WEB"
```

Type `2`, Enter. Then **Enter** three times (API base URL, Web app URL, OAuth
scope). The browser opens the staging consent page; approve. The tab says
"Signed in to the Vanta CLI."

**Expect in the terminal:** `Signed in. Credentials saved to macOS Keychain`
and `Access token cached (expires at …); it refreshes automatically`.

```bash
kcsummary
```

**Expect:** `"auth_mode": "user"`, a `vci_…` client id, `"secret_empty": true`
(no secret on disk), `"has_refresh_token": true`, and staging `api_base` and
`web_base` in `config.json`.

### 5b. The web base is remembered, and `VANTA_WEB_BASE` works

```bash
vdev login --browser
```

**Expect:** no question (`--browser`), and both defaults are already staging:
`API base URL [https://api.staging.vanta.com/v1]`, then
`Web app URL [https://app.staging.vanta.com]`. Press **Ctrl-C** at the web app
prompt.

```bash
VANTA_WEB_BASE=https://example.test vdev login --browser
```

**Expect:** `Web app URL [https://example.test]`. Press **Ctrl-C**.

## 6. Commands run as you

```bash
step "6. Commands run as the signed-in person"
vdev organization get
vdev controls list --page-size 3
VID=$(vdev vendors create --json '{"name":"CLI OAuth demo","websiteUrl":"https://example.com"}' | tee /dev/stderr | jq -r .id)
vdev vendors delete --id "$VID" && echo "deleted $VID"
```

**Expect:** no flags needed after login; the create returns the vendor's JSON
and the delete prints `deleted <id>`. With the employee role the create is a
403, because permissions follow the person.

## 7. Tokens refresh on their own

### 7a. Expired token: silent refresh

```bash
step "7a. Silent refresh"
BEFORE=$(rtfp); expire
vdev controls list --page-size 1
echo "refresh token fingerprint: $BEFORE -> $(rtfp)"
```

**Expect:** the list prints normally and the two fingerprints differ: the
refresh token rotated and the new one was saved. (`--verbose` doesn't show the
refresh; it logs API calls, not token requests.)

### 7b. Rejected token: one refresh and retry

```bash
step "7b. 401 → refresh → retry once"
poison
vdev --verbose controls list --page-size 1 > /dev/null
vdev --verbose controls list --page-size 1 > /dev/null
```

**Expect** from the first command:

```
-> GET https://api.staging.vanta.com/v1/controls?pageSize=1
<- 401
-> GET https://api.staging.vanta.com/v1/controls?pageSize=1 (retry after refresh)
<- 200
```

and from the second, a single `-> GET` / `<- 200`: the good token was saved.

### 7c. `--dry-run` never touches the sign-in

```bash
step "7c. --dry-run does not rotate tokens"
BEFORE=$(rtfp); expire
vdev --dry-run controls list --page-size 1
echo "after dry run:   $BEFORE -> $(rtfp)   (same)"
vdev controls list --page-size 1 > /dev/null
echo "after real call: $(rtfp)   (rotated)"
```

## 8. Signing in again revokes the old sign-in

```bash
step "8. Re-login revokes the previous sign-in"
OLD_RT=$(kc | jq -r .oauth_refresh_token)
VANTA_CLIENT_SECRET=placeholder vdev login --browser
```

**Enter** three times, approve in the browser.

**Expect:** `Signed in.`, followed by a warning that `VANTA_CLIENT_SECRET` is
set, so commands in this shell would use client credentials, not this sign-in.
(The variable was only set for that one command; it isn't set in your shell.)

```bash
tryrefresh "$OLD_RT"; unset OLD_RT
```

**Expect:** `{"error":"invalid_grant"}`. The old grant is dead, so repeated
logins don't use up the 10-grants-per-user limit.

## 9. One login at a time (needs an API client)

```bash
step "9. Client login replaces and revokes a browser sign-in"
RT=$(kc | jq -r .oauth_refresh_token)
printf '%s\n%s\n%s\n\n' "$API" "$CID" "$CSECRET" | vdev login
kcsummary
tryrefresh "$RT"; unset RT
```

**Expect:** `OAuth credentials saved to macOS Keychain`; `"auth_mode": "client"`,
your client id, `"secret_empty": false`, `"has_refresh_token": false`; and
`{"error":"invalid_grant"}`: the browser sign-in was revoked, not just dropped.

```bash
vdev controls list --page-size 1 > /dev/null && echo "runs as the client"
```

### 9b. A login saved by an older CLI keeps working

Older CLIs wrote no `auth_mode`. Simulate one:

```bash
step "9b. Old-style entry (no auth_mode) needs no re-login"
kcset 'del(.auth_mode) | .cached_access_token="" | .cached_token_expires=""'
kc | jq '{auth_mode, oauth_client_id}'          # auth_mode: null
vdev controls list --page-size 1 > /dev/null && echo "works, no re-login"
kc | jq '{auth_mode}'                            # still null: nothing rewritten
```

### 9c. Browser sign-in replaces the client credentials

```bash
step "9c. Browser sign-in replaces client credentials"
vdev login --browser
kcsummary
```

**Enter** three times, approve. **Expect:** `"auth_mode": "user"` and
`"secret_empty": true`. The client secret is gone from the machine; running
`vdev login` again with the client ID and secret brings it back.

### 9d. Env credentials win over a saved browser sign-in

```bash
step "9d. Env client credentials take priority"
VANTA_CLIENT_ID="$CID" VANTA_CLIENT_SECRET="$CSECRET" vdev --verbose controls list --page-size 1 > /dev/null
kcsummary
```

**Expect:** the command works as the client, and `kcsummary` still shows the
browser sign-in untouched (`auth_mode: "user"`, same refresh token). The
client's token was never cached into the person's sign-in.

## 10. Logout

### 10a. A browser sign-in is revoked on the server

```bash
step "10a. Logout revokes on the server"
RT=$(kc | jq -r .oauth_refresh_token)
expire                        # the access token being expired must not matter
vdev logout
tryrefresh "$RT"; unset RT
vdev controls list; echo "exit $?"
vdev logout
```

**Expect:** `Signed out. Credentials removed from macOS Keychain.`;
`{"error":"invalid_grant"}`; `missing auth credentials: run \`vanta login\` …`
with exit 1; and `Not signed in; nothing to remove.`

If `tryrefresh` prints `STILL VALID`, logout did not revoke on the server. Stop
and report it on #45.

### 10b. Client credentials are only removed locally (needs an API client)

```bash
step "10b. Client logout is local"
printf '%s\n%s\n%s\n\n' "$API" "$CID" "$CSECRET" | vdev login > /dev/null
vdev logout
```

**Expect:** `Signed out.` with no server call (there is no grant to revoke).

## 11. When the browser can't reach this machine

```bash
step "11. --no-open and pasting the callback URL"
vdev login --browser --no-open --api-base "$API" --web-base "$WEB"
```

**Enter** three times. The CLI prints the URL instead of opening it, then waits.

1. Type `hello`, Enter. **Expect:** `That doesn't look like a sign-in URL; paste
   the full URL from the browser's address bar.` It keeps waiting.
2. Paste `http://127.0.0.1:1/callback?code=x&state=wrong`, Enter. **Expect:**
   `That URL does not match this sign-in request; paste the URL from this
   attempt.` It keeps waiting. A pasted URL gets the same state check as the
   browser redirect.
3. Copy the printed URL into the browser and approve. On the same machine the
   loopback finishes the sign-in. Over SSH, the browser's final page doesn't
   load; the person pastes its address-bar URL into the terminal instead.

## 12. Errors a user can see

```bash
step "12. Declined consent"
vdev login --browser
```

**Enter** three times, then click **Deny** in the browser. **Expect:** exit 1
with `browser sign-in failed: access_denied: sign-in was declined in the
browser`.

**Gate off (optional):** switch the browser to a workspace without
`rest_user_oauth_enabled`, run `vdev login --browser` and approve. **Expect:**
exit 1 with `server_error … browser sign-in is in beta and may not be enabled
for your workspace yet; you can still sign in with client credentials: vanta
login`. No hang. Switch the browser back afterwards.

**Timeout (optional, 5 minutes):** run `vdev login --browser` and do nothing.
**Expect:** `timed out after 300s waiting for the browser sign-in to finish.
Run vanta login --browser to try again`.

## 13. Piped input is read in full

```bash
step "13. Piped answers all land"
printf 'http://127.0.0.1:1/v1\ncid\nsec\n\n' | vdev login
```

**Expect:** all four prompts are answered from the pipe, then a connection error
for the bogus API base. Before #45, a login with every answer piped in at once
lost some of them.

---

## 14. Restore your original login

```bash
vdev logout
[ -s ~/vanta-keychain-backup.txt ] && security add-generic-password -U -s com.vanta.cli -a oauth -w "$(cat ~/vanta-keychain-backup.txt)" -T /usr/bin/security
[ -f ~/vanta-config-backup.json ] && cp ~/vanta-config-backup.json ~/.vanta/config.json
rm -f ~/vanta-keychain-backup.txt ~/vanta-config-backup.json
```

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| `STILL VALID` in step 8, 9 or 10a | Real bug: report it on #45 with the output |
| `server_error` right after approving | Gate is off for the active workspace, or the first-party client isn't seeded in staging |
| Consent page opens on app.vanta.com | `$WEB` is empty: step 0 wasn't run in this terminal, or `--web-base` was left off the first browser login |
| Step 6 create returns 403 | The user isn't an editor; it shows permissions follow the person |
| `timed out after 300s` | Consent wasn't finished within 5 minutes; run it again |
| `the sign-in code was rejected` | The code expired (60 s) or was already used; sign in again |
| Output looks like `data[1]{id,name}` instead of JSON | You're in an agent terminal; use a plain one |
| A command hangs with no output | A `$(… \| jq …)` is missing its `kc \|`, so `jq` waits on the keyboard; press Ctrl-C |
| `command not found: kc` / `expire` / `vdev` / `step` | Step 0 wasn't run in this terminal |
| `security: … could not be found` | Not signed in, so there is no Keychain entry to edit |
| `command not found: corepack` | Use `npm install -g pnpm@12.6.0` instead |
