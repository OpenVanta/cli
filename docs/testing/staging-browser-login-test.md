# Vanta CLI browser sign-in: staging test runbook (macOS)

Tests the browser sign-in (OAuth PKCE), silent refresh, and logout from
[OpenVanta/cli#44](https://github.com/OpenVanta/cli/pull/44) against staging.

Run every block from the root of your `OpenVanta/cli` clone, in the same
terminal. Later steps use the alias and functions from step 0, which only exist
in the terminal where you ran it: **in a new terminal tab or window, run step 0
again** (otherwise you get `command not found: expire`).

You need `jq` (`brew install jq`), Node 22 or newer, and a staging account in
a workspace with the flag on.

## Before you start

- In your default browser, sign in to `https://app.staging.vanta.com` as the
  test user. Make the workspace with `rest_user_oauth_enabled` on the active one
  (not a legacy-package workspace).
- If macOS asks for Keychain access, click **Allow** or enter your password.
  **Never click "Reset To Defaults"**: it wipes your login keychain.

## 0. Setup (run in every new terminal)

```bash
export VANTA_API_BASE=https://api.staging.vanta.com/v1
export VANTA_WEB_BASE=https://app.staging.vanta.com
alias vdev="$PWD/dist/binaries/vanta-darwin-$( [ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64 )"

# The first-party client id, read from source so it isn't copied around.
CLIENT_ID=$(grep -o 'vci_[0-9a-f]\{48\}' src/user-login.ts)

# Print the CLI's Keychain entry as JSON. It contains tokens: don't paste the output anywhere.
kc() { security find-generic-password -s com.vanta.cli -a oauth -w | sed 's/^go-keyring-base64://' | base64 -d; }

# Mark the cached access token as expired, so the next command has to refresh it.
expire() {
  local new; new=$(kc | jq -c '.cached_token_expires="2020-01-01T00:00:00Z"' | base64)
  security add-generic-password -U -s com.vanta.cli -a oauth -w "go-keyring-base64:$new" -T /usr/bin/security
}

# Show the stored login without printing the tokens.
kcsummary() { kc | jq '{auth_mode, oauth_client_id, secret_empty: (.oauth_client_secret == ""), has_refresh_token: ((.oauth_refresh_token // "") != ""), cached_token_expires}'; }
```

## 1. Pull and build

```bash
git fetch origin
git checkout nikhilbh2/oauth-browser-login
git pull
pnpm install                  # no pnpm? run: npm install -g pnpm@12.6.0
pnpm generate && pnpm test    # expect 64 passing and no Keychain prompt
pnpm build:binaries
vdev --version                # prints "dev"
```

## 2. Back up your current login

Signing in overwrites the Keychain entry, so save it first.

```bash
security find-generic-password -s com.vanta.cli -a oauth -w > ~/vanta-keychain-backup.txt 2>/dev/null
cp ~/.vanta/config.json ~/vanta-config-backup.json 2>/dev/null
```

## 3. Sign in through the browser

```bash
vdev login
```

| Prompt | Answer |
|---|---|
| API base URL | Enter |
| OAuth client ID | leave blank, Enter |
| Web app URL | Enter |
| OAuth scope | Enter |

Approve in the browser. The tab should say "Signed in to the Vanta CLI" and the
terminal `Signed in.`

```bash
kcsummary
```

Expect `auth_mode: "user"`, a `vci_…` client id, `secret_empty: true`, and
`has_refresh_token: true`.

## 4. A read and a write

```bash
vdev organization get
vdev controls list --page-size 5
vdev vendors create --json '{"name":"CLI OAuth e2e","websiteUrl":"https://example.com"}'
vdev vendors delete --id <id from the create output>
```

With the editor role, the create should succeed; with the employee role it
should be a 403.

## 5. Silent refresh

```bash
OLD_RT=$(kc | jq -r .oauth_refresh_token)
expire
vdev controls list --page-size 1
[ "$OLD_RT" != "$(kc | jq -r .oauth_refresh_token)" ] && echo "rotated: PASS" || echo "not rotated: FAIL"
```

The list should succeed with no prompt.

## 6. Logout

```bash
vdev logout              # "Signed out. Credentials removed from macOS Keychain."
vdev controls list       # should fail and say to run `vanta login`
```

### 6b. Logout with an expired access token (still to be checked)

Sign in again first (step 3). Then:

```bash
RT=$(kc | jq -r .oauth_refresh_token)
expire
vdev logout
curl -s https://api.staging.vanta.com/oauth/token \
  -d grant_type=refresh_token -d client_id="$CLIENT_ID" -d refresh_token="$RT"
unset RT
```

- `{"error":"invalid_grant"}` → PASS: logout revoked the whole grant.
- New tokens → FAIL: suspend rejects an expired access token, so logout should
  revoke with the refresh token instead. Report it on the PR.

## 7. Optional error cases

- **Decline consent:** run `vdev login` and decline in the browser. Expect exit 1
  with `access_denied: sign-in was declined in the browser`.
- **Flag off:** sign in through a workspace without the flag. Expect exit 1 with
  `server_error: … check that browser sign-in is enabled for your workspace`,
  and no hang.
- **Client credentials still work:** run `vdev login` and enter a real client ID
  and secret.

## 8. Restore your original login

```bash
[ -s ~/vanta-keychain-backup.txt ] && security add-generic-password -U -s com.vanta.cli -a oauth \
  -w "$(cat ~/vanta-keychain-backup.txt)" -T /usr/bin/security
[ -f ~/vanta-config-backup.json ] && cp ~/vanta-config-backup.json ~/.vanta/config.json
rm -f ~/vanta-keychain-backup.txt ~/vanta-config-backup.json
```

If you had no login before, run `vdev logout` instead.

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| `server_error` right after approving | Flag is off for that workspace, or the first-party client isn't seeded in staging |
| Browser doesn't open | Open the URL the terminal printed |
| `timed out after 300s` | Consent wasn't finished within 5 minutes; run `vdev login` again |
| `oauth error (400): … invalid_grant` at sign-in | The code expired (60 s) or was already used; sign in again |
| 401 on a command right after logout | Expected |
| A command hangs with no output | A `$(… | jq …)` is missing its `kc |`, so `jq` waits on the keyboard; press Ctrl-C |
| `command not found: kc` / `expire` / `vdev` | Step 0 wasn't run in this terminal |
| `command not found: corepack` | Use `npm install -g pnpm@12.6.0` instead |
