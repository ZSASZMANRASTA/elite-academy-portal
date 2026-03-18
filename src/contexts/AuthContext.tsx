import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { full_name: string; class: string | null; subject: string | null; approved: boolean } | null;
  role: AppRole | null;
  actualRole: AppRole | null;
  isImpersonating: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  setImpersonatedRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  actualRole: null,
  isImpersonating: false,
  loading: true,
  signOut: async () => {},
  setImpersonatedRole: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("full_name, class, subject, approved").eq("id", userId).single(),
      supabase.rpc("get_user_role", { _user_id: userId }),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    if (roleRes.data) {
      setRole(roleRes.data);
      // If admin, check for login-time role selection
      if (roleRes.data === "admin") {
        const selected = sessionStorage.getItem("selected_login_role") as AppRole | null;
        if (selected && ["student", "teacher", "admin"].includes(selected)) {
          setImpersonatedRole(selected);
        }
      } else {
        setImpersonatedRole(null);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(() => fetchProfileAndRole(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
