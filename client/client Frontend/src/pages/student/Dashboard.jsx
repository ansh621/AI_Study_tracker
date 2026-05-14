import React, { useState } from 'react';
import { 
  Flame, Timer, Brain, Check, MoreVertical, 
  Bell, Home, ClipboardList, TrendingUp, Plus, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import NavBar from '../../components/NavBar';

const Dashboard = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Advanced Calculus - Week 4 Review", time: "45 mins", category: "Mathematics", completed: false },
    { id: 2, title: "Digital Ethics Essay Draft", time: "1.5 hours", category: "Philosophy", completed: false },
    { id: 3, title: "Japanese Vocabulary Quiz", time: "Completed 2 hours ago", category: "Languages", completed: true },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="bg-[#f8f9fc] min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ae9ffb] overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ansh" alt="Avatar" />
          </div>
          <span className="text-xl font-bold text-[#6152a8] tracking-tight">Serene Study</span>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <Bell size={20} />
        </button>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto space-y-12">
        {/* Welcome Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6152a8] to-[#ae9ffb] p-8 text-white shadow-lg">
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl font-extrabold">Keep it up, Ansh!</h1>
            <p className="text-lg opacity-90 max-w-md">You've reached 85% of your weekly goal. Your focus is sharper than ever.</p>
            <button className="bg-white text-[#6152a8] px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
              Resume Session
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard title="Focus Streak" value="12" unit="days" icon={<Flame className="text-orange-500" />} progress={80} />
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <GoalCard title="Focus Minutes" current={145} total={200} icon={<Timer />} color="bg-[#6152a8]" />
            <GoalCard title="Problems Solved" current={28} total={40} icon={<Brain />} color="bg-emerald-500" />
          </div>
        </div>

        {/* Task List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Today's Focus</h2>
            <button className="text-[#6152a8] font-semibold text-sm">View All</button>
          </div>
          <div className="space-y-4">
            {tasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-[#6152a8] text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 transition-all z-40">
        <Plus size={28} />
      </button>

      {/* Navigation */}
      <NavBar />
    </div>
  );
};

// Sub-components for Cleanliness
const StatCard = ({ title, value, unit, icon, progress }) => (
  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-50 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</span>
      {icon}
    </div>
    <div className="mt-4">
      <span className="text-5xl font-black text-gray-800">{value}</span>
      <span className="ml-2 text-gray-500">{unit}</span>
    </div>
    <div className="mt-6 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

const GoalCard = ({ title, current, total, icon, color }) => (
  <div className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm">
    <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center mb-4`}>
      {React.cloneElement(icon, { size: 20, className: color.replace('bg-', 'text-') })}
    </div>
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold">{current} <span className="text-sm font-normal text-gray-400">/ {total}</span></p>
  </div>
);

const TaskItem = ({ task, onToggle }) => (
  <motion.div 
    layout
    className={`p-4 rounded-2xl flex items-center justify-between transition-all ${task.completed ? 'bg-gray-50 opacity-60' : 'bg-white shadow-sm hover:shadow-md border border-gray-100'}`}
  >
    <div className="flex items-center gap-4">
      <button 
        onClick={onToggle}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-[#6152a8] border-[#6152a8] text-white' : 'border-gray-200 text-transparent'}`}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      <div>
        <h4 className={`font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</h4>
        <p className="text-xs text-gray-500">{task.time} • <span className="text-[#6152a8] font-semibold">{task.category}</span></p>
      </div>
    </div>
    <MoreVertical size={20} className="text-gray-400 cursor-pointer" />
  </motion.div>
);

const NavItem = ({ icon, label, active }) => (
  <button className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${active ? 'bg-[#6152a8]/10 text-[#6152a8]' : 'text-gray-400 hover:text-gray-600'}`}>
    {React.cloneElement(icon, { size: 22 })}
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

export default Dashboard;