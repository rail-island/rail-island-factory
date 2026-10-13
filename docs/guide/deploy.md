# Deploy

**Covers** - how factory.railisland.com is hosted, the GitHub Actions workflows
that build and deploy it, and the Cloudflare credentials they need.
**Code** - `wrangler.jsonc`, `.github/workflows/deploy.yml`, `.github/workflows/test.yml`
**See also** - [setup-and-build.md](setup-and-build.md), [../site/catalog-site.md](../site/catalog-site.md)

## The Worker

`wrangler.jsonc` declares one **assets-only** Worker, `rail-island-factory`: no
script, no bindings, no vars. It serves `dist/` - the site plus the generated
models it lists - on the custom domain `factory.railisland.com`, which wrangler
provisions on deploy. `not_found_handling: single-page-application` sends any
unknown path to `index.html`; the site keeps its state in the query string.

There is one environment. The site is public and has no sign-in.

## Workflows

| Workflow | Runs on | Does |
|---|---|---|
| `deploy.yml` | push to `master`, or by hand on any branch | `pnpm build`, then `wrangler deploy` |
| `test.yml` | push to `master`, or by hand on any branch | `pnpm typecheck`, then `pnpm test` (even if the typecheck failed) |

The two run in parallel; tests do **not** gate the deploy, so a red test run shows
as a failed check while the site already carries the commit. Fix forward. A
dispatch of `deploy.yml` against a `claude/*` branch puts that branch on the
site - the way to look at a change before it reaches `master`.

Both use Node 22 and pnpm 10, `pnpm install --frozen-lockfile`, and cancel an
in-flight run when a newer one starts.

## Credentials

Two repository secrets, the same pair `rail-island-webapp` uses (one Cloudflare
account):

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` - needs **Workers Scripts: Edit** on the account and
  zone-scoped **Workers Routes: Edit** over `railisland.com`. Without the second
  the upload succeeds and then fails on `/zones/<id>/workers/routes` with
  `Authentication error [code: 10000]`.

They are added by hand in the repository's *Settings > Secrets and variables >
Actions*.
