import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../data/supabaseClient";
import type { UserProfile } from "./permissions";

interface AuthContextValue {
  client: SupabaseClient | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  configurationMissing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    displayName: String(row.display_name || ""),
    role: row.role === "admin" ? "admin" : "sales",
    active: row.active !== false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;

    const applySession = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setError("");
      setLoading(true);
      const { data, error: profileError } = await client
        .from("profiles")
        .select("id, display_name, role, active")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (!active) return;
      if (profileError || !data) {
        setProfile(null);
        setError("账号尚未配置工作台权限，请联系管理员。");
        await client.auth.signOut();
      } else {
        const nextProfile = mapProfile(data as Record<string, unknown>);
        if (!nextProfile.active) {
          setProfile(null);
          setError("账号已停用，请联系管理员。");
          await client.auth.signOut();
        } else {
          setProfile(nextProfile);
        }
      }
      setLoading(false);
    };

    void client.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const signIn = async (email: string, password: string) => {
    if (!client) throw new Error("Supabase 尚未配置");
    setError("");
    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError("邮箱或密码错误，请重试。");
      throw signInError;
    }
  };

  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
    setProfile(null);
    setError("");
  };

  return (
    <AuthContext.Provider
      value={{
        client,
        session,
        profile,
        loading,
        error,
        configurationMissing: !client,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
