import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined while Firebase restores the session
  const [account, setAccount] = useState(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) { setAccount(null); return undefined; }
    return onSnapshot(doc(db, "users", user.uid), (s) => setAccount(s.exists() ? { id: s.id, ...s.data() } : null));
  }, [user]);

  return <AuthContext.Provider value={{ user, account, loading: user === undefined }}>{children}</AuthContext.Provider>;
}
