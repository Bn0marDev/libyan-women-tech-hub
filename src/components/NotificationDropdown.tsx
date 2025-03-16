
import { formatDistanceToNow } from "date-fns";
import { arAR } from "date-fns/locale";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationDropdown() {
  const { notifications, hasUnreadNotifications, markAsRead, markAllAsRead, loading } = useNotifications();

  // تنسيق التاريخ بشكل نسبي (مثل "منذ 3 دقائق")
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: arAR
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative" size="icon">
          <Bell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[450px] overflow-y-auto">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllAsRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md mb-2"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            لا توجد إشعارات جديدة
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="w-full">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-left">
                  {formatDate(notification.created_at)}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
