'use client'; 
import { UserButton } from "@clerk/nextjs";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 border border-[#E4E4E7] dark:border-gray-700 bg-white dark:bg-gray-800 w-full h-[56px] flex justify-between z-50 transition-colors">
      <div className="flex items-center gap-2 ml-[20px] group">
  <div className="relative">
    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
    <div className="absolute inset-0 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
  </div>
  <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
    Quiz App
  </span>
</div>
      <div className="flex items-center gap-4 mr-[20px]">
        <DarkModeToggle />
        <UserButton  />
      </div>
    </div>
  );
}