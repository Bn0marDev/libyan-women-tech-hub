
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchComments();
    
    // إعداد مستمع للتغييرات في الوقت الفعلي للتعليقات
    const commentsChannel = supabase
      .channel('public:comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, () => {
        fetchComments();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [postId]);

  const fetchComments = async () => {
    setLoadingComments(true);
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
      setComments(data || []);
    } catch (error: any) {
      console.error("خطأ في جلب التعليقات:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "يرجى تسجيل الدخول",
        description: "يجب أن تكون مسجل الدخول لإضافة تعليق",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment,
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
        setNewComment("");
        await fetchComments();
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة التعليق",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
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
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "إرسال"
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* قائمة التعليقات */}
      {loadingComments ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          لا توجد تعليقات بعد. كن أول من يعلق!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
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
                      <span className="mr-1 text-yellow-500">
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
  );
};

export default CommentSection;
