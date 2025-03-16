
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, User, Settings, Home } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const Navbar = () => {
  const { user, profile, signOut, isAdmin, isVerified } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (profile && profile.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return "UN";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-lg bg-white bg-opacity-30 dark:bg-gray-900 dark:bg-opacity-30 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-primary">منصة المرأة الليبية في التكنولوجيا</h1>
            </Link>
          </div>

          {/* قائمة سطح المكتب */}
          <div className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Button variant="ghost" asChild>
                  <Link to="/">الرئيسية</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      {isVerified && (
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <span className="text-[8px] text-white">✓</span>
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {profile?.username}
                      {isAdmin && <span className="mr-2 text-primary text-xs">(مشرف)</span>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>لوحة التحكم</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>لوحة الإدارة</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button onClick={() => navigate("/auth")}>تسجيل الدخول</Button>
            )}
          </div>

          {/* زر القائمة للموبايل */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <Button variant="ghost" onClick={toggleMobileMenu} size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 py-2 px-4 shadow-lg">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.username}</p>
                  {isAdmin && <span className="text-primary text-xs">(مشرف)</span>}
                </div>
              </div>
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                <span>الرئيسية</span>
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                <span>لوحة التحكم</span>
              </Button>
              {isAdmin && (
                <Button variant="ghost" onClick={() => navigate("/admin")} className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>لوحة الإدارة</span>
                </Button>
              )}
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          ) : (
            <Button variant="default" onClick={() => navigate("/auth")} className="w-full">
              تسجيل الدخول
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
