import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isInitialized: boolean;
  isConfigured: boolean;
  
  // Actions
  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string, avatarUrl: string) => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isInitialized: false,
  isConfigured: isSupabaseConfigured,

  initialize: () => {
    if (get().isInitialized) return;

    if (!isSupabaseConfigured) {
      // Mock initialization using localStorage
      const savedUser = localStorage.getItem("posean_mock_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        set({ user: parsed, profile: parsed, loading: false, isInitialized: true });
      } else {
        set({ user: null, profile: null, loading: false, isInitialized: true });
      }
      return;
    }

    // Supabase subscription
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      if (session) {
        const user = session.user;
        set({ user });
        get().checkSession();
      } else {
        set({ user: null, profile: null, loading: false, isInitialized: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session) {
        set({ user: session.user });
        await get().checkSession();
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });

    set({ isInitialized: true });
  },

  checkSession: async () => {
    if (!isSupabaseConfigured) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ user: null, profile: null, loading: false });
      return;
    }

    const user = session.user;
    set({ user, loading: true });

    try {
      // Fetch profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist yet, insert a basic one
        const newProfile = {
          id: user.id,
          email: user.email || "",
          display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || "",
        };

        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        if (!insertError) {
          set({ profile: inserted as Profile });
        }
      } else if (!error) {
        set({ profile: profile as Profile });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      // Mock Google sign in
      const mockUser: Profile = {
        id: "mock_google_user",
        email: "google.demo@posean.com",
        display_name: "Google Explorer",
        avatar_url: "https://lh3.googleusercontent.com/a/default-user=s96-c",
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("posean_mock_user", JSON.stringify(mockUser));
      set({ user: mockUser, profile: mockUser });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  },

  signInWithEmail: async (email, password) => {
    if (!isSupabaseConfigured) {
      // Mock email sign in
      const key = `posean_mock_reg_${email.toLowerCase()}`;
      const regUser = localStorage.getItem(key);
      
      if (!regUser) {
        throw new Error("User does not exist. Please sign up first.");
      }

      const parsed = JSON.parse(regUser);
      if (parsed.password !== password) {
        throw new Error("Invalid password.");
      }

      const userSession: Profile = {
        id: parsed.id,
        email: parsed.email,
        display_name: parsed.display_name,
        avatar_url: parsed.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${parsed.display_name}`,
        created_at: parsed.created_at,
      };

      localStorage.setItem("posean_mock_user", JSON.stringify(userSession));
      set({ user: userSession, profile: userSession });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  },

  signUpWithEmail: async (email, password, displayName) => {
    if (!isSupabaseConfigured) {
      // Mock sign up
      const key = `posean_mock_reg_${email.toLowerCase()}`;
      if (localStorage.getItem(key)) {
        throw new Error("Email already registered.");
      }

      const newMockUser = {
        id: `mock_user_${Date.now()}`,
        email,
        password,
        display_name: displayName,
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName}`,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(newMockUser));
      
      // Auto login
      const userSession: Profile = {
        id: newMockUser.id,
        email: newMockUser.email,
        display_name: newMockUser.display_name,
        avatar_url: newMockUser.avatar_url,
        created_at: newMockUser.created_at,
      };
      
      localStorage.setItem("posean_mock_user", JSON.stringify(userSession));
      set({ user: userSession, profile: userSession });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });

    if (error) throw error;
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem("posean_mock_user");
      set({ user: null, profile: null });
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null });
  },

  updateProfile: async (displayName, avatarUrl) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    if (!isSupabaseConfigured) {
      // Mock update
      const updated = {
        ...profile,
        display_name: displayName,
        avatar_url: avatarUrl,
      };
      localStorage.setItem("posean_mock_user", JSON.stringify(updated));
      
      const key = `posean_mock_reg_${profile.email.toLowerCase()}`;
      const regDetails = localStorage.getItem(key);
      if (regDetails) {
        const parsed = JSON.parse(regDetails);
        parsed.display_name = displayName;
        parsed.avatar_url = avatarUrl;
        localStorage.setItem(key, JSON.stringify(parsed));
      }
      
      set({ user: updated, profile: updated });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    if (error) throw error;

    set({
      profile: {
        ...profile,
        display_name: displayName,
        avatar_url: avatarUrl,
      },
    });
  },
}));
