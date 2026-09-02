import { CheckCircle, XCircle } from 'lucide-react';

export default function TestAnalysis({ answers = [] }) {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  const correct = answers.filter(answer => answer.isCorrect).length;
  return (
    <details className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
      <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-200">
        Test tahlili: {correct}/{answers.length} to'g'ri
      </summary>
      <div className="mt-3 space-y-2">
        {answers.map((answer, index) => (
          <div key={`${answer.questionId || index}-${index}`} className="flex items-start gap-2 text-sm">
            {answer.isCorrect ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-green-600" /> : <XCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />}
            <div className="min-w-0">
              <div className="text-gray-700 dark:text-gray-200">{index + 1}. {answer.isCorrect ? "To'g'ri javob" : "Noto'g'ri javob"}</div>
              {!answer.isCorrect && answer.correctAnswer && <div className="text-xs text-green-700 dark:text-green-400">To'g'ri javob: {answer.correctAnswer}</div>}
              {answer.answer && <div className="text-xs text-gray-400">Sizning javobingiz: {answer.answer}</div>}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
