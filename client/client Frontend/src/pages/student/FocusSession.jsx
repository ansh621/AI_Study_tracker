import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  Bot,
  Brain,
  BarChart3,
  FileText,
  HelpCircle,
  HomeIcon,
  Loader2,
  MoreVertical,
  Paperclip,
  RefreshCw,
  Send,
  UserCircle2,
} from "lucide-react";

const FOCUS_API_BASE_URL = "http://localhost:3000/api/focus";
const QUIZ_API_BASE_URL = "http://localhost:3000/api/quiz";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");
  return token && token !== "undefined"
    ? { Authorization: `Bearer ${token}` }
    : {};
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const FocusSession = () => {
  const { sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(state?.session || null);

  // Set initial configuration from loaded session state dynamically
  const initialDuration = state?.session?.durationMinutes || 25;
  const [sessionTimer, setSessionTimer] = useState(initialDuration);
  const [secondsLeft, setSecondsLeft] = useState(initialDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const hasEndedRef = useRef(false);
  const secondsLeftRef = useRef(initialDuration * 60);
  const totalSecondsCapRef = useRef(initialDuration * 60);

  const tutorMessages = session?.tutorMessages || [];

  // Track the configuration cap separately so the progress bar calculates correctly
  const [totalSecondsCap, setTotalSecondsCap] = useState(initialDuration * 60);

  const progress = useMemo(() => {
    return totalSecondsCap
      ? Math.max(0, Math.min(1, secondsLeft / totalSecondsCap))
      : 1;
  }, [secondsLeft, totalSecondsCap]);

  useEffect(() => {
    secondsLeftRef.current = secondsLeft;
  }, [secondsLeft]);

  useEffect(() => {
    totalSecondsCapRef.current = totalSecondsCap;
  }, [totalSecondsCap]);

  const getElapsedSeconds = () =>
    Math.max(0, totalSecondsCapRef.current - secondsLeftRef.current);

  // Load Session Data
  useEffect(() => {
    const loadSession = async () => {
      if (session) return;

      try {
        const response = await fetch(
          `${FOCUS_API_BASE_URL}/sessions/${sessionId}`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load focus session");
        }

        setSession(data.data);
        const fetchedDuration = data.data.durationMinutes || 25;
        setSessionTimer(fetchedDuration);
        setSecondsLeft(fetchedDuration * 60);
        setTotalSecondsCap(fetchedDuration * 60);
        secondsLeftRef.current = fetchedDuration * 60;
        totalSecondsCapRef.current = fetchedDuration * 60;
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadSession();
  }, [session, sessionId]);

  // Countdown Ticker Loop (Fixed: Broken dependency loop removed)
  useEffect(() => {
    if (!isRunning) return undefined;

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRunning]);

  // Handle Session Auto-Completion
  useEffect(() => {
    if (secondsLeft === 0 && session?.status === "active") {
      finishSession("completed", false);
    }
  }, [secondsLeft, session?.status]);

  // Page Navigation Guards
  useEffect(() => {
    if (session?.status !== "active" || hasEndedRef.current) return undefined;

    window.history.pushState({ focusLocked: true }, "", window.location.href);

    const handleBack = () => {
      window.history.pushState({ focusLocked: true }, "", window.location.href);
      finishSession("exited", true);
    };

    const handleBeforeUnload = (event) => {
      if (session?.status === "active" && !hasEndedRef.current) {
        finishSession("exited", false, null, true);
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("popstate", handleBack);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handleBack);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session?.status]);

  const finishSession = async (
    status = "completed",
    showExitMessage = false,
    destination = "/dashboard",
    keepalive = false,
  ) => {
    if (!sessionId || hasEndedRef.current) return;

    hasEndedRef.current = true;
    const actualElapsedSeconds = getElapsedSeconds();

    try {
      const response = await fetch(
        `${FOCUS_API_BASE_URL}/sessions/${sessionId}/end`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
          keepalive,
          body: JSON.stringify({ status, actualElapsedSeconds }),
        },
      );
      const data = await response.json();

      if (response.ok) {
        setSession(data.data);
      }
    } catch (finishError) {
      console.error(finishError);
    } finally {
      setIsRunning(false);
      if (showExitMessage) {
        window.alert(
          "Your focus session was finished because you left the session screen.",
        );
      }
      if (destination) {
        navigate(destination, { replace: true });
      }
    }
  };

  const askTutor = async (questionText = input) => {
    if (!questionText.trim() || isAsking) return;

    const question = questionText.trim();
    setInput("");
    setError("");
    setIsAsking(true);
    setSession((current) => ({
      ...current,
      tutorMessages: [
        ...(current?.tutorMessages || []),
        { _id: `student-${Date.now()}`, role: "student", content: question },
      ],
    }));

    try {
      const response = await fetch(
        `${FOCUS_API_BASE_URL}/sessions/${sessionId}/tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include",
          body: JSON.stringify({ question }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Tutor could not answer");
      }

      setSession(data.data);
    } catch (askError) {
      setError(askError.message);
    } finally {
      setIsAsking(false);
    }
  };

  const generateSummary = async () => {
    try {
      setError("");
      setIsGeneratingSummary(true);
      const response = await fetch(
        `${FOCUS_API_BASE_URL}/sessions/${sessionId}/summary`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to generate summary");
      setSummaryData(data.data);
    } catch (summaryError) {
      setError(summaryError.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateSessionQuiz = async () => {
    try {
      setError("");
      setIsGeneratingQuiz(true);
      const response = await fetch(`${QUIZ_API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({ focusSessionId: sessionId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to generate quiz");
      navigate("/quiz-session", {
        state: {
          quiz: data.data,
          returnTo: `/focus-session/${sessionId}`,
          focusSession: session,
        },
      });
    } catch (quizError) {
      setError(quizError.message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Explicit control updates updating configuration and runtime states simultaneously
  const handleDecreaseTimer = () => {
    if (isRunning) return; // Prevent altering while countdown runs
    setSessionTimer((prev) => {
      const next = prev > 5 ? prev - 5 : 5; // Do not drop to 0 minutes
      setSecondsLeft(next * 60);
      setTotalSecondsCap(next * 60);
      return next;
    });
  };

  const handleIncreaseTimer = () => {
    if (isRunning) return;
    setSessionTimer((prev) => {
      const next = Number(prev) + 5;
      setSecondsLeft(next * 60);
      setTotalSecondsCap(next * 60);
      return next;
    });
  };

  const handleResetTimer = () => {
    const resetSeconds = sessionTimer * 60;
    setSecondsLeft(resetSeconds);
    setTotalSecondsCap(resetSeconds);
    setIsRunning(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-violet-100 flex items-center justify-center text-[#6152a8]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-violet-100 pb-28 text-[#111827]">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e4b9a7] text-white">
            <FileText size={22} />
          </div>
          <span className="text-xl font-black text-[#6b2cf5]">Focus Nest</span>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full text-slate-500"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-4">
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-[2rem] bg-white p-8 shadow-sm">
          <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-[#17436f]">
            Current focus
          </p>

          <div className="mt-6 flex justify-center">
            <div
              className="grid h-44 w-44 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#326a5d ${progress * 360}deg, #c4ffe4 ${progress * 360}deg)`,
              }}
            >
              <div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center shadow-inner">
                <div>
                  <p className="text-5xl font-black tracking-tight">
                    {formatTime(secondsLeft)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Time Remaining</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-[16rem] text-center text-sm font-bold text-[#6152a8]">
            {session.subjectName} - {session.topicName}
          </p>
          <p className="mt-2 text-center text-xs font-semibold text-gray-500">
            Time spent: {formatTime(getElapsedSeconds())}
          </p>

          <div className="mt-7 grid grid-cols-[1fr_auto] gap-4">
            <button
              onClick={() => setIsRunning((current) => !current)}
              className="rounded-full bg-[#8f79df] px-6 py-4 font-black text-white shadow-lg shadow-[#8f79df]/30"
            >
              {isRunning ? "Pause Session" : "Start Session"}
            </button>
          </div>
          <div className="flex justify-between  mt-5 px-5">
            <button
              onClick={handleIncreaseTimer}
              disabled={isRunning}
              className="grid h-14 w-14 place-items-center font-bold text-2xl rounded-full bg-[#eef1f7] text-[#6152a8] disabled:opacity-40"
              aria-label="Increase timer"
            >
              +
            </button>
            <button
              onClick={handleResetTimer}
              className="grid h-14 w-14 place-items-center font-bold text-2xl rounded-full bg-[#eef1f7] text-[#6152a8]"
              aria-label="Reset timer"
            >
              <RefreshCw size={21} />
            </button>

            <button
              onClick={handleDecreaseTimer}
              disabled={isRunning}
              className="grid h-14 w-14 place-items-center font-bold text-2xl rounded-full bg-[#eef1f7] text-[#6152a8] disabled:opacity-40"
              aria-label="Decrease timer"
            >
              -
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#eef1f6] p-6">
          <h2 className="mb-5 text-xl font-black text-[#4e35b5]">
            Session Tools
          </h2>
          <div className="space-y-3">
            <ToolItem
              icon={
                isAsking ? (
                  <Loader2 className="animate-spin" size={21} />
                ) : (
                  <Brain size={21} />
                )
              }
              title="Explain Concept"
              subtitle="Break down complex topics"
              onClick={() =>
                askTutor(
                  `Explain ${session.topicName} in simple steps with one example.`,
                )
              }
              disabled={isAsking}
            />
            <ToolItem
              icon={
                isGeneratingQuiz ? (
                  <Loader2 className="animate-spin" size={21} />
                ) : (
                  <HelpCircle size={21} />
                )
              }
              title="Generate Quiz"
              subtitle="Test your current focus"
              onClick={generateSessionQuiz}
              disabled={isGeneratingQuiz}
            />
            <ToolItem
              icon={
                isGeneratingSummary ? (
                  <Loader2 className="animate-spin" size={21} />
                ) : (
                  <FileText size={21} />
                )
              }
              title="Smart Summary"
              subtitle="Key takeaways from session"
              onClick={generateSummary}
              disabled={isGeneratingSummary}
            />
          </div>
        </section>

        {summaryData && (
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#4e35b5]">
              Session Summary
            </h2>
            <p className="mt-2 text-sm text-gray-700">{summaryData.summary}</p>
            {Boolean(summaryData.keyPoints?.length) && (
              <div className="mt-4">
                <h3 className="text-sm font-black text-[#17436f]">
                  Key Points
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {summaryData.keyPoints.map((point, index) => (
                    <li
                      key={`${point}-${index}`}
                      className="rounded-2xl bg-[#f8f9fc] px-4 py-3"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Boolean(summaryData.nextSteps?.length) && (
              <div className="mt-4">
                <h3 className="text-sm font-black text-[#17436f]">
                  Next Steps
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {summaryData.nextSteps.map((step, index) => (
                    <li
                      key={`${step}-${index}`}
                      className="rounded-2xl bg-[#f8f9fc] px-4 py-3"
                    >
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#aa94ff] to-[#b7f0ef] text-white">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black">AI Tutor</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-[#326a5d]" />
                  Ready to assist your study
                </div>
              </div>
            </div>
            <MoreVertical className="text-gray-500" size={20} />
          </div>

          <div className="max-h-[30rem] space-y-4 overflow-auto pr-1">
            {tutorMessages.map((message, index) => (
              <MessageBubble key={message._id || index} message={message} />
            ))}
            {isAsking && (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6152a8]">
                <Loader2 className="animate-spin" size={16} />
                Tutor is thinking
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-full bg-[#f1f3f7] px-4 py-3">
            <Paperclip size={19} className="text-gray-500" />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  askTutor();
                }
              }}
              placeholder="Ask your AI Tutor anything..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={askTutor}
              disabled={isAsking || !input.trim()}
              className="grid h-11 w-11 place-items-center rounded-full bg-[#6152a8] text-white disabled:opacity-50"
              aria-label="Send question"
            >
              <Send size={20} />
            </button>
          </div>
        </section>

        <button
          onClick={() => finishSession("completed", false)}
          className="w-full rounded-2xl border border-[#d9d2f5] bg-white px-5 py-4 font-black text-[#6152a8]"
        >
          Finish Session
        </button>
      </main>

      <SessionNav
        onExit={(destination) => finishSession("exited", true, destination)}
      />
    </div>
  );
};

const SessionNav = ({ onExit }) => {
  const items = [
    { label: "Home", icon: HomeIcon, to: "/dashboard" },
    { label: "AI Tutor", icon: Bot, to: "/focus-setup" },
    { label: "Insights", icon: BarChart3, to: "/insights" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-gray-100 bg-white px-4 pb-6 pt-3">
      {items.map(({ label, icon: Icon, to }) => (
        <button
          key={label}
          onClick={() => onExit(to)}
          className="flex flex-col items-center px-5 py-2 text-gray-400 transition-colors hover:text-[#6152a8]"
        >
          <Icon size={24} />
          <span className="mt-1 text-[11px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
};

const ToolItem = ({ icon, title, subtitle, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex w-full items-center gap-4 rounded-3xl bg-white px-4 py-4 text-left disabled:opacity-60"
  >
    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dffcf1] text-[#326a5d]">
      {icon}
    </span>
    <span>
      <span className="block text-sm font-black">{title}</span>
      <span className="block text-xs text-gray-500">{subtitle}</span>
    </span>
  </button>
);

const MessageBubble = ({ message }) => {
  const isStudent = message.role === "student";

  return (
    <div
      className={`flex gap-3 ${isStudent ? "justify-end" : "justify-start"}`}
    >
      {!isStudent && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8f79df] text-white">
          <Bot size={16} />
        </span>
      )}
      <div
        className={`max-w-[78%] rounded-[1.8rem] px-5 py-4 text-sm leading-6 ${
          isStudent
            ? "rounded-br-sm bg-[#cfe7ff] text-[#17436f]"
            : "rounded-tl-sm border-l-4 border-[#8f79df] bg-white shadow-sm"
        }`}
      >
        <p>{message.content}</p>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="AI generated study visual"
            className="mt-3 max-h-72 w-full rounded-2xl object-contain"
          />
        )}
      </div>
      {isStudent && (
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#17436f] text-white">
          <UserCircle2 size={17} />
        </span>
      )}
    </div>
  );
};

export default FocusSession;
