import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, ChevronRight, Loader2, Sparkles } from "lucide-react";

const FOCUS_API_BASE_URL = "http://localhost:3000/api/focus";
const AI_API_BASE_URL = "http://localhost:3000/api/ai";
const QUIZ_API_BASE_URL = "http://localhost:3000/api/quiz";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
};

const QuizSetup = () => {
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSyllabus = async () => {
      try {
        const response = await fetch(`${FOCUS_API_BASE_URL}/syllabus`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load syllabus");
        setSyllabus(data.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadSyllabus();
  }, []);

  const selectedSyllabus = useMemo(
    () => syllabus.find((item) => item._id === selectedSyllabusId),
    [selectedSyllabusId, syllabus]
  );
  const selectedChapter = useMemo(
    () => selectedSyllabus?.chapters?.find((chapter) => chapter._id === selectedChapterId),
    [selectedChapterId, selectedSyllabus]
  );
  const topics = selectedChapter?.topics || [];

  const selectSubject = (syllabusId) => {
    setSelectedSyllabusId(syllabusId);
    setSelectedChapterId("");
    setSelectedTopicId("");
  };

  const selectChapter = async (chapterId) => {
    setSelectedChapterId(chapterId);
    setSelectedTopicId("");
    const chapter = selectedSyllabus?.chapters?.find((item) => item._id === chapterId);
    if (!chapter || chapter.isExpanded || chapter.topics?.length) return;
    try {
      setIsGeneratingTopics(true);
      setError("");
      const response = await fetch(`${AI_API_BASE_URL}/expand-chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ syllabusId: selectedSyllabusId, chapterId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to generate topics");
      setSyllabus((prev) =>
        prev.map((subject) =>
          subject._id === selectedSyllabusId
            ? {
                ...subject,
                chapters: subject.chapters.map((item) => (item._id === chapterId ? data.data : item)),
              }
            : subject
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedSyllabusId || !selectedChapterId || !selectedTopicId) return;
    try {
      setIsStarting(true);
      setError("");
      const response = await fetch(`${QUIZ_API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          syllabusId: selectedSyllabusId,
          chapterId: selectedChapterId,
          topicId: selectedTopicId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to generate quiz");
      navigate("/quiz-session", { state: { quiz: data.data } });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center text-[#6152a8]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 text-[#111827]">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="grid h-10 w-10 place-items-center rounded-full bg-[#eef1f7] text-[#6152a8]">
            <ArrowLeft size={20} />
          </button>
          <span className="text-xl font-black text-[#6b2cf5]">Focus Nest Quiz</span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4">
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#e4b9a7] text-white">
              <BookOpen size={22} />
            </div>
            <h2 className="text-lg font-black text-[#4e35b5]">Select Subject</h2>
          </div>
          <div className="space-y-2">
            {syllabus.map((subject) => (
              <button
                key={subject._id}
                onClick={() => selectSubject(subject._id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  selectedSyllabusId === subject._id ? "border-[#8f79df] bg-[#f4f1ff] text-[#4e35b5]" : "border-gray-100 bg-[#f8f9fc]"
                }`}
              >
                <span className="font-bold">{subject.subjectName}</span>
                {selectedSyllabusId === subject._id ? <Check size={18} /> : <ChevronRight size={18} />}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#4e35b5]">Select Chapter</h2>
          <div className="mt-4 space-y-2">
            {(selectedSyllabus?.chapters || []).map((chapter) => (
              <button
                key={chapter._id}
                onClick={() => selectChapter(chapter._id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left font-semibold ${
                  selectedChapterId === chapter._id ? "border-[#8f79df] bg-[#f4f1ff] text-[#4e35b5]" : "border-gray-100 bg-[#f8f9fc]"
                }`}
              >
                {chapter.chapterTitle}
              </button>
            ))}
            {!selectedSyllabus && <p className="text-sm text-gray-500">Choose a subject first.</p>}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#4e35b5]">Select Topic</h2>
          {isGeneratingTopics && <p className="mt-3 text-sm font-semibold text-[#6152a8]">Generating topics...</p>}
          <div className="mt-4 space-y-2">
            {topics.map((topic) => (
              <button
                key={topic._id}
                onClick={() => setSelectedTopicId(topic._id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left font-semibold ${
                  selectedTopicId === topic._id ? "border-[#8f79df] bg-[#f4f1ff] text-[#4e35b5]" : "border-gray-100 bg-[#f8f9fc]"
                }`}
              >
                {topic.topicName}
              </button>
            ))}
            {!selectedChapter && <p className="text-sm text-gray-500">Choose a chapter first.</p>}
          </div>
        </section>

        <button
          onClick={handleGenerateQuiz}
          disabled={!selectedSyllabusId || !selectedChapterId || !selectedTopicId || isStarting}
          className="w-full rounded-full bg-[#8f79df] px-6 py-4 font-black text-white shadow-lg shadow-[#8f79df]/30 disabled:opacity-50"
        >
          {isStarting ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Generating</span> : <span className="inline-flex items-center gap-2"><Sparkles size={18} /> Generate Quiz</span>}
        </button>
      </main>
    </div>
  );
};

export default QuizSetup;
