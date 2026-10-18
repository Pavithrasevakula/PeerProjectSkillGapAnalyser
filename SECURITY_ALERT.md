# Security Notes: Credentials and Git History

Last reviewed: 2026-10-17 (pre-hosting cleanup audit). This replaces an earlier version of this file that incorrectly said no credential had ever been committed.

## What was checked

| Check | Result |
| --- | --- |
| Are any `.env` files tracked by Git? | No. Only `frontend/.env.example` (placeholders) is tracked. |
| Has any `.env`, key, certificate or service-account file ever been committed (all branches)? | No. |
| Private keys or `private_key` fields anywhere in history? | None found. |
| Firebase **web API key** in history? | **Yes.** Commit `089a2f7` (2026-10-12, "Updates") committed a built bundle, `assets/index-5583XE2t.js`, that embeds the project's Firebase web API key. It is the same key `frontend/.env` uses today. The file is no longer in the working tree, but it remains in history. |
| Remote | `origin` is a GitHub repository, so treat that history as potentially readable by others. |

No secret value is reproduced in this document.

## How serious is it?

A Firebase **web** API key is a public project identifier. It is shipped inside every deployed JavaScript bundle by design and cannot be hidden from users of the app. By itself it does not grant access to data. What protects the project is:

1. Firestore and Storage **security rules** (see `firestore.rules`, `storage.rules`),
2. **API key restrictions** in Google Cloud, and
3. optionally **App Check**.

So rewriting history is **not required**. It is still good practice to lock the key down.

## Recommended actions (all optional for a class demo, recommended before a public launch)

1. **Restrict the API key** (Google Cloud Console > APIs & Services > Credentials): limit it to your hosting domains (HTTP referrers) and the Firebase APIs the app uses.
2. **Enable App Check** for Firestore, Storage and Functions.
3. **Review the security rules** before opening sign-ups. See "Known production caveats" in `DEPLOYMENT.md` (demo-data clauses and open master-data writes).
4. **Demo accounts:** `DEMO_CREDENTIALS.md` documents demo users with a shared, publicly documented password in the live Firebase Auth project. Delete or disable those users (and change the policy for shared passwords) before the app is publicly reachable.
5. **Optional: rotate the web API key** in the Firebase console if you want the committed value to stop working. Update `frontend/.env` and rebuild afterwards.
6. **Optional: purge the old bundle from history** (this rewrites history and requires everyone to re-clone, so only do it deliberately):
   ```bash
   git filter-repo --path assets/index-5583XE2t.js --invert-paths
   git push --force --all
   ```
   (`git filter-repo` is the maintained replacement for `git filter-branch` and BFG.)

## Prevention in place

- `.gitignore` ignores every `.env` variant at any depth (`.env`, `.env.local`, `.env.development.local`, `.env.production.local`, ...) while keeping `.env.example`, plus service-account keys (`service-account-key.json`, `*-service-account*.json`, `serviceAccountKey*.json`), `*.pem`, `*.key`, `.runtimeconfig.json` and `*.log`.
- `frontend/dist/` (build output) is ignored, so bundles containing the web key are no longer committed.
- The service-account key used by the Admin SDK scripts lives only in `functions/` and is ignored.
- Never put server credentials in `frontend/`: everything prefixed `VITE_` is embedded in the public bundle.

## Reporting a vulnerability

Do not open a public GitHub issue. Contact the project maintainer directly.

## References

- [Firebase security rules best practices](https://firebase.google.com/docs/rules/best-practices)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Restricting API keys](https://cloud.google.com/docs/authentication/api-keys#securing)
- [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
