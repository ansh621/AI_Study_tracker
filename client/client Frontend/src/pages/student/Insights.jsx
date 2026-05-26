import React, { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";

const INSIGHTS_API_BASE_URL = "http://localhost:3000/api/insights";

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");
  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
};

const Insights = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await fetch(`${INSIGHTS_API_BASE_URL}/student`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || "Unable to load insights");
        }
        setData(payload.data);
      } catch (insightError) {
        setError(insightError.message);
      }
    };
    loadInsights();
  }, []);

  const metrics = data?.metrics;

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-32 px-6">
      <main className="max-w-6xl mx-auto pt-12 space-y-6">
        <h1 className="text-3xl font-black text-[#1f2937]">Your Insights (Last {data?.periodDays || 30} Days)</h1>
        {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}
        {!metrics && !error && <div className="rounded-2xl bg-white p-6 border border-gray-100">Loading insights...</div>}
        {metrics && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Task completion" value={`${metrics.completedTasks}/${metrics.totalTasks}`} subtitle={`${metrics.taskCompletionRate}% complete`} />
              <Card title="Focus sessions" value={`${metrics.focusSessionsCompleted}/${metrics.focusSessionsStarted}`} subtitle={`${metrics.focusCompletionRate}% completed`} />
              <Card title="Quiz accuracy" value={`${metrics.quizMarksObtained}/${metrics.quizMaxMarks}`} subtitle={`${metrics.quizAccuracy}% accuracy`} />
            </section>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Syllabus topics done" value={`${data?.syllabusMetrics?.completedTopics || 0}/${data?.syllabusMetrics?.totalTopics || 0}`} subtitle={`${data?.syllabusMetrics?.topicCompletionRate || 0}% complete`} />
              <Card title="Syllabus chapters done" value={`${data?.syllabusMetrics?.completedChapters || 0}/${data?.syllabusMetrics?.totalChapters || 0}`} subtitle={`${data?.syllabusMetrics?.chapterCompletionRate || 0}% complete`} />
              <Card title="Time remaining" value={`${Math.ceil((data?.syllabusMetrics?.estimatedMinutesRemaining || 0) / 60)} hrs`} subtitle="Estimated to finish syllabus" />
            </section>
            <section className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black mb-2">Detailed Subject Insights</h2>
              <div className="space-y-3">
                {(data?.syllabusMetrics?.subjectWise || []).map((subject) => {
                  const performance = (data?.subjectPerformance || []).find((item) => item.subjectName === subject.subjectName) || {
                    accuracy: 0,
                    marksObtained: 0,
                    maxMarks: 0,
                    quizzesTaken: 0,
                  };
                  return (
                    <div key={subject.subjectName} className="rounded-xl border border-gray-100 p-4">
                      <p className="font-bold">{subject.subjectName}</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#6152a8]" style={{ width: `${subject.topicCompletionRate}%` }} />
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Syllabus: {subject.completedTopics}/{subject.totalTopics} topics ({subject.topicCompletionRate}%)
                      </p>
                      <p className="text-sm text-gray-600">
                        Quiz: {performance.accuracy}% ({performance.marksObtained}/{performance.maxMarks}), attempts: {performance.quizzesTaken}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black mb-2">AI Analysis</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{data?.aiInsight?.summary || data?.aiInsight}</p>
            </section>
          </>
        )}
      </main>
      <NavBar />
    </div>
  );
};

const Card = ({ title, value, subtitle }) => (
  <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
    <p className="text-sm text-gray-500 font-semibold">{title}</p>
    <h3 className="text-3xl font-black text-[#6152a8] mt-2">{value}</h3>
    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
  </div>
);

export default Insights;
