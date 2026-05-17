# Ramiz action — connect Vercel project to GitHub repo

**5 minutes, browser-only, non-destructive. No CLI commands needed.**

[AGENT 3] cannot complete this step automatically because Vercel's GitHub App installation is an interactive OAuth flow that requires you to grant the Vercel app access to your `fer-fer-code` GitHub account. The Vercel session in CLI can drive Vercel-side actions but cannot perform the GitHub-side OAuth handshake on your behalf.

## What needs to happen

The Vercel project `lancerwise` (id `prj_OfYhgE1ONf98IhDzAMzspTr7hC1A`) was created via `vercel deploy` (CLI bootstrap), which spawns a project without a git connection. **The Vercel GitHub App has never been installed on the `fer-fer-code` GitHub account.** All 825 historical deploys on this project came via CLI — there is no link to "reconnect" because none ever existed.

After you complete these steps:
- Every push to `main` will trigger an auto-deploy
- Every push to a non-main branch will create a Vercel preview deploy
- [AGENT 2]'s remaining ~12 B2 cluster PRs will auto-deploy without `vercel --prod --yes`
- [AGENT 1]'s bug fix commits will auto-deploy
- Step-4 CI `gate / qa-gates` continues to run on the GitHub side (unchanged)

## Exact click sequence

### Step 1 — open project Git settings on Vercel

Open this URL in a browser signed in to the Vercel account that owns the lancerwise team:

```
https://vercel.com/team_1chEHohDYMmF5qKeIHoyczor/lancerwise/settings/git
```

Or navigate manually: Vercel dashboard → `lancerwise` project → Settings → Git (left sidebar).

### Step 2 — click "Connect Git Repository"

You'll see "No Git Repository Connected" with a `Connect Git Repository` button (or "Connect Git" — exact text varies by Vercel UI rev). Click it.

### Step 3 — pick GitHub

A modal opens with options: GitHub / GitLab / Bitbucket. Click **GitHub**.

### Step 4 — first time: install the Vercel GitHub App

Because the Vercel GitHub App is not installed on `fer-fer-code` yet, you'll be redirected to GitHub's app installation page:

```
https://github.com/apps/vercel/installations/new
```

GitHub will ask:
- **Where do you want to install Vercel?** → choose `fer-fer-code` (your personal account).
- **Which repositories should Vercel have access to?** → recommend **"Only select repositories"** → in the dropdown pick **only `lancerwise`**. (Avoid "All repositories" — narrower scope = better security; you can grant access to other repos later as needed.)
- Click **Install**.

GitHub redirects you back to Vercel.

### Step 5 — pick the repo on Vercel side

Back on the Vercel modal, a repo picker now shows `fer-fer-code/lancerwise`. Click on it.

Vercel asks which branch to treat as the production branch — accept the default **`main`**. Click **Connect**.

### Step 6 — confirmation

You should see in the same `…/settings/git` page:

```
Connected Git Repository
  fer-fer-code/lancerwise
  Production Branch: main
  [Disconnect]
```

That's it. Auto-deploys are now live.

## How [AGENT 3] will verify

Reply in chat with one line:

```
[AGENT 3] vercel connected
```

I will then:

1. Re-check `link` field in Vercel API — should now point at fer-fer-code/lancerwise.
2. Push a trivial test commit to `main` (README typo or empty commit).
3. Watch Vercel deployments list — should see a new `source=git` deploy fire automatically within ~30 seconds of the push.
4. Confirm the production URL serves the new commit's content.
5. Push the evidence to `audit/agent3-vercel-reconnect/after.txt` and `test-deploy.log`.

If anything goes wrong on your end (you hit a permissions error, the install screen looks different, Vercel can't see the repo after install), screenshot the exact screen and reply — I'll diagnose from there.

## Why this requires you (not me)

Three reasons the agent can't do this on its own:

1. **GitHub App install requires GitHub user consent.** Even with full `repo` and `workflow` OAuth scopes (which the agent's `gh` CLI has after the earlier `gh auth refresh -s workflow`), installing a third-party GitHub App is a separate consent flow that asks "do you trust this app with these repos?" GitHub deliberately makes that an explicit human approval — agent's `gh` token can't pre-approve.

2. **Vercel session cookies in the Chrome instance are scoped to a Google account.** The earlier device-flow auth handled GitHub OAuth refresh by giving GitHub a Google login it already had cookies for. The Vercel ↔ GitHub install asks GitHub "let Vercel access fer-fer-code's repos" — that's a one-time install action that GitHub gates behind a fresh consent click.

3. **The Vercel-side click happens in the Vercel team UI**, which works without GitHub auth (Vercel session only). [AGENT 3] technically CAN drive that side via Chrome CDP. But the GitHub redirect handoff in Step 4 hits the consent screen that needs you. Splitting halves of a 5-minute task between agent and human is more error-prone than just handing the whole thing to you.

## Backout (if you change your mind)

To undo, go to the same `…/settings/git` URL and click **Disconnect**. Project reverts to CLI-only mode. No deployments are deleted; existing production stays as-is.
