import React, { useEffect, useState } from "react";
import {
  Flame,
  Timer,
  Brain,
  Check,
  MoreVertical,
  Bell,
  Plus,
  LogOut
} from "lucide-react";

import { motion}  from "framer-motion";
import { useNavigate } from "react-router-dom";

import NavBar from "../../components/NavBar";

const API_BASE_URL = "http://localhost:3000/api/dashboard";
const AUTH_API_BASE_URL = "http://localhost:3000/api/auth";

const emptyStats = {
  completedTasks: 0,
  totalTasks: 0,
  focusMinutes: 0
};

const emptyStreak = {
  count: 0,
  longestStreak: 0,
  lastActive: null
};

const normalizeStreak = (streak) => ({
  count: Number(streak?.count) || 0,
  longestStreak: Number(streak?.longestStreak) || 0,
  lastActive: streak?.lastActive || null
});

const buildStats = (taskList) => ({
  completedTasks: taskList.filter((task) => task.status === "completed").length,
  totalTasks: taskList.length,
  focusMinutes: taskList
    .filter((task) => task.status === "completed")
    .reduce((total, task) => total + (task.estimatedMinutes || 0), 0)
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("Token");

  return token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};
};


const Dashboard = () => {
 
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  const [dashboardError, setDashboardError] = useState("");

  const [streak, setStreak] = useState(emptyStreak);

  const [stats, setStats] = useState(emptyStats);

  const [dailyContext, setDailyContext] = useState({
    studied: "",
    homework: "",
    testSubject: "",
    testDate: ""
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH DAILY STATUS
  |--------------------------------------------------------------------------
  */
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statusResponse, studentResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/daily-status`, {
            headers: getAuthHeaders(),
            credentials: "include"
          }),
          fetch(`${API_BASE_URL}/student-info`, {
            headers: getAuthHeaders(),
            credentials: "include"
          })
        ]);

        const statusData = await statusResponse.json();
        const studentData = await studentResponse.json();

        if (!statusResponse.ok) {
          throw new Error(statusData.message || "Unable to load dashboard status");
        }

        if (!studentResponse.ok) {
          throw new Error(studentData.message || "Unable to load student info");
        }

        const todayTasks = statusData.tasks || [];

        setName(studentData.data?.name || "Student");
        setHasSubmittedToday(Boolean(statusData.hasSubmittedToday));
        setTasks(todayTasks);
        setStreak(normalizeStreak(statusData.streak));
        setStats(statusData.stats || buildStats(todayTasks));
      } catch (error) {
        console.error(error);
        setDashboardError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  /*
  |--------------------------------------------------------------------------
  | HANDLE DAILY CHECK-IN
  |--------------------------------------------------------------------------
  */

  const handleGenerateTasks = async () => {

    try {
      setDashboardError("");
      setIsGeneratingTasks(true);

      const response = await fetch(
        `${API_BASE_URL}/daily-context`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },

          credentials: "include",

          body: JSON.stringify(dailyContext)
        }
      );

      const data = await response.json();

      if (response.ok) {

        setTasks(data.tasks);

        setHasSubmittedToday(true);

        setStreak(normalizeStreak(data.streak));

        setStats(data.stats || buildStats(data.tasks || []));
      } else {
        throw new Error(data.message || "Unable to generate daily plan");
      }

    } catch (error) {

      console.error(error);
      setDashboardError(error.message);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE TASK
  |--------------------------------------------------------------------------
  */

  const toggleTask = async (taskId) => {

    try {

      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
            : task
        )
      );

      const response = await fetch(
        `${API_BASE_URL}/task/${taskId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },

          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update task");
      }

      setTasks((prev) => {
        const nextTasks = prev.map((task) =>
          task._id === taskId ? data.task : task
        );

        setStats(buildStats(nextTasks));
        return nextTasks;
      });

      if (data.streak) {
        setStreak(normalizeStreak(data.streak));
      }

    } catch (error) {

      console.error(error);
      setDashboardError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("Token");
      navigate("/login");
    }
  };

  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-bold text-[#6152a8]">
          Loading Dashboard...
        </h1>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-32">

      {/* HEADER */}

      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 border-b border-gray-100">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-[#ae9ffb] overflow-hidden">

            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ansh"
              alt="Avatar"
            />

          </div>

          <span className="text-xl font-bold text-[#6152a8] tracking-tight">
            Welcome {name || "Student"}
          </span>

        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <Bell size={20} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full bg-[#6152a8] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#51458f]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

      </header>

      {/* MAIN */}

      <main className="pt-24 px-6 max-w-7xl mx-auto space-y-12">

        {dashboardError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {dashboardError}
          </div>
        )}

        {/* HERO */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6152a8] to-[#ae9ffb] p-8 text-white shadow-lg">

          <div className="relative z-10 space-y-4">

            <h1 className="text-4xl font-extrabold">
              Stay Consistent, {name || "Student"}
            </h1>

            <p className="text-lg opacity-90 max-w-md">
              Small focused sessions every day build unstoppable momentum.
            </p>

            <button className="bg-white text-[#6152a8] px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
              Resume Session
            </button>

          </div>

        </section>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <StatCard
            title="Focus Streak"
            value={streak.count || 0}
            unit="days"
            icon={<Flame className="text-orange-500" />}
            progress={Math.min(((streak.count || 0) / 30) * 100, 100)}
          />

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">

            <GoalCard
              title="Focus Minutes"
              current={stats.focusMinutes}
              total={200}
              icon={<Timer />}
              color="bg-[#6152a8]"
            />

            <GoalCard
              title="Tasks Completed"
              current={stats.completedTasks}
              total={stats.totalTasks}
              icon={<Brain />}
              color="bg-emerald-500"
            />

          </div>

        </div>

        {/* DAILY CHECK-IN */}

        {
          !hasSubmittedToday && !isGeneratingTasks && (

            <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">

              <div>

                <h2 className="text-3xl font-bold text-gray-800">
                  Daily Check-in
                </h2>

                <p className="text-gray-500 mt-2">
                  Tell us what happened today so AI can build your study plan.
                </p>

              </div>

              <textarea
                placeholder="What did you study today?"
                value={dailyContext.studied}
                onChange={(e) =>
                  setDailyContext({
                    ...dailyContext,
                    studied: e.target.value
                  })
                }
                className="w-full p-5 rounded-2xl border border-gray-200 outline-none resize-none h-32"
              />

              <textarea
                placeholder="Any homework?"
                value={dailyContext.homework}
                onChange={(e) =>
                  setDailyContext({
                    ...dailyContext,
                    homework: e.target.value
                  })
                }
                className="w-full p-5 rounded-2xl border border-gray-200 outline-none resize-none h-28"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <input
                  type="text"
                  placeholder="Upcoming test subject"
                  value={dailyContext.testSubject}
                  onChange={(e) =>
                    setDailyContext({
                      ...dailyContext,
                      testSubject: e.target.value
                    })
                  }
                  className="p-5 rounded-2xl border border-gray-200 outline-none"
                />

                <input
                  type="date"
                  value={dailyContext.testDate}
                  onChange={(e) =>
                    setDailyContext({
                      ...dailyContext,
                      testDate: e.target.value
                    })
                  }
                  className="p-5 rounded-2xl border border-gray-200 outline-none"
                />

              </div>

              <button
                onClick={handleGenerateTasks}
                disabled={isGeneratingTasks}
                className="bg-[#6152a8] text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                Generate Today's Plan
              </button>

            </section>
          )
        }

        {isGeneratingTasks && <TaskGenerationSkeleton />}

        {/* TASK LIST */}

        {
          hasSubmittedToday && (
            <section className="space-y-6">

              <div className="flex items-center justify-between">

                <h2 className="text-2xl font-bold text-gray-800">
                  Today's Focus
                </h2>

                <button className="text-[#6152a8] font-semibold text-sm">
                  View All
                </button>

              </div>

              <div className="space-y-4">

                {
                  tasks.map((task) => (

                    <TaskItem
                      key={task._id}
                      task={task}
                      onToggle={() => toggleTask(task._id)}
                    />
                  ))
                }

              </div>

            </section>
          )
        }

      </main>

      {/* FAB */}

      <button className="fixed bottom-28 right-6 w-14 h-14 bg-[#6152a8] text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 transition-all z-40">

        <Plus size={28} />

      </button>

      <NavBar />

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

const StatCard = ({ title, value, unit, icon, progress }) => (

  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-50 flex flex-col justify-between">

    <div className="flex justify-between items-start">

      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {title}
      </span>

      {icon}

    </div>

    <div className="mt-4">

      <span className="text-5xl font-black text-gray-800">
        {value}
      </span>

      <span className="ml-2 text-gray-500">
        {unit}
      </span>

    </div>

    <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden">

      <div
        className="h-full bg-orange-500 rounded-full"
        style={{ width: `${progress}%` }}
      />

    </div>

  </div>
);

/*
|--------------------------------------------------------------------------
| GOAL CARD
|--------------------------------------------------------------------------
*/

const GoalCard = ({ title, current, total, icon, color }) => (

  <div className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm">

    <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center mb-4`}>

      {React.cloneElement(icon, {
        size: 20,
        className: color.replace("bg-", "text-")
      })}

    </div>

    <h3 className="text-gray-500 text-sm font-medium">
      {title}
    </h3>

    <p className="text-2xl font-bold">

      {current}

      <span className="text-sm font-normal text-gray-400">
        {" "} / {total}
      </span>

    </p>

  </div>
);

/*
|--------------------------------------------------------------------------
| TASK GENERATION SKELETON
|--------------------------------------------------------------------------
*/

const TaskGenerationSkeleton = () => (
  <section className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">
        Building Today's Focus
      </h2>
      <p className="mt-2 text-sm font-medium text-gray-500">
        AI is turning your check-in into focused study tasks.
      </p>
    </div>

    <div className="space-y-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />

            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/3 rounded-full bg-gray-200" />
              <div className="h-3 w-1/3 rounded-full bg-gray-100" />
            </div>

            <div className="h-6 w-6 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

/*
|--------------------------------------------------------------------------
| TASK ITEM
|--------------------------------------------------------------------------
*/

const TaskItem = ({ task, onToggle }) => (

  <motion.div
    layout
    className={`p-5 rounded-2xl flex items-center justify-between transition-all ${
      task.status === "completed"
        ? "bg-gray-50 opacity-60"
        : "bg-white shadow-sm hover:shadow-md border border-gray-100"
    }`}
  >

    <div className="flex items-center gap-4">

      <button
        onClick={onToggle}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.status === "completed"
            ? "bg-[#6152a8] border-[#6152a8] text-white"
            : "border-gray-200 text-transparent"
        }`}
      >

        <Check size={16} strokeWidth={3} />

      </button>

      <div>

        <h4 className={`font-bold ${
          task.status === "completed"
            ? "line-through text-gray-400"
            : "text-gray-800"
        }`}>
          {task.title}
        </h4>

        <p className="text-xs text-gray-500">

          {task.estimatedMinutes} mins |{" "}

          <span className="text-[#6152a8] font-semibold">
            {task.taskType}
          </span>

        </p>

      </div>

    </div>

    <MoreVertical
      size={20}
      className="text-gray-400 cursor-pointer"
    />

  </motion.div>
);

export default Dashboard;
