"use client";
import { UserButton } from "@clerk/nextjs";
import HistoryIcon from "../icon/HistoryIcon";
import { Trash2, FileText } from "lucide-react";
import HistoryIconDark from "../icon/HistoryIconDark";
import { useState, useEffect } from "react";

type Article = {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  articles: Article[];
  selectedArticleId: string | null;
  onSelectArticle: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
};

export default function Sidebar({
  isOpen,
  onClose,
  onOpen,
  articles,
  selectedArticleId,
  onSelectArticle,
  onDeleteArticle
}: SidebarProps) {
  const [isDark, setIsDark] = useState(false);

  // Dark mode шалгах useEffect нэмэх
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('mn-MN');
  };

  return (
    <>
      {/* 1. Sidebar ХААЛТТАЙ ҮЕД харагдах нарийн хэсэг (72px) */}
      {!isOpen && (
        <div className="w-[72px] h-[calc(100vh-56px)] border-r border-r-[#E4E4E7] dark:border-r-gray-700 bg-white dark:bg-gray-800 fixed top-[56px] left-0 z-30 transition-colors">
          <button
            onClick={onOpen}
            className="w-full flex justify-center mt-4 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            {isDark ? <HistoryIconDark /> : <HistoryIcon />}
          </button>
        </div>
      )}

      {/* 2. Sidebar НЭЭЛТТЭЙ ҮЕД харагдах үндсэн хэсэг (256px) */}
      <div
        className={`fixed top-[56px] left-0 h-[calc(100vh-56px)] bg-[#f9f9f9] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 transform transition-all duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header хэсэг */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                History
              </p>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {isDark ? <HistoryIconDark /> : <HistoryIcon />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {articles.length} Article
            </p>
          </div>

          {/* Нийтлэлүүдийн жагсаалт */}
          <div 
            className="flex-1 overflow-y-auto p-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {articles.length === 0 ? (
              <div className="text-center py-8 px-4">
                <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Нийтлэл байхгүй байна</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Эхний нийтлэлээ үүсгээрэй
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      selectedArticleId === article.id
                        ? "bg-white dark:bg-gray-700 border border-neutral-300 dark:border-gray-600"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => onSelectArticle(article.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {article.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(article.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteArticle(article.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                        title="Устгах"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {article.content.substring(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Хэрэглэгчийн мэдээлэл */}
          <div className="border-t dark:border-gray-700 pt-4 p-4 flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Миний бүртгэл</span>
          </div>
        </div>
      </div>
    </>
  );
}