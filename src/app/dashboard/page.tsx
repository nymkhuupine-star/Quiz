'use client';

import { useState, useEffect } from 'react';
import ArticleGenerator from "../components/ArticleGenerator";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { SparklesCore } from '@/components/ui/sparkles';
import { MessageCircle } from "lucide-react";



type Article = {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
};

function ColorfulSparklesOverlay() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  
  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(-5px, 5px); }
          75% { transform: translate(-10px, -5px); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.4; filter: blur(2px); }
          50% { opacity: 1; filter: blur(4px); }
        }
      `}</style>
      {Array.from({ length: 80 }).map((_, i) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomSize = Math.random() * 4 + 2;
        const randomDelay = Math.random() * 3;
        const randomDuration = Math.random() * 4 + 3;
        
        return (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${randomX}%`,
              top: `${randomY}%`,
              width: `${randomSize}px`,
              height: `${randomSize}px`,
              backgroundColor: randomColor,
              boxShadow: `0 0 ${randomSize * 4}px ${randomColor}, 0 0 ${randomSize * 8}px ${randomColor}`,
              animation: `float ${randomDuration}s ease-in-out infinite, glow ${randomDuration * 0.8}s ease-in-out infinite`,
              animationDelay: `${randomDelay}s`,
            }}
          />
        );
      })}
    </>
  );
}

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
    const [openChat, setOpenChat] = useState(false);




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

  useEffect(() => {
    const stored = localStorage.getItem("articles");
    if (stored) {
      try {
        const parsedArticles = JSON.parse(stored);
        setArticles(parsedArticles);
      } catch (error) {
        console.error("localStorage-аас уншихад алдаа гарлаа:", error);
        setArticles([]);
      }
    }
  }, []);

  const handleArticleCreated = () => {
    const stored = localStorage.getItem("articles");
    if (stored) {
      try {
        setArticles(JSON.parse(stored));
      } catch (error) {
        console.error("Articles шинэчлэхэд алдаа гарлаа:", error);
      }
    }
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    console.log("Сонгогдсон нийтлэл:", articleId);
  };

  const handleDeleteArticle = (articleId: string) => {
    const updatedArticles = articles.filter(a => a.id !== articleId);
    localStorage.setItem("articles", JSON.stringify(updatedArticles));
    setArticles(updatedArticles);

    if (selectedArticleId === articleId) {
      setSelectedArticleId(null);
    }

    console.log("Нийтлэл устгагдлаа:", articleId);
  };

  return (
   <div className="relative min-h-screen bg-neutral-100 dark:bg-gray-900 overflow-hidden transition-colors">

    <div className="absolute inset-0 z-0">
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gray-900" />
          <SparklesCore
            background="transparent"
            particleColor="#FFFFFF"
            minSize={1}
            maxSize={3}
            particleDensity={80}
            speed={1.5}
            className="absolute inset-0"
          />
          <ColorfulSparklesOverlay />
        </>
      ) : (
        <SparklesCore
          background="transparent"
          particleColor="#374151"
          minSize={1}
          maxSize={2}
          particleDensity={120}
          speed={1}
          className="absolute inset-0"
        />
      )}
    </div>
      
      <div className="relative z-10">
        <Header />

        <div className="flex flex-row pt-[56px]">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpen={() => setIsSidebarOpen(true)}
            articles={articles}
            selectedArticleId={selectedArticleId}
            onSelectArticle={handleSelectArticle}
            onDeleteArticle={handleDeleteArticle}
          />

          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-56px)] py-[100px]">
            <ArticleGenerator
              hasSidebar={isSidebarOpen}
              onArticleCreated={handleArticleCreated}
              selectedArticleId={selectedArticleId}
            />
          </div>
      
        </div>
      </div>
    </div>
  );
}