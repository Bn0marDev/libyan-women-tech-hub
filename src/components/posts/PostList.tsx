
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import PostItem from "./PostItem";

const PostList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    fetchPosts();
    
    // إعداد مستمع للتغييرات في الوقت الفعلي
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts' 
      }, (payload) => {
        console.log('تغيير في المنشورات:', payload);
        fetchPosts();
      })
      .subscribe();
      
    const likesChannel = supabase
      .channel('public:likes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'likes' 
      }, (payload) => {
        console.log('تغيير في الإعجابات:', payload);
        fetchPosts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      // تعديل الاستعلام ليتضمن معلومات ما إذا كان المستخدم الحالي قد أعجب بالمنشور
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (id, username, avatar_url, is_verified)
        `)
        .order("created_at", { ascending: false });
        
      // إضافة معلومات الإعجابات للمستخدم الحالي إذا كان مسجلاً
      const { data, error } = await query;
      
      if (error) throw error;
      
      let postsWithLikes = data || [];
      
      // إذا كان المستخدم مسجلاً، سنضيف معلومات الإعجابات
      if (user) {
        const { data: userLikes, error: likesError } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id);
          
        if (!likesError && userLikes) {
          const userLikedPostIds = userLikes.map(like => like.post_id);
          postsWithLikes = postsWithLikes.map(post => ({
            ...post,
            user_has_liked: userLikedPostIds.includes(post.id)
          }));
        }
      }
      
      setPosts(postsWithLikes);
    } catch (error: any) {
      console.error("خطأ في جلب المنشورات:", error.message);
      toast({
        title: "خطأ في جلب المنشورات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingPosts(false);
    }
  };

  return (
    <>
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
              whileHover={{ y: -5 }}
            >
              <PostItem post={post} onLike={fetchPosts} />
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
};

export default PostList;
