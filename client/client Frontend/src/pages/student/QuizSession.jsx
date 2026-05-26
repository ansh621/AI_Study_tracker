import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Loader2 } from "lucide-react";

const QUIZ_API_BASE_URL = "http://localhost:3000/api/quiz";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
};

const QuizSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const quiz = location.state?.quiz;
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <button onClick={() => navigate("/quiz-setup")} className="rounded-full bg-[#8f79df] px-6 py-3 font-black text-white">
          Go to Quiz Setup
        </button>
      </div>
    );
  }

  const handleAnswer = (qIndex, optionIndex) => {
    const label = ["A", "B", "C", "D"][optionIndex];
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = label;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (answers.length !== questions.length || answers.some((a) => !a)) {
      setError("Please answer all questions.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const response = await fetch(`${QUIZ_API_BASE_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          syllabusId: quiz.syllabusId,
          chapterId: quiz.chapterId,
          topicId: quiz.topicId,
          subjectName: quiz.subjectName,
          chapterTitle: quiz.chapterTitle,
          topicName: quiz.topicName,
          questions,
          answers,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit quiz");
      setResult(data.data);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 text-[#111827]">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/quiz-setup")} className="grid h-10 w-10 place-items-center rounded-full bg-[#eef1f7] text-[#6152a8]">
            <ArrowLeft size={20} />
          </button>
          <span className="text-xl font-black text-[#6b2cf5]">Focus Nest Quiz</span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e4b9a7] text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#17436f]">{quiz.subjectName}</p>
              <p className="text-sm font-bold text-[#6152a8]">{quiz.chapterTitle} - {quiz.topicName}</p>
            </div>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {result && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              Score: {result.marksObtained}/{result.maxMarks} ({result.percentage}%)
            </div>
            {result.topicMarkedCompleted && <p className="mt-1 text-xs">Topic marked complete in syllabus.</p>}
          </div>
        )}

        {questions.map((question, qIndex) => (
          <section key={`${question.question}-${qIndex}`} className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black text-[#17436f]">{qIndex + 1}. {question.question}</h2>
            <div className="mt-4 space-y-2">
              {question.options.map((option, optionIndex) => {
                const label = ["A", "B", "C", "D"][optionIndex];
                const selected = answers[qIndex] === label;
                return (
                  <button
                    key={`${label}-${option}`}
                    onClick={() => handleAnswer(qIndex, optionIndex)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                      selected
                        ? "border-[#8f79df] bg-[#f4f1ff] text-[#4e35b5]"
                        : "border-gray-100 bg-[#f8f9fc]"
                    }`}
                  >
                    {label}. {option}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <button
          onClick={handleSubmit}
          disabled={submitting || Boolean(result)}
          className="w-full rounded-full bg-[#8f79df] px-6 py-4 font-black text-white shadow-lg shadow-[#8f79df]/30 disabled:opacity-50"
        >
          {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Submitting</span> : "Submit Quiz"}
        </button>
      </main>
    </div>
  );
};

export default QuizSession;
