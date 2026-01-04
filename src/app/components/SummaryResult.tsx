'use client';

type Props = {
  title: string;
  summary: string;
  onEdit: () => void;
  onTakeQuiz: () => void;
  loadingQuiz: boolean;
};

export function SummaryResult({ title, summary, onEdit, onTakeQuiz, loadingQuiz }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="text-sm text-neutral-700 dark:text-gray-300 leading-relaxed">
        {summary}
      </p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={onTakeQuiz}
          disabled={loadingQuiz}
          className="rounded-md bg-black dark:bg-white px-3 py-1.5 text-xs text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 transition-colors"
        >
          {loadingQuiz ? 'Loading...' : 'Take a quiz'}
        </button>

        <button
          onClick={onEdit}
          className="rounded-md border border-neutral-300 dark:border-gray-600 px-3 py-1.5 text-xs text-gray-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors"
        >
          Edit article
        </button>
      </div>
    </div>
  );
}