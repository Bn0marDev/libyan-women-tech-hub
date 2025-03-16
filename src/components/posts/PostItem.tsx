
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GlassCard from "@/components/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import CommentSection from "./CommentSection";

interface PostItemProps {
  post: any;
  onLike: () => void;
}

const PostItem = ({ post, onLike }: PostItemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "يرجى تسجيل الدخول",
        description: "يجب أن تكون مسجل الدخول لإضافة إعجاب",
        variant: "destructive",
      });
      return;
    }

    setLoadingLike(true);
    try {
      // التحقق من وجود إعجاب سابق
      const { data: existingLike, error: fetchError } = await supabase
        .from("likes")
        .select("*")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
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
      } else {
        // إضافة إعجاب
        const { error } = await supabase
          .from("likes")
          .insert({
            post_id: post.id,
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
        }
      }
      
      // تحديث قائمة المنشورات بعد الإعجاب
      onLike();
    } catch (error: any) {
      console.error("خطأ في تحديث الإعجاب:", error.message);
      toast({
        title: "خطأ في تحديث الإعجاب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingLike(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <GlassCard className="overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start mb-4">
          <Avatar className="h-10 w-10 ml-3">
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
                <span className="mr-1 text-yellow-500">
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
            onClick={handleLike}
            disabled={loadingLike}
            className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
          >
            {loadingLike ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Heart className={`h-4 w-4 ml-2 ${post.user_has_liked ? "fill-red-500 text-red-500" : "fill-none"}`} />
            )}
            {post.likes_count || 0}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
            className="text-gray-600 dark:text-gray-300"
          >
            <MessageCircle className="h-4 w-4 ml-2" />
            التعليقات
          </Button>
        </div>
      </div>
      
      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </GlassCard>
  );
};

export default PostItem;
