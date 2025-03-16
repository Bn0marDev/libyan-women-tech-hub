
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import WelcomeMessage from "@/components/WelcomeMessage";
import { lazy, Suspense } from "react";

// استخدام التحميل المتأخر للمكونات الثقيلة
const PostList = lazy(() => import("@/components/posts/PostList"));

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <WelcomeMessage />
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg dark:bg-gray-700 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
            </div>
          }>
            <PostList />
          </Suspense>
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
