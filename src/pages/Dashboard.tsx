
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Loader2, Save, Trash2, Upload } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  username: z.string().min(3, { message: "يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل" }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل" }),
  newPassword: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل" }),
  confirmPassword: z.string().min(6, { message: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [publishingPost, setPublishingPost] = useState(false);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // إذا لم يكن المستخدم مسجل الدخول، فقم بتوجيهه إلى صفحة تسجيل الدخول
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      profileForm.setValue("username", profile.username || "");
      fetchPosts();
    }
  }, [profile]);

  const fetchPosts = async () => {
    if (!user) return;
    
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/avatar.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

      // تحميل الصورة إلى Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // الحصول على الرابط العام
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // تحديث الملف الشخصي
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // تحديث الصفحة لعرض الصورة الجديدة
      window.location.reload();

      toast({
        title: "تم تحديث الصورة الشخصية بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الصورة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      // التحقق من وجود اسم المستخدم
      if (values.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", values.username)
          .single();

        if (existingUser) {
          toast({
            title: "اسم المستخدم موجود بالفعل",
            description: "يرجى اختيار اسم مستخدم آخر",
            variant: "destructive",
          });
          return;
        }
      }

      // تحديث الملف الشخصي
      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: values.username,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الملف الشخصي بنجاح",
      });

      // تحديث الصفحة لعرض التغييرات
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الملف الشخصي",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    
    setLoadingPassword(true);
    try {
      // التحقق من كلمة المرور الحالية
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: values.currentPassword,
      });

      if (signInError) {
        toast({
          title: "كلمة المرور الحالية غير صحيحة",
          variant: "destructive",
        });
        return;
      }

      // تحديث كلمة المرور
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast({
        title: "تم تحديث كلمة المرور بنجاح",
      });

      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث كلمة المرور",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;
    
    setPublishingPost(true);
    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          title: newPostTitle,
          content: newPostContent,
        });

      if (error) throw error;

      toast({
        title: "تم نشر المنشور بنجاح",
      });

      setNewPostTitle("");
      setNewPostContent("");
      setShowNewPostDialog(false);
      await fetchPosts();
    } catch (error: any) {
      toast({
        title: "خطأ في نشر المنشور",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPublishingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "تم حذف المنشور بنجاح",
      });

      setPosts(posts.filter(post => post.id !== postId));
    } catch (error: any) {
      toast({
        title: "خطأ في حذف المنشور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4">
          <GlassCard className="p-6 md:sticky md:top-24">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile?.username?.substring(0, 2).toUpperCase() || "UN"}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white cursor-pointer"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              <h2 className="text-xl font-semibold mb-1">{profile?.username}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user?.email}</p>
              
              {profile?.is_verified && (
                <div className="flex items-center mb-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-xs">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                  حساب موثّق
                </div>
              )}
              
              {profile?.is_admin && (
                <div className="flex items-center mb-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs">
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  مشرف
                </div>
              )}
            </div>
          </GlassCard>
        </div>
        
        <div className="md:col-span-8">
          <GlassCard>
            <Tabs defaultValue="posts" className="p-6">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="posts">المنشورات</TabsTrigger>
                <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                <TabsTrigger value="password">كلمة المرور</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">منشوراتي</h3>
                  <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        منشور جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إنشاء منشور جديد</DialogTitle>
                        <DialogDescription>
                          أضف منشورًا جديدًا لمشاركته مع مجتمع المرأة الليبية في التكنولوجيا
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="post-title">عنوان المنشور</Label>
                          <Input
                            id="post-title"
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            placeholder="أدخل عنوان المنشور"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="post-content">محتوى المنشور</Label>
                          <Textarea
                            id="post-content"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="أدخل محتوى المنشور"
                            rows={5}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleCreatePost}
                          disabled={publishingPost || !newPostTitle.trim() || !newPostContent.trim()}
                        >
                          {publishingPost ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              جاري النشر...
                            </>
                          ) : (
                            "نشر المنشور"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {loadingPosts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">ليس لديك أي منشورات حتى الآن</p>
                    <Button onClick={() => setShowNewPostDialog(true)}>
                      إنشاء منشور جديد
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <GlassCard key={post.id} className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-medium">{post.title}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                          {post.content.length > 200 
                            ? `${post.content.substring(0, 200)}...` 
                            : post.content}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <span>{new Date(post.created_at).toLocaleDateString("ar-LY")}</span>
                          </div>
                          <div>
                            {post.likes_count} إعجاب
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="profile">
                <h3 className="text-xl font-semibold mb-6">تعديل الملف الشخصي</h3>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المستخدم</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="أدخل اسم المستخدم" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={loadingProfile}
                      className="w-full"
                    >
                      {loadingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="password">
                <h3 className="text-xl font-semibold mb-6">تغيير كلمة المرور</h3>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الحالية</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="أدخل كلمة المرور الحالية" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="أدخل كلمة المرور الجديدة" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="أعد إدخال كلمة المرور الجديدة" dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loadingPassword}
                    >
                      {loadingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري التحديث...
                        </>
                      ) : (
                        "تحديث كلمة المرور"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
