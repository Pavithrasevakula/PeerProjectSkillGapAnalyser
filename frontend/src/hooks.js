import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";

/**
 * Live Firestore subscription. `make` returns a document ref, a query, or null (skip).
 * data: undefined = loading, null = missing document, object | array otherwise.
 */
export function useLive(make, deps) {
  const [state, setState] = useState({ data: undefined, error: null });
  useEffect(() => {
    const target = make();
    if (!target) { setState({ data: undefined, error: null }); return undefined; }
    return onSnapshot(
      target,
      (snap) => setState({
        data: snap.docs
          ? snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          : snap.exists() ? { id: snap.id, ...snap.data() } : null,
        error: null,
      }),
      (error) => setState({ data: undefined, error })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
