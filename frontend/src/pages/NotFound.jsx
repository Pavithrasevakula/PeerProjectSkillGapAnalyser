import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-16">
      <div className="panel max-w-md px-8 py-10 text-center">
        <p className="eyebrow justify-center mb-3">ERROR 404</p>
        <h1 className="font-display text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn btn-primary">Browse projects</Link>
          {!user && <Link to="/login" className="btn btn-quiet">Sign in</Link>}
        </div>
      </div>
    </div>
  );
}
