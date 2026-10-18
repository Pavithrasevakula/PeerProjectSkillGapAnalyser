/**
 * Shown instead of the app when required Firebase environment variables are missing.
 * It intentionally imports nothing from Firebase so it can always render.
 */
export default function ConfigError({ missing }) {
  return (
    <main className="min-h-screen grid place-items-center bg-paper px-4">
      <div className="panel max-w-lg p-8" role="alert">
        <h1 className="font-display text-2xl font-bold text-ink">TeamSync is not configured</h1>
        <p className="mt-3 text-sm text-muted">
          The app was built without its Firebase settings, so it cannot sign anyone in. Set the
          following environment variables, then rebuild the app.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm font-mono text-ink">
          {missing.map((name) => <li key={name}>{name}</li>)}
        </ul>
        <p className="mt-4 text-xs text-muted">
          See <code>frontend/.env.example</code> and DEPLOYMENT.md for details.
        </p>
      </div>
    </main>
  );
}
