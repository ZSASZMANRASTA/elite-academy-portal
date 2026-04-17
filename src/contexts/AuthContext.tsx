import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: { full_name: string; class: string | null; subject: string | null; approved: boolean;  } | null;
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
    try {
      // Fetch profile including the role column
      const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, class, subject, approved, role")
          .eq("id", userId)
          .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      } else if (profileData) {
        setProfile(profileData);

        // Use the role from profiles table directly
        const userRole = profileData.role || "student";
        setRole(userRole);

        // Handle admin impersonation if applicable
        if (userRole === "admin") {
          const selected = sessionStorage.getItem("selected_login_role") as AppRole | null;
          if (selected && ["student", "teacher", "admin"].includes(selected)) {
            setImpersonatedRole(selected);
          } else {
            setImpersonatedRole(null);
          }
        } else {
          setImpersonatedRole(null);
        }
      }
    } catch (err) {
      console.error("Error fetching profile and role:", err);
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
    sessionStorage.removeItem("selected_login_role");
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setImpersonatedRole(null);
  };

  const handleSetImpersonatedRole = (newRole: AppRole) => {
    sessionStorage.setItem("selected_login_role", newRole);
    setImpersonatedRole(newRole);
  };

  const effectiveRole = role === "admin" && impersonatedRole ? impersonatedRole : role;
  const isImpersonating = role === "admin" && impersonatedRole !== null && impersonatedRole !== "admin";

  return (
    <AuthContext.Provider value={{
      session, user, profile,
      role: effectiveRole,
      actualRole: role,
      isImpersonating,
      loading, signOut,
      setImpersonatedRole: handleSetImpersonatedRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
