
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Search, ShieldAlert, ShieldCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Admin = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<"delete-post" | "ban-user" | "verify-user" | null>(null);

  useEffect(() => {
    // التحقق من أن المستخدم مسجل الدخول ولديه صلاحيات المشرف
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!profile?.is_admin) {
        navigate("/");
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات الوصول إلى لوحة الإدارة",
          variant: "destructive",
        });
      } else {
        fetchUsers();
        fetchPosts();
      }
    }
  }, [user, profile, authLoading, navigate]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في جلب المستخدمين",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (username, avatar_url, is_verified)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في جلب المنشورات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: !currentBanStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);
      
      if (error) throw error;
      
      toast({
        title: currentBanStatus ? "تم إلغاء حظر المستخدم بنجاح" : "تم حظر المستخدم بنجاح",
      });
      
      // تحديث قائمة المستخدمين
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_banned: !currentBanStatus } : u
      ));
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث حالة الحظر",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleVerify = async (userId: string, currentVerifyStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: !currentVerifyStatus, updated_at: new Date().toISOString() })
        .eq("id", userId);
      
      if (error) throw error;
      
      toast({
        title: currentVerifyStatus ? "تم إلغاء توثيق المستخدم بنجاح" : "تم توثيق المستخدم بنجاح",
      });
      
      // تحديث قائمة المستخدمين
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_verified: !currentVerifyStatus } : u
      ));
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث حالة التوثيق",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      
      if (error) throw error;
      
      toast({
        title: "تم حذف المنشور بنجاح",
      });
      
      // تحديث قائمة المنشورات
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error: any) {
      toast({
        title: "خطأ في حذف المنشور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openDialog = (actionType: "delete-post" | "ban-user" | "verify-user", itemId: string) => {
    setSelectedItemId(itemId);
    setDialogAction(actionType);
    setShowDeleteDialog(true);
  };

  const confirmAction = () => {
    if (!selectedItemId) return;

    switch (dialogAction) {
      case "delete-post":
        handleDeletePost(selectedItemId);
        break;
      case "ban-user": {
        const user = users.find(u => u.id === selectedItemId);
        if (user) handleToggleBan(selectedItemId, user.is_banned);
        break;
      }
      case "verify-user": {
        const user = users.find(u => u.id === selectedItemId);
        if (user) handleToggleVerify(selectedItemId, user.is_verified);
        break;
      }
    }

    setShowDeleteDialog(false);
    setSelectedItemId(null);
    setDialogAction(null);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.profiles.username && post.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">لوحة الإدارة</h1>
      
      <GlassCard className="mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold">مرحبًا بك، {profile?.username}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-80"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
              <h3 className="text-lg font-medium mb-2">المستخدمين</h3>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
              <h3 className="text-lg font-medium mb-2">المستخدمين الموثقين</h3>
              <p className="text-3xl font-bold">{users.filter(u => u.is_verified).length}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
              <h3 className="text-lg font-medium mb-2">المنشورات</h3>
              <p className="text-3xl font-bold">{posts.length}</p>
            </div>
          </div>
        </div>
      </GlassCard>
      
      <GlassCard>
        <Tabs defaultValue="users" className="p-6">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="posts">المنشورات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">لا توجد نتائج للبحث</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <GlassCard key={user.id} className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.username?.substring(0, 2).toUpperCase() || "UN"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">{user.username}</p>
                            {user.is_verified && (
                              <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                موثّق
                              </Badge>
                            )}
                            {user.is_admin && (
                              <Badge variant="outline" className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border-blue-300">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                مشرف
                              </Badge>
                            )}
                            {user.is_banned && (
                              <Badge variant="outline" className="ml-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 border-red-300">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                محظور
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString("ar-LY")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        {!user.is_admin && (
                          <>
                            <Button
                              variant={user.is_banned ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => openDialog("ban-user", user.id)}
                              className="flex-1 md:flex-none"
                            >
                              {user.is_banned ? "إلغاء الحظر" : "حظر"}
                            </Button>
                            <Button
                              variant={user.is_verified ? "outline" : "default"}
                              size="sm"
                              onClick={() => openDialog("verify-user", user.id)}
                              className="flex-1 md:flex-none"
                            >
                              {user.is_verified ? "إلغاء التوثيق" : "توثيق"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="posts">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">لا توجد نتائج للبحث</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <GlassCard key={post.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-medium mb-2">{post.title}</h3>
                        <div className="flex items-center mb-2">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={post.profiles.avatar_url} />
                            <AvatarFallback>
                              {post.profiles.username?.substring(0, 2).toUpperCase() || "UN"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {post.profiles.username}
                            {post.profiles.is_verified && (
                              <CheckCircle2 className="inline h-3 w-3 ml-1 text-yellow-500" />
                            )}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => openDialog("delete-post", post.id)}
                      >
                        حذف
                      </Button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>تاريخ النشر: {new Date(post.created_at).toLocaleDateString("ar-LY")}</p>
                      <p>{post.likes_count} إعجاب</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </GlassCard>
      
      {/* حوار تأكيد الإجراء */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === "delete-post" ? "تأكيد حذف المنشور" : 
               dialogAction === "ban-user" ? "تأكيد حظر/إلغاء حظر المستخدم" :
               "تأكيد توثيق/إلغاء توثيق المستخدم"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === "delete-post" ? 
                "هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء." : 
               dialogAction === "ban-user" ?
                "هل أنت متأكد من رغبتك في تغيير حالة حظر هذا المستخدم؟" :
                "هل أنت متأكد من رغبتك في تغيير حالة توثيق هذا المستخدم؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {dialogAction === "delete-post" ? "حذف" : 
               dialogAction === "ban-user" ? "تأكيد" :
               "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
