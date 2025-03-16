
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  hasUnreadNotifications: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setHasUnreadNotifications(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setNotifications(data || []);
      setHasUnreadNotifications(data?.some(notif => !notif.read) || false);
    } catch (error) {
      console.error("خطأ في جلب الإشعارات:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
        
      if (error) throw error;
      
      // تحديث الحالة المحلية
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      
      // تحديث مؤشر الإشعارات غير المقروءة
      setHasUnreadNotifications(notifications.some(notif => notif.id !== notificationId && !notif.read));
    } catch (error) {
      console.error("خطأ في تحديث حالة الإشعار:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
        
      if (error) throw error;
      
      // تحديث الحالة المحلية
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setHasUnreadNotifications(false);
      
      toast({
        title: "تم تحديد جميع الإشعارات كمقروءة"
      });
    } catch (error) {
      console.error("خطأ في تحديث حالة الإشعارات:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    if (user) {
      // الاستماع للإشعارات الجديدة
      const notificationsChannel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { 
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [user]);

  const value = {
    notifications,
    hasUnreadNotifications,
    markAsRead,
    markAllAsRead,
    loading
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("يجب استخدام useNotifications داخل NotificationProvider");
  }
  return context;
};
