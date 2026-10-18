import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function defaultAccount(user) {
  return {
    fullName: user.displayName || user.email?.split("@")[0] || "Student",
    email: user.email || "",
    userRole: "Student",
    createdAt: serverTimestamp(),
    profile: {
      department: "",
      yearOfStudy: 1,
      experienceLevel: "Beginner",
      bio: "",
    },
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined while Firebase restores the session
  const [account, setAccount] = useState(null);
  const [accountReady, setAccountReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => onAuthStateChanged(
    auth,
    (nextUser) => {
      setAuthError(null);
      setAccount(null);
      setAccountReady(!nextUser);
      setUser(nextUser);
    },
    (error) => {
      console.error("Authentication state error:", error);
      setAuthError(error);
      setUser(null);
    },
  ), []);

  useEffect(() => {
    // account/accountReady are reset in the auth listener above whenever the user changes.
    if (!user) return undefined;

    const accountRef = doc(db, "users", user.uid);
    return onSnapshot(
      accountRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setAccount({ id: snapshot.id, ...snapshot.data() });
          setAccountReady(true);
          return;
        }

        // Bootstrap profiles for accounts created before a profile document existed.
        // This also gives new sign-ups a valid document that Profile can complete.
        try {
          await setDoc(accountRef, defaultAccount(user));
        } catch (error) {
          console.error("Could not initialize user profile:", error);
          setAuthError(error);
          setAccountReady(true);
        }
      },
      (error) => {
        console.error("User profile subscription error:", error);
        setAuthError(error);
        setAccountReady(true);
      },
    );
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      account,
      loading: user === undefined || (Boolean(user) && !accountReady),
      authError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
