import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";

const FOCUS_API_BASE_URL = "http://localhost:3000/api/focus";
const AI_API_BASE_URL = "http://localhost:3000/api/ai";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
};

const FocusSetup = () => {
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [otherTopic, setOtherTopic] = useState("");
  const [useOtherTopic, setUseOtherTopic] = useState(false);
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

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your subjects");
        }

        setSyllabus(data.data || []);
      } catch (loadError) {
        setError(loadError.message);
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
  const canStart = selectedSyllabusId
    && selectedChapterId
    && ((useOtherTopic && otherTopic.trim()) || (!useOtherTopic && selectedTopicId));

  const selectSubject = (syllabusId) => {
    setSelectedSyllabusId(syllabusId);
    setSelectedChapterId("");
    setSelectedTopicId("");
    setOtherTopic("");
    setUseOtherTopic(false);
  };

  const selectChapter = async (chapterId) => {
    setSelectedChapterId(chapterId);
    setSelectedTopicId("");
    setOtherTopic("");
    setUseOtherTopic(false);

    const chapter = selectedSyllabus?.chapters?.find((item) => item._id === chapterId);

    if (!chapter || chapter.isExpanded || chapter.topics?.length) {
      return;
    }

    try {
      setError("");
      setIsGeneratingTopics(true);
      const response = await fetch(`${AI_API_BASE_URL}/expand-chapter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          syllabusId: selectedSyllabusId,
          chapterId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to generate topics");
      }

      setSyllabus((previous) =>
        previous.map((subject) =>
          subject._id === selectedSyllabusId
            ? {
                ...subject,
                chapters: subject.chapters.map((item) =>
                  item._id === chapterId ? data.data : item
                ),
              }
            : subject
        )
      );
    } catch (topicError) {
      setError(topicError.message);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const startSession = async () => {
    if (!canStart) {
      return;
    }

    try {
      setError("");
      setIsStarting(true);
      const response = await fetch(`${FOCUS_API_BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          syllabusId: selectedSyllabusId,
          chapterId: selectedChapterId,
          topicId: useOtherTopic ? undefined : selectedTopicId,
          otherTopic: useOtherTopic ? otherTopic : "",
          durationMinutes: 25,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to start session");
      }

      navigate(`/focus-session/${data.data._id}`, { state: { session: data.data } });
    } catch (startError) {
      setError(startError.message);
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
    <div className="min-h-screen bg-[#f8f9fc] pb-10 text-[#1f2937]">
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-600"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6152a8]">
              Focus setup
            </p>
            <h1 className="text-2xl font-black tracking-tight">Choose what you will study</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1fr_1.1fr]">
        {error && (
          <div className="lg:col-span-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#efeafd] text-[#6152a8]">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Selected subjects</h2>
              <p className="text-sm text-gray-500">Pick one from your syllabus.</p>
            </div>
          </div>

          <div className="space-y-3">
            {syllabus.map((subject) => (
              <button
                key={subject._id}
                onClick={() => selectSubject(subject._id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  selectedSyllabusId === subject._id
                    ? "border-[#6152a8] bg-[#f4f1ff] text-[#382978]"
                    : "border-gray-100 bg-[#f8f9fc] hover:border-[#c8bee9]"
                }`}
              >
                <span className="font-bold">{subject.subjectName}</span>
                {selectedSyllabusId === subject._id ? <Check size={18} /> : <ChevronRight size={18} />}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm border border-gray-100">
          <div className="mb-5">
            <h2 className="text-xl font-black">Chapter and topic</h2>
            <p className="text-sm text-gray-500">
              Topics are generated and saved when you choose a chapter.
            </p>
          </div>

          {!selectedSyllabus && (
            <div className="rounded-3xl bg-[#f8f9fc] p-8 text-center text-sm font-semibold text-gray-500">
              Select a subject to see its chapters.
            </div>
          )}

          {selectedSyllabus && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                  Chapters
                </p>
                <div className="max-h-[28rem] space-y-3 overflow-auto pr-1">
                  {selectedSyllabus.chapters.map((chapter) => (
                    <button
                      key={chapter._id}
                      onClick={() => selectChapter(chapter._id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                        selectedChapterId === chapter._id
                          ? "border-[#6152a8] bg-[#f4f1ff] text-[#382978]"
                          : "border-gray-100 bg-[#f8f9fc] hover:border-[#c8bee9]"
                      }`}
                    >
                      {chapter.chapterTitle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                  Topics
                </p>

                {isGeneratingTopics && (
                  <div className="flex items-center gap-2 rounded-2xl bg-[#f4f1ff] px-4 py-4 text-sm font-bold text-[#6152a8]">
                    <Loader2 size={18} className="animate-spin" />
                    Generating topics
                  </div>
                )}

                {!selectedChapter && !isGeneratingTopics && (
                  <div className="rounded-2xl bg-[#f8f9fc] p-5 text-sm font-semibold text-gray-500">
                    Select a chapter first.
                  </div>
                )}

                {selectedChapter && !isGeneratingTopics && (
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <button
                        key={topic._id}
                        onClick={() => {
                          setSelectedTopicId(topic._id);
                          setUseOtherTopic(false);
                          setOtherTopic("");
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                          selectedTopicId === topic._id && !useOtherTopic
                            ? "border-[#6152a8] bg-[#f4f1ff] text-[#382978]"
                            : "border-gray-100 bg-[#f8f9fc] hover:border-[#c8bee9]"
                        }`}
                      >
                        {topic.topicName}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setUseOtherTopic(true);
                        setSelectedTopicId("");
                      }}
                      className={`flex w-full items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                        useOtherTopic
                          ? "border-[#6152a8] bg-[#f4f1ff] text-[#382978]"
                          : "border-gray-100 bg-[#f8f9fc] hover:border-[#c8bee9]"
                      }`}
                    >
                      <Sparkles size={17} />
                      Other topic
                    </button>

                    {useOtherTopic && (
                      <input
                        value={otherTopic}
                        onChange={(event) => setOtherTopic(event.target.value)}
                        placeholder="Type what you want to study"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-semibold outline-none focus:border-[#6152a8]"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={startSession}
            disabled={!canStart || isStarting}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6152a8] px-5 py-4 font-black text-white shadow-lg shadow-[#6152a8]/20 transition hover:bg-[#51458f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
            Start focus session
          </button>
        </section>
      </main>
    </div>
  );
};

export default FocusSetup;
