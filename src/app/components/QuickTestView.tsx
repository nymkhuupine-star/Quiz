"use client";

import { CheckCircle, XCircle, RotateCcw, Bookmark, ArrowLeft } from "lucide-react";
import { useState } from "react";
import XCircleIcon from "../icon/XCircleIcon";
import CheckCircleIcon from "../icon/CheckCircleIcon";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

type Props = {
  questions: Question[];
  onBack: () => void;
};

export default function QuickTestView({ questions, onBack }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);

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

  // ====== ҮР ДҮН ХАРУУЛАХ ======
 if (showResults) {
  const score = calculateScore();

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          ✨ Quiz completed
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Let's see what you did</p>
      </div>

      {/* Score - Fixed */}
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Your score:{" "}
          <span className="font-semibold">
            {score}
          </span>{" "}
          / {questions.length}
        </h2>
      </div>

      {/* Scrollable Result List */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 max-h-[500px]">
        <div className="space-y-4">
          {questions.map((item, index) => {
            const userAnswer = selectedAnswers[index];
            const isCorrect = userAnswer === item.correctAnswer;

            return (
              <div key={index} className="flex gap-3">
                {/* Icon */}
                {isCorrect ? (
                  <CheckCircleIcon className="mt-1 text-green-500 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="mt-1 text-red-500 dark:text-red-400 flex-shrink-0" />
                )}

                {/* Content */}
                <div className="text-sm flex-1">
                  {/* Question */}
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    {index + 1}. {item.question}
                  </p>

                  {/* Your answer */}
                  {userAnswer !== null && (
                    <p className="text-gray-600 dark:text-gray-400">
                      Your answer:{" "}
                      <span
                        className={
                          isCorrect
                            ? "text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300 font-medium"
                        }
                      >
                        {item.options[userAnswer]}
                      </span>
                    </p>
                  )}

                  {/* Correct answer (only if wrong) */}
                  {!isCorrect && (
                    <p className="text-green-600 dark:text-green-400 mt-1">
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

      {/* Actions - Fixed at bottom */}
      <div className="flex-shrink-0 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <RotateCcw size={16} />
          Restart quiz
        </button>

        <button
          onClick={onBack}
          className="ml-auto flex items-center gap-2 rounded-lg bg-black dark:bg-white px-4 py-2 text-sm text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition"
        >
          <Bookmark size={16} />
          Save and leave
        </button>
      </div>
    </div>
  );
}

  // ====== АСУУЛТ ХАРУУЛАХ ======
  const currentQ = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            ✨ Quick test
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Take a quick test about your knowledge from your content
          </p>
        </div>

        <button
          onClick={onBack}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 text-sm transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Progress */}
      <div className="flex justify-end text-sm text-gray-400 dark:text-gray-500 mb-4">
        {currentQuestion + 1} / {questions.length}
      </div>

      {/* Question */}
      <h2 className="text-base font-medium text-gray-900 dark:text-white mb-4">
        {currentQ.question}
      </h2>

      {/* Answers */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {currentQ.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(index)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition text-left ${
              selectedAnswer === index
                ? "border-black dark:border-white bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="rounded-xl bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {currentQuestion === questions.length - 1 ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}