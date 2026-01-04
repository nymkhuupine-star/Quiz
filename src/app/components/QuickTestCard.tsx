"use client";

import { X, CheckCircle, XCircle, RotateCcw, Bookmark } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

type Props = {
  questions: Question[];
  onClose: () => void;
};

export default function QuickTestCard({ questions, onClose }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
  };

  const calculateScore = () => {
    return selectedAnswers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
  };

  if (showResults) {
    const score = calculateScore();

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              ✨ Quiz completed
            </h1>
            <p className="text-sm text-gray-500">Let's see what you did</p>
          </div>

          <div className="border rounded-xl p-4">
            <h2 className="font-medium text-lg mb-4">
              Your score: <span className="font-semibold">{score}</span> / {questions.length}
            </h2>

            <div className="space-y-4">
              {questions.map((item, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === item.correctAnswer;

                return (
                  <div key={index} className="flex gap-3">
                    {isCorrect ? (
                      <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                    ) : (
                      <XCircle className="text-red-500 mt-1 flex-shrink-0" size={20} />
                    )}

                    <div className="text-sm flex-1">
                      <p className="font-medium mb-1">
                        {index + 1}. {item.question}
                      </p>

                      {userAnswer !== null && (
                        <p className="text-gray-600">
                          Your answer:{" "}
                          <span className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                            {item.options[userAnswer]}
                          </span>
                        </p>
                      )}

                      {userAnswer === null && (
                        <p className="text-gray-500 italic">
                          You didn't answer this question
                        </p>
                      )}

                      {!isCorrect && (
                        <p className="text-green-600">
                          Correct:{" "}
                          <span className="font-medium">
                            {item.options[item.correctAnswer]}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 transition"
            >
              <RotateCcw size={16} />
              Restart quiz
            </button>

            <button
              onClick={onClose}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition"
            >
              <Bookmark size={16} />
              Save and leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[520px] rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              ✨ Quick test
            </h3>
            <p className="text-sm text-gray-500">
              Take a quick test about your knowledge from your content
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 flex justify-end text-sm text-gray-400">
          {currentQuestion + 1} / {questions.length}
        </div>

        {/* Question */}
        <h2 className="mt-2 text-base font-medium text-gray-900">
          {currentQ.question}
        </h2>

        {/* Animated Answer Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {currentQ.options.map((option, idx) => (
            <div
              key={idx}
              className="relative group block h-full w-full"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleSelectAnswer(idx)}
            >
              <AnimatePresence>
                {hoveredIndex === idx && (
                  <motion.span
                    className="absolute inset-0 h-full w-full bg-neutral-100 block rounded-xl"
                    layoutId="hoverBackground"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.15 },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.15, delay: 0.2 },
                    }}
                  />
                )}
              </AnimatePresence>
              
              <div
                className={cn(
                  "rounded-xl h-full w-full p-4 overflow-hidden border cursor-pointer transition relative z-20",
                  selectedAnswer === idx
                    ? "border-black bg-gray-50 text-gray-900"
                    : "border-gray-200 text-gray-700 group-hover:border-black"
                )}
              >
                <div className="relative z-50">
                  <p className="text-sm font-medium">{option}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}