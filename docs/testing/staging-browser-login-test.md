# Vanta CLI browser sign-in: staging demo runbook (macOS)

Runs the would-be production CLI from
[OpenVanta/cli#45](https://github.com/OpenVanta/cli/pull/45) against staging,
scene by scene, so you can record what a user will see. The code is exactly
#45. Staging is reached only through the `--api-base` and `--web-base` flags,
just as a user on a non-default region would do it. Nothing is baked in.

Run every block from the root of your `OpenVanta/cli` clone, in the same
terminal. Step 0 defines helpers that exist only in the terminal where you ran
it: **in a new tab or window, run step 0 again** (otherwise you get
`command not found: expire`).

You need `jq` (`brew install jq`), Node 22 or newer, and a staging account in a
workspace with `rest_user_oauth_enabled` on.

## Before you start

- In your default browser, sign in to `https://app.staging.vanta.com` as the
  test user. Make the workspace with the flag on the active one.
- If macOS asks for Keychain access, click **Allow** or enter your password.
  **Never click "Reset To Defaults"**: it wipes your login keychain. Expect a
  prompt the first time a newly built binary reads an entry an older one wrote.
- For the recording, do steps 0–2 off camera, then start at scene A.

## 0. Setup (run in every new terminal)

```bash
API=https://api.staging.vanta.com/v1
WEB=https://app.staging.vanta.com
alias vdev="$PWD/dist/binaries/vanta-darwin-$( [ "$(uname -m)" = arm64 ] && echo arm64 || echo amd64 )"

# The first-party client id, read from source so it isn't copied around.
CLIENT_ID=$(grep -o 'vci_[0-9a-f]\{48\}' src/user-login.ts)

# Print the CLI's Keychain entry as JSON. It contains tokens: don't show it on camera.
kc() { security find-generic-password -s com.vanta.cli -a oauth -w | sed 's/^go-keyring-base64://' | base64 -d; }

# Rewrite the Keychain entry with a jq filter.
kcset() {
  local new; new=$(kc | jq -c "$1" | base64)
  security add-generic-password -U -s com.vanta.cli -a oauth -w "go-keyring-base64:$new" -T /usr/bin/security
}

# Mark the cached access token as expired, so the next command has to refresh it.
expire() { kcset '.cached_token_expires="2020-01-01T00:00:00Z"'; }

# Replace the cached access token with junk that still looks unexpired, so the API answers 401.
poison() { kcset '.cached_access_token="not-a-real-token" | .cached_token_expires="2099-01-01T00:00:00Z"'; }

# Show the stored login without printing any token. Safe on camera.
kcsummary() { kc | jq '{auth_mode, api_base, web_base, oauth_client_id, secret_empty: ((.oauth_client_secret // "") == ""), has_refresh_token: ((.oauth_refresh_token // "") != ""), cached_token_expires}'; }

# Fingerprint of the stored refresh token, for showing it changed without showing it.
rtfp() { kc | jq -r '.oauth_refresh_token // ""' | shasum | cut -c1-8; }

# Try to use a refresh token directly. "invalid_grant" means the grant is dead.
tryrefresh() {
  curl -s https://api.staging.vanta.com/oauth/token \
    -d grant_type=refresh_token -d client_id="$CLIENT_ID" -d refresh_token="$1" \
  | jq -c 'if .access_token then "STILL VALID: got new tokens" else . end'
}
```

## 1. Pull and build

```bash
git fetch origin
git checkout nikhilbh2/cli-browser-login-staging-test
git pull
pnpm install                  # no pnpm? run: npm install -g pnpm@12.6.0
pnpm generate && pnpm test    # expect 101 passing and no Keychain prompt
pnpm build:binaries
vdev --version                # prints "dev"
```

## 2. Back up your current login

Signing in overwrites the Keychain entry, so save it first.

```bash
security find-generic-password -s com.vanta.cli -a oauth -w > ~/vanta-keychain-backup.txt 2>/dev/null
cp ~/.vanta/config.json ~/vanta-config-backup.json 2>/dev/null
vdev logout                   # start the demo signed out
```

---

## Scene A. It's opt-in: plain `vanta login` is unchanged

```bash
vdev login --help
```

`--browser` is listed as **(beta)**, along with `--no-open`.

```bash
vdev login --api-base "$API"
```

You get the same prompts as today: API base URL, then **OAuth client ID**, then
secret. Press **Ctrl-C** at the client ID prompt. Nothing is saved.

## Scene B. Sign in with the browser

```bash
vdev login --browser --api-base "$API" --web-base "$WEB"
```

| Prompt | Answer |
|---|---|
| API base URL `[…staging…]` | Enter |
| Web app URL `[https://app.staging.vanta.com]` | Enter |
| OAuth scope | Enter |

The browser opens the staging consent page. Approve it. The tab says "Signed in
to the Vanta CLI." The terminal prints `Signed in. Credentials saved to macOS
Keychain`, plus the expiry, followed by "it refreshes automatically".

```bash
kcsummary
```

Expect `auth_mode: "user"`, staging `api_base` and `web_base`, a `vci_…` client
id, `secret_empty: true` (no secret on disk), and `has_refresh_token: true`.

## Scene C. Commands run as you

No flags needed: the API base was saved.

```bash
vdev organization get
vdev controls list --page-size 5
vdev vendors create --json '{"name":"CLI OAuth demo","websiteUrl":"https://example.com"}'
vdev vendors delete --id <id from the create output>
```

With the editor role, the create succeeds. With the employee role it is a 403,
because permissions follow the person.

## Scene D. Expired token: silent refresh

```bash
BEFORE=$(rtfp); expire
vdev controls list --page-size 1
echo "refresh token: $BEFORE -> $(rtfp)"
```

The list succeeds with no prompt. The two fingerprints differ, because the
refresh token rotated and the new one was saved. `--verbose` doesn't show this
refresh: it logs API calls, not the token request.

## Scene E. Token rejected early: one refresh and retry

```bash
poison
vdev --verbose controls list --page-size 1
```

In the verbose output you see the request get a 401. Then the same request runs
again, marked `(retry after refresh)`, and succeeds. Run the command once more:
there's no retry this time, because the good token was saved.

## Scene F. `--dry-run` never touches the sign-in

```bash
BEFORE=$(rtfp); expire
vdev --dry-run controls list --page-size 1
echo "refresh token: $BEFORE -> $(rtfp)"    # same fingerprint
vdev controls list --page-size 1             # a real call then refreshes as normal
```

## Scene G. Signing in again revokes the old sign-in

```bash
OLD_RT=$(kc | jq -r .oauth_refresh_token)
vdev login --browser          # Enter through the prompts (staging is remembered), approve
tryrefresh "$OLD_RT"          # expect {"error":"invalid_grant"}
unset OLD_RT
```

The old grant is dead, so repeated logins don't use up the 10-grants-per-user
limit.

## Scene H. Logout revokes on the server

```bash
RT=$(kc | jq -r .oauth_refresh_token)
expire                        # also covers the case where the access token already expired
vdev logout                   # "Signed out. Credentials removed from macOS Keychain."
tryrefresh "$RT"              # expect {"error":"invalid_grant"}
unset RT
vdev controls list            # fails and says to run `vanta login`
vdev logout                   # "Not signed in; nothing to remove."
```

If `tryrefresh` prints `STILL VALID`, the logout didn't revoke the grant on the
server. Report it on #45.

## Scene I. No browser on this machine (`--no-open` and paste)

```bash
vdev login --browser --no-open --api-base "$API" --web-base "$WEB"
```

The CLI prints the URL instead of opening it, then waits.

1. Type `hello` and press Enter. The CLI refuses it ("That doesn't look like a
   sign-in URL…") and keeps waiting.
2. Copy the printed URL into the browser and approve. On the same machine the
   CLI finishes on its own.
3. Over SSH, the browser's final page doesn't load. Paste the address-bar URL
   into the terminal instead.

## Scene J. Mistakes give clear messages

```bash
vdev login --browser --client-id x       # refuses: either --browser or client credentials
vdev login --no-open                     # refuses: --no-open needs --browser
```

**Decline consent:** run `vdev login --browser` and click deny. It exits 1 with
`access_denied: sign-in was declined in the browser`.

**Gate off:** sign in through a workspace without `rest_user_oauth_enabled`. It
exits 1 with `server_error`. The message says browser sign-in is in beta, may
not be enabled for the workspace, and that `vanta login` still works. There's
no hang.

## Scene K (optional). Client credentials still work, and take priority

If you have a staging API client:

```bash
vdev login --api-base "$API"             # enter client ID and secret: same flow as today
kcsummary                                # auth_mode "client", has_refresh_token false
```

Then sign in with `--browser` again, set `VANTA_CLIENT_ID` and
`VANTA_CLIENT_SECRET` in the shell, and run a command. It runs as the client.
When you sign in with those variables set, the CLI warns about it. Unset them
and the next command runs as you again, because their token was never cached
into your sign-in.

---

## 3. Restore your original login

```bash
vdev logout
[ -s ~/vanta-keychain-backup.txt ] && security add-generic-password -U -s com.vanta.cli -a oauth \
  -w "$(cat ~/vanta-keychain-backup.txt)" -T /usr/bin/security
[ -f ~/vanta-config-backup.json ] && cp ~/vanta-config-backup.json ~/.vanta/config.json
rm -f ~/vanta-keychain-backup.txt ~/vanta-config-backup.json
```

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| `server_error` right after approving | Gate is off for that workspace, or the first-party client isn't seeded in staging |
| Consent page is on app.vanta.com, not staging | `--web-base "$WEB"` was left off the first `login --browser`, or step 0 wasn't run (so `$WEB` is empty) |
| Browser doesn't open | Open the URL the terminal printed |
| `timed out after 300s` | Consent wasn't finished within 5 minutes; run it again |
| `the sign-in code was rejected` | The code expired (60 s) or was already used; sign in again |
| A command hangs with no output | A `$(… \| jq …)` is missing its `kc \|`, so `jq` waits on the keyboard; press Ctrl-C |
| `command not found: kc` / `expire` / `vdev` | Step 0 wasn't run in this terminal |
| `security: … could not be found` | Not signed in, so there is no Keychain entry to edit |
| `command not found: corepack` | Use `npm install -g pnpm@12.6.0` instead |
