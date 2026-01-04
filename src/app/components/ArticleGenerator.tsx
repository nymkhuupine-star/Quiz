"use client";

import { Sparkles, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { SummaryResult } from "./SummaryResult";
import QuickTestView from "./QuickTestView";

type Article = {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
};

type ArticleGeneratorProps = {
  hasSidebar: boolean;
  onArticleCreated?: () => void;
  selectedArticleId?: string | null;
};

export default function ArticleGenerator({ 
  hasSidebar,
  onArticleCreated,
  selectedArticleId 
}: ArticleGeneratorProps) {
  const widthClass = hasSidebar ? "w-[628px]" : "w-[856px]";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Sidebar-аас сонгосон нийтлэлийг ачаалах
  useEffect(() => {
    if (selectedArticleId) {
      const articles = JSON.parse(localStorage.getItem("articles") || "[]");
      const article = articles.find((a: Article) => a.id === selectedArticleId);
      if (article) {
        setTitle(article.title);
        setContent(article.content);
        setSummary(article.summary);
        setCurrentArticleId(article.id);
        setShowQuiz(false);
      }
    }
  }, [selectedArticleId]);

  async function handleSummarize() {
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      console.log("📤 Summarize API руу хүсэлт явуулж байна...");
      
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }), 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      console.log("✅ Хураангуй амжилттай үүслээ");
      setSummary(data.summary);

      // localStorage-д хадгалах
      const newArticle: Article = {
        id: currentArticleId || Date.now().toString(),
        title: title || "Гарчиггүй нийтлэл",
        content,
        summary: data.summary,
        createdAt: new Date().toISOString()
      };

      const existingArticles = JSON.parse(localStorage.getItem("articles") || "[]");
      
      if (currentArticleId) {
        const updatedArticles = existingArticles.map((a: Article) => 
          a.id === currentArticleId ? newArticle : a
        );
        localStorage.setItem("articles", JSON.stringify(updatedArticles));
      } else {
        const updatedArticles = [newArticle, ...existingArticles];
        localStorage.setItem("articles", JSON.stringify(updatedArticles));
        setCurrentArticleId(newArticle.id);
      }

      if (onArticleCreated) {
        onArticleCreated();
      }

    } catch (error: any) {
      console.error("❌ Failed to summarize:", error);
      setError(error.message || "Хураангуйлах үйлдэл амжилтгүй боллоо");
    } finally {
      setLoading(false);
    }
  }

  const handleTakeQuiz = async () => {
    setLoadingQuiz(true);

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, title }),
      });

      if (!res.ok) {
        throw new Error('Quiz үүсгэхэд алдаа гарлаа');
      }

      const data = await res.json();
      setQuizQuestions(data.questions);
      setShowQuiz(true);
    } catch (error) {
      console.error('Quiz алдаа:', error);
      alert('Quiz үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleBackToSummary = () => {
    setShowQuiz(false);
  };

  const handleEditArticle = () => {
    setSummary("");
    setShowQuiz(false);
    setCurrentArticleId(null);
  };

  const handleNewArticle = () => {
    setTitle("");
    setContent("");
    setSummary("");
    setShowQuiz(false);
    setCurrentArticleId(null);
  };

  return (
    <div
      className={`${widthClass} rounded-lg border border-[#E4E4E7] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all duration-300`}
    >
      {/* ===== QUIZ VIEW ===== */}
      {showQuiz && quizQuestions.length > 0 ? (
        <QuickTestView
          questions={quizQuestions}
          onBack={handleBackToSummary}
        />
      ) : summary ? (
        /* ===== SUMMARY RESULT ===== */
        <div>
          <SummaryResult 
            title={title || "Гарчиггүй нийтлэл"} 
            summary={summary}
            onEdit={handleEditArticle}
            onTakeQuiz={handleTakeQuiz}
            loadingQuiz={loadingQuiz}
          />
          {/* Шинэ нийтлэл үүсгэх товч */}
          <button
            onClick={handleNewArticle}
            className="mt-4 rounded-md border border-neutral-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors"
          >
            Шинэ нийтлэл үүсгэх
          </button>
        </div>
      ) : (
        /* ===== FILL ARTICLE ===== */
        <>
          {/* Header */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-neutral-900 dark:text-white" />
              Article Quiz Generator
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-gray-400">
              Paste your article below to generate a summarize and quiz question.
              Your articles will saved in the sidebar for future reference.
            </p>
          </div>

          {/* Article Title */}
          <div className="mb-4">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Article Title
            </label>
            <input
              type="text"
              placeholder="Enter a title for your article..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#E4E4E7] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:focus:border-gray-500 transition-colors"
            />
          </div>

          {/* Article Content */}
          <div className="mb-6">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Article Content
            </label>
            <textarea
              placeholder="Paste your article content here..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-none rounded-md border border-[#E4E4E7] dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:focus:border-gray-500 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={handleSummarize}
              disabled={!content.trim() || loading}
              className="rounded-md bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              {loading ? "Summarizing..." : "Generate summary"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}