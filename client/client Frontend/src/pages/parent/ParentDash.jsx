import React from "react";
import { Bell, Brain, Flame } from "lucide-react";

const ParentDash = () => {
  const [studentData, setStudentData] = React.useState({
    name: "",
    streak: 0,
    tasks: [],
  });
  const [parentData, setParentData] = React.useState({ name: "" });
  const [insights, setInsights] = React.useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("Token");
    return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/parent/parent-dashboard", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch parent dashboard");

        setParentData({ name: data.parent?.name || "" });
        setStudentData({
          name: data.student?.name || "",
          streak: data.student?.streak?.count || 0,
          tasks: data.tasks || [],
        });
        setInsights(data.insights || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const metrics = insights?.metrics || {};
  const syllabus = insights?.syllabusSummary || {};
  const subjectProgress = syllabus?.subjectWise || [];
  const subjectPerformance = insights?.subjectPerformance || [];
  const maxScore = Math.max(100, ...subjectPerformance.map((item) => item.accuracy || 0));

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3338] pb-24">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-50/80 backdrop-blur-xl flex items-center justify-between px-6">
        <h1 className="text-xl font-bold text-violet-700">Welcome back, {parentData.name}</h1>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200/50 transition">
          <Bell className="w-5 h-5 text-slate-500" />
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-10">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[#31638a] font-semibold tracking-wide text-sm">PARENTAL VIEW</span>
            <h2 className="text-4xl font-extrabold mt-1">{studentData.name}'s Report</h2>
          </div>
          <div className="flex items-center gap-2 bg-[#f1f4f8] px-6 py-3 rounded-full">
            <Flame className="text-[#6152a8] w-5 h-5 fill-[#6152a8]" />
            <span className="font-bold">{studentData.streak} Day Streak</span>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Task Completion" value={`${metrics.completedTasks || 0}/${metrics.totalTasks || 0}`} subtitle={`${metrics.taskCompletionRate || 0}%`} />
          <MetricCard title="Focus Completion" value={`${metrics.focusSessionsCompleted || 0}/${metrics.focusSessionsStarted || 0}`} subtitle={`${metrics.focusCompletionRate || 0}%`} />
          <MetricCard title="Quiz Score" value={`${metrics.quizMarksObtained || 0}/${metrics.quizMaxMarks || 0}`} subtitle={`${metrics.quizAccuracy || 0}%`} />
          <MetricCard title="Syllabus Completion" value={`${syllabus.completedTopics || 0}/${syllabus.totalTopics || 0}`} subtitle={`${syllabus.topicCompletionRate || 0}%`} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Subject-wise Syllabus Progress</h3>
            <div className="space-y-4">
              {subjectProgress.map((item) => (
                <div key={item.subjectName}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{item.subjectName}</span>
                    <span>{item.topicCompletionRate}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6152a8]" style={{ width: `${item.topicCompletionRate}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Topics {item.completedTopics}/{item.totalTopics} | Chapters {item.completedChapters}/{item.totalChapters}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Subject-wise Quiz Performance</h3>
            <div className="space-y-4">
              {subjectPerformance.map((item) => (
                <div key={item.subjectName}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{item.subjectName}</span>
                    <span>{item.accuracy}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3a675b]" style={{ width: `${Math.round(((item.accuracy || 0) / maxScore) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Quizzes {item.quizzesTaken} | Marks {item.marksObtained}/{item.maxMarks}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-2">AI Detailed Parent Insight</h3>
          <p className="text-sm text-slate-700">{insights?.aiInsight?.summary || "Loading AI analysis..."}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(insights?.aiInsight?.strengths || []).map((item) => (
              <InsightPill key={item} title="Strength" text={item} color="bg-emerald-50 text-emerald-700" />
            ))}
            {(insights?.aiInsight?.improvements || []).map((item) => (
              <InsightPill key={item} title="Needs Work" text={item} color="bg-amber-50 text-amber-700" />
            ))}
            {(insights?.aiInsight?.parentActions || []).map((item) => (
              <InsightPill key={item} title="Parent Action" text={item} color="bg-violet-50 text-violet-700" />
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">Estimated remaining time to complete syllabus: {Math.ceil((syllabus.estimatedMinutesRemaining || 0) / 60)} hours</p>
        </section>

        <section className="bg-[#f1f4f8] rounded-2xl overflow-hidden">
          {(studentData.tasks || []).map((task) => (
            <div key={task._id} className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{task.title}</p>
                <p className="text-sm text-slate-500">{task.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                {task.status}
              </span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4">
    <p className="text-xs font-semibold text-slate-500">{title}</p>
    <p className="text-2xl font-black text-[#6152a8] mt-2">{value}</p>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </div>
);

const InsightPill = ({ title, text, color }) => (
  <div className={`rounded-xl p-3 ${color}`}>
    <div className="flex items-center gap-2">
      <Brain size={16} />
      <p className="text-xs font-bold uppercase">{title}</p>
    </div>
    <p className="text-sm mt-2">{text}</p>
  </div>
);

export default ParentDash;
