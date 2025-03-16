
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GlassCard from "@/components/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, MessageCircle, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [loadingLikes, setLoadingLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (id, username, avatar_url, is_verified)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
      
      // تحميل التعليقات للمنشورات الأولى
      if (data && data.length > 0) {
        const firstPosts = data.slice(0, 5);
        firstPosts.forEach(post => {
          fetchComments(post.id);
        });
      }
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

  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (username, avatar_url, is_verified)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error: any) {
      console.error("خطأ في جلب التعليقات:", error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!user) {
      toast({
        title: "يرجى تسجيل الدخول",
        description: "يجب أن تكون مسجل الدخول لإضافة تعليق",
        variant: "destructive",
      });
      return;
    }

    if (!newComment[postId]?.trim()) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment[postId],
        });
      
      if (error) {
        if (error.message.includes("violates row-level security")) {
          toast({
            title: "غير مصرح",
            description: "لا يمكنك التعليق لأن حسابك محظور",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // مسح التعليق الجديد
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        // إعادة تحميل التعليقات
        await fetchComments(postId);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة التعليق",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "يرجى تسجيل الدخول",
        description: "يجب أن تكون مسجل الدخول لإضافة إعجاب",
        variant: "destructive",
      });
      return;
    }

    setLoadingLikes(prev => ({ ...prev, [postId]: true }));
    try {
      // التحقق من وجود إعجاب سابق
      const { data: existingLike, error: fetchError } = await supabase
        .from("likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();
      
      if (fetchError && !fetchError.message.includes("No rows found")) {
        throw fetchError;
      }

      if (existingLike) {
        // إزالة الإعجاب
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("id", existingLike.id);
        
        if (error) throw error;
        
        // تحديث المنشورات
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count - 1, user_has_liked: false } 
            : post
        ));
      } else {
        // إضافة إعجاب
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        
        if (error) {
          if (error.message.includes("violates row-level security")) {
            toast({
              title: "غير مصرح",
              description: "لا يمكنك الإعجاب لأن حسابك محظور",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          // تحديث المنشورات
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, likes_count: post.likes_count + 1, user_has_liked: true } 
              : post
          ));
        }
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الإعجاب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingLikes(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              منصة المرأة الليبية في التكنولوجيا
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              منصة تعليمية وتفاعلية لتمكين النساء الليبيات في مجالات التكنولوجيا
            </p>
            
            {!user && (
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                انضمي إلينا
              </Button>
            )}
          </div>
          
          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 mb-4">لا توجد منشورات حتى الآن</p>
              {user && (
                <Button onClick={() => navigate("/dashboard")}>
                  إنشاء أول منشور
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <GlassCard className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start mb-4">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={post.profiles.avatar_url} />
                          <AvatarFallback>
                            {post.profiles.username?.substring(0, 2).toUpperCase() || "UN"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <Link to={`/profile/${post.profiles.id}`} className="font-medium hover:underline">
                              {post.profiles.username}
                            </Link>
                            {post.profiles.is_verified && (
                              <span className="ml-1 text-yellow-500">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString("ar-LY", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
                      <p className="text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          disabled={loadingLikes[post.id]}
                          className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
                        >
                          {loadingLikes[post.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Heart className={`h-4 w-4 mr-2 ${post.user_has_liked ? "fill-red-500 text-red-500" : "fill-none"}`} />
                          )}
                          {post.likes_count}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!comments[post.id]) {
                              fetchComments(post.id);
                            }
                          }}
                          className="text-gray-600 dark:text-gray-300"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {comments[post.id]?.length || 0} تعليق
                        </Button>
                      </div>
                    </div>
                    
                    {/* قسم التعليقات */}
                    {comments[post.id] && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium mb-4">التعليقات</h3>
                        
                        {/* إضافة تعليق جديد */}
                        {user && (
                          <div className="flex items-start space-x-3 rtl:space-x-reverse mb-6">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback>
                                {profile?.username?.substring(0, 2).toUpperCase() || "UN"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex items-end gap-2">
                              <Input
                                placeholder="أضف تعليقًا..."
                                value={newComment[post.id] || ""}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment(post.id);
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSubmitComment(post.id)}
                                disabled={submittingComment[post.id] || !newComment[post.id]?.trim()}
                              >
                                {submittingComment[post.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "إرسال"
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* قائمة التعليقات */}
                        {loadingComments[post.id] ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : comments[post.id]?.length === 0 ? (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            لا توجد تعليقات بعد. كن أول من يعلق!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex items-start space-x-3 rtl:space-x-reverse">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.profiles.avatar_url} />
                                  <AvatarFallback>
                                    {comment.profiles.username?.substring(0, 2).toUpperCase() || "UN"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                                    <div className="flex items-center mb-1">
                                      <p className="font-medium text-sm">
                                        {comment.profiles.username}
                                      </p>
                                      {comment.profiles.is_verified && (
                                        <span className="ml-1 text-yellow-500">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-200 text-sm">
                                      {comment.content}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(comment.created_at).toLocaleDateString("ar-LY", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800 bg-white bg-opacity-30 dark:bg-gray-900 dark:bg-opacity-30 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            &copy; {new Date().getFullYear()} منصة المرأة الليبية في التكنولوجيا. جميع الحقوق محفوظة.
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            تم تطويره بواسطة mousa0mar
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
