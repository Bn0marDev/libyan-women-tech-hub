
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

// تمكين الوقت الفعلي (Realtime) للمنشورات والإعجابات
const enableRealtimeForTables = async () => {
  try {
    // إضافة الجداول للنشر الوقت الفعلي باستخدام channels
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts' 
      }, payload => {
        console.log('منشور جديد:', payload);
      })
      .subscribe();
    
    const likesChannel = supabase
      .channel('public:likes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'likes' 
      }, payload => {
        console.log('إعجاب جديد:', payload);
      })
      .subscribe();
    
    const commentsChannel = supabase
      .channel('public:comments')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'comments' 
      }, payload => {
        console.log('تعليق جديد:', payload);
      })
      .subscribe();
    
    console.log('تم تفعيل الوقت الفعلي');
  } catch (error) {
    console.error('خطأ في تفعيل الوقت الفعلي:', error);
  }
};

const queryClient = new QueryClient();

// إضافة تأثير لتحميل وضع السمة من localStorage
const applyTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
};

const App = () => {
  useEffect(() => {
    applyTheme();
    
    // إضافة اتجاه RTL للمستند
    document.documentElement.dir = "rtl";
    document.body.classList.add("font-sans");
    
    // تفعيل الوقت الفعلي
    enableRealtimeForTables();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
