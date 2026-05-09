import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SubjectSelection from "./SubjectSelection";

const Onboarding = () => {
  const navigate = useNavigate();

  // Form State
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("ICSE"); // Defaulting to ICSE as per your HTML
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");

  const handleContinue = async () => {
  // Validate data before sending (Basic check)
  if (!grade || !board || !age || !gender) {
    return alert("Please fill in all details before continuing.");
  }

  const onboardingData = { grade, board, age, gender };

  try {
    const response = await fetch("http://localhost:3000/api/student/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Essential for sending the Token cookie
      body: JSON.stringify(onboardingData)
    });

    const data = await response.json();

    if (response.ok) {
      // Pro-tip: Alerts are annoying for UX. Use a toast or just navigate.
      navigate("/SubjectSelection", { 
        state: { onboardingData }, 
        replace: true // Prevents the user from going "back" to a half-filled form
      });
    } else {
      alert(data.message || "Failed to save. Please try again.");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Connection lost. Check your server.");
  }
};;

  return (
    <div className="bg-[#f8f9fc] text-[#2d3338] min-h-screen selection:bg-[#ae9ffb]/30 font-['Plus_Jakarta_Sans']">
      {/* Top Bar */}
      <header className="bg-[#f8f9fc] w-full sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="hover:bg-[#f1f4f8] rounded-full transition-colors p-2 active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[#6152a8]">
              arrow_back
            </span>
          </button>
          <h1 className="font-semibold text-lg">Student Records</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12 pb-32">
        {/* Editorial Hero Section */}
        <div className="mb-16 space-y-4">
          <h2 className="text-5xl font-extrabold tracking-tight leading-tight">
            Tell us more
          </h2>
          <p className="text-lg text-[#5a6065] max-w-md">
            Help us tailor your learning experience by sharing a few details
            about your current academic journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual/Imagery */}
          <div className="hidden md:block md:col-span-5 sticky top-24">
            <div className="relative overflow-hidden rounded-xl h-96 w-full shadow-2xl shadow-indigo-100">
              <img
                alt="Academic Serenity"
                className="absolute inset-0 w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1000"
              />
              <div className="absolute inset-0 bg-[#6152a8]/20 backdrop-blur-[2px] flex items-end p-8">
                <p className="text-white font-medium text-xl leading-relaxed">
                  "Every student's path is unique. Let's build yours with
                  clarity."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="md:col-span-7 space-y-12">
            {/* Grade Selection */}
            <section className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-[#31638a] ml-1">
                Current Grade
              </label>
              <div className="relative group">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full h-16 px-6 bg-[#f1f4f8] border-none rounded-lg text-lg appearance-none focus:ring-2 focus:ring-[#6152a8]/20 focus:bg-white transition-all outline-none"
                >
                  <option value="" disabled>
                    Select your grade
                  </option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                  <option value="undergrad">Undergraduate</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#5a6065]">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </section>

            
            <section className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-[#31638a] ml-1">
                Academic Board
              </label>
              <div className="grid grid-cols-3 gap-4">
                {["CBSE", "ICSE", "State Board"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBoard(b)}
                    className={`flex flex-col items-center justify-center p-6 rounded-lg transition-all active:scale-95 group border-2 ${
                      board === b
                        ? "bg-[#6152a8]/10 border-[#6152a8]/20 text-[#6152a8]"
                        : "bg-[#f1f4f8] border-transparent text-[#2d3338] hover:bg-[#e4e9ee]"
                    }`}
                  >
                    <span className="text-xl font-bold mb-1">{b}</span>
                    <span
                      className={`text-[10px] uppercase tracking-tighter ${board === b ? "text-[#6152a8]/70" : "text-[#5a6065]"}`}
                    >
                      {b === "State Board"
                        ? "State Specific"
                        : b === "ICSE"
                          ? "International"
                          : "National"}
                    </span>
                  </button>
                ))}
              </div>
              {board !== "CBSE" && board !== "ICSE" && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#5a6065] ml-1">
                      Specify your Board
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Himachal State Board"
                      value={board === "State Board" ? "" : board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full h-14 px-6 bg-white border-2 border-[#6152a8]/10 rounded-lg text-md focus:ring-2 focus:ring-[#6152a8]/20 focus:border-[#6152a8]/30 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Age Input */}
              <section className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-[#31638a] ml-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-16 px-6 bg-[#f1f4f8] border-none rounded-lg text-lg focus:ring-2 focus:ring-[#6152a8]/20 focus:bg-white transition-all outline-none"
                  placeholder="Years"
                />
              </section>

              {/* Segmented Control: Gender */}
              <section className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-[#31638a] ml-1">
                  Gender Identity
                </label>
                <div className="flex h-16 p-1.5 bg-[#f1f4f8] rounded-lg">
                  {["Male", "Female", "Other"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 rounded-md text-sm font-semibold transition-all ${
                        gender === g
                          ? "bg-white shadow-sm text-[#6152a8]"
                          : "text-[#5a6065] hover:text-[#2d3338]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Action Section */}
            <div className="pt-8 flex items-center justify-between">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-[#6152a8] font-bold px-4 py-2 hover:bg-[#6152a8]/5 rounded-full transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleContinue}
                className="bg-gradient-to-r from-[#6152a8] to-[#ae9ffb] text-white font-bold px-10 py-4 rounded-full shadow-xl shadow-[#6152a8]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Continue journey</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Success Feedback Overlay */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-full shadow-lg border border-white flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-[#3a675b] animate-pulse"></div>
        <p className="text-sm font-medium text-[#5a6065]">
          Your progress is being saved automatically.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
