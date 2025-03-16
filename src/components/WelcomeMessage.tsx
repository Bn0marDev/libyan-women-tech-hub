
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const WelcomeMessage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.div 
      className="mb-12 text-right"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        منصة المرأة الليبية في التكنولوجيا
      </h1>
      
      <div className="bg-white bg-opacity-30 dark:bg-gray-900 dark:bg-opacity-30 backdrop-blur-md p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-8">
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          <p className="text-xl mb-2">
            🌟 <strong>أهلاً وسهلاً في منصة المرأة الليبية في التكنولوجيا!</strong> 🌟
          </p>
          
          <p>
            نحن هنا لإنشاء مساحة تفاعلية وداعمة لجميع النساء الليبيات المهتمات بالتكنولوجيا. منصتنا تهدف إلى <strong>تبادل الأفكار، الأكواد، مصادر الكورسات</strong>، وكل ما يساعدنا في تطوير مهاراتنا في مجالات مثل البرمجة، الذكاء الاصطناعي، الأمن السيبراني وغيرها.
          </p>
          
          <div>
            <p><strong>🎯 ما يمكنكم القيام به هنا:</strong></p>
            <ul className="list-disc list-inside mr-4 mt-2 space-y-1">
              <li><strong>تبادل الأكواد</strong> والمشاريع البرمجية.</li>
              <li><strong>مشاركة مصادر الكورسات</strong> والدورات التعليمية.</li>
              <li><strong>مناقشة الأفكار</strong> والمشاريع وتبادل الخبرات.</li>
              <li><strong>التعاون</strong> لتحقيق منافع مشتركة وتطوير مهاراتنا كأفراد ومجتمع.</li>
            </ul>
          </div>
          
          <p>
            💡 المنصة هي مكان مفتوح للتعلم المشترك، حيث يمكننا تبادل المعرفة، التعاون، ودعم بعضنا البعض لتحقيق النجاح والنمو في مجال التكنولوجيا.
          </p>
          
          <p>
            📚 لا تترددوا في مشاركة أفكاركم، الأكواد، ومواردكم المفضلة. نريد أن يكون هذا المجتمع مكانًا حيويًا وملهمًا لكل من يرغب في التطور في عالم التكنولوجيا.
          </p>
          
          <p>
            ✨ <strong>مرحبًا بكم في مجتمعنا الرائع!</strong>
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            #المرأة_الليبية #التكنولوجيا #البرمجة #الذكاء_الاصطناعي #الأمن_السيبراني #التعلم
          </p>
        </div>
      </div>
      
      {!user && (
        <Button 
          onClick={() => navigate("/auth")} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          انضمي إلينا
        </Button>
      )}
    </motion.div>
  );
};

export default WelcomeMessage;
