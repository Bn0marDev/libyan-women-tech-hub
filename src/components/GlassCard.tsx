
import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard = ({ children, className }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-white bg-opacity-20 dark:bg-gray-900 dark:bg-opacity-30",
        "border border-gray-200 dark:border-gray-800",
        "rounded-xl shadow-md overflow-hidden",
        "transition-all duration-300 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
