import { useEffect, useRef, useState } from "react";
import { onSnapshot } from "firebase/firestore";

const LOADING = { data: undefined, error: null };

/**
 * Live Firestore subscription. `make` returns a document ref, a query, or null (skip).
 * `deps` is a list of primitive values that identify the subscription; the listener is
 * re-created when they change.
 * data: undefined = loading, null = missing document, object | array otherwise.
 */
export function useLive(make, deps) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState({ key, ...LOADING });
  const makeRef = useRef(make);

  useEffect(() => {
    makeRef.current = make;
  });

  useEffect(() => {
    const target = makeRef.current();
    if (!target) return undefined;
    return onSnapshot(
      target,
      (snap) => setState({
        key,
        data: snap.docs
          ? snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          : snap.exists() ? { id: snap.id, ...snap.data() } : null,
        error: null,
      }),
      (error) => setState({ key, data: undefined, error }),
    );
  }, [key]);

  // Ignore results that belong to a previous subscription key (derived during render).
  return state.key === key ? state : LOADING;
}
