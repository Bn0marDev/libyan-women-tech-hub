
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // التحقق من حالة المصادقة عند تحميل التطبيق
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        // الحصول على المستخدم الحالي
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // الحصول على ملف المستخدم الشخصي
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          
          setProfile(profile);
        }
      } catch (error) {
        console.error("خطأ أثناء التحقق من المستخدم:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // إعداد مستمع لتغييرات حالة المصادقة
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        
        setProfile(profile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // تسجيل الدخول
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "خطأ غير متوقع",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  // إنشاء حساب جديد
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // التحقق من وجود اسم المستخدم
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (existingUser) {
        toast({
          title: "اسم المستخدم موجود بالفعل",
          description: "يرجى اختيار اسم مستخدم آخر",
          variant: "destructive",
        });
        return { error: { message: "اسم المستخدم موجود بالفعل" } };
      }

      // إنشاء المستخدم
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: {
          data: {
            username
          }
        }
      });
      
      if (error) {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول إلى حسابك",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "خطأ غير متوقع",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  // تسجيل الخروج
  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "تم تسجيل الخروج بنجاح",
    });
  };

  const value = {
    user,
    profile,
    isAdmin: profile?.is_admin || false,
    isVerified: profile?.is_verified || false,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("يجب استخدام useAuth داخل AuthProvider");
  }
  return context;
};
