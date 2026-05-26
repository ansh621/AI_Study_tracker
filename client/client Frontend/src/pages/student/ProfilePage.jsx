import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar";
import {
  ArrowLeft,
  Settings,
  Flame,
  School,
  BookOpen,
  BarChart3,
  Users,
  User,
} from "lucide-react";
const FEMALE_DP_URL = "https://i.pinimg.com/1200x/52/ab/65/52ab657ec99f64c416b026a3bc8dc7df.jpg";
const MALE_DP_URL = "https://i.pinimg.com/1200x/62/6d/72/626d72baaf98ece97098fbdcef8ece2b.jpg";
const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    stream: "",
    board: "",
    gender: "",
    subjectsCsv: "",
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // 2. Correct Hook placement
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/student/profile",
          {
            method: "GET",
            credentials: "include",
          },
        );

        const result = await response.json();

        if (response.ok) {
          setProfile(result.data);
          setForm({
            name: result.data?.name || "",
            age: result.data?.age || "",
            grade: result.data?.grade || "",
            stream: result.data?.stream || "",
            board: result.data?.board || "",
            gender: result.data?.gender || "",
            subjectsCsv: (result.data?.subjects || []).join(", "),
          });
        } else {
          console.error("Auth Error:", result.message);
        }
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array means this runs ONCE on mount

  if (!profile)
    return (
      <div className="flex h-screen items-center justify-center">
        Error loading profile.
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3338] font-sans">
      <header className="fixed top-0 w-full bg-[#f8f9fc]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full text-[#6152a8]"
            onClick={() => {
              navigate("/dashboard");
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-semibold text-lg">Profile</h1>
        </div>
        <button
          className="p-2 rounded-full text-[#6152a8]"
          onClick={() => setEditMode((prev) => !prev)}
        >
          <Settings size={24} />
        </button>
      </header>
      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
        {/* Profile Header */}
        <section className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#6152a8] to-[#3a675b]">
              <img
                src={
                  profile?.gender?.toLowerCase() === "female"
                    ? FEMALE_DP_URL
                    : MALE_DP_URL
                }
                alt={profile?.name}
                className="w-full h-full object-cover rounded-full border-4 border-[#f8f9fc]"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white shadow-md px-4 py-2 rounded-full flex items-center gap-2">
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              {/* Access the .count property specifically */}
              <span className="text-xs font-bold">
                {profile?.streak?.count || 0} Day Streak
              </span>
            </div>
          </div>
          <div>
            
            <h2 className="text-3xl font-extrabold tracking-tight">
              {profile?.name}
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Student 
            </p>
          </div>
        </section>
        {editMode && (
          <section className="bg-white p-6 rounded-2xl border border-gray-100 space-y-3">
            <h3 className="text-lg font-bold">Edit Profile</h3>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full rounded-xl border px-4 py-3" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" type="number" className="w-full rounded-xl border px-4 py-3" />
              <input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Gender" className="w-full rounded-xl border px-4 py-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Grade" className="w-full rounded-xl border px-4 py-3" />
              <input value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} placeholder="Stream" className="w-full rounded-xl border px-4 py-3" />
            </div>
            <input value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} placeholder="Board" className="w-full rounded-xl border px-4 py-3" />
            <textarea value={form.subjectsCsv} onChange={(e) => setForm({ ...form, subjectsCsv: e.target.value })} placeholder="Subjects comma-separated" className="w-full rounded-xl border px-4 py-3 h-24" />
            <button
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true);
                  const token = localStorage.getItem("Token");
                  const response = await fetch("http://localhost:3000/api/student/profile", {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      name: form.name,
                      age: form.age,
                      grade: form.grade,
                      stream: form.stream,
                      board: form.board,
                      gender: form.gender,
                      subjects: form.subjectsCsv.split(",").map((item) => item.trim()).filter(Boolean),
                    }),
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.message || "Failed to update profile");
                  setProfile(result.data);
                  setEditMode(false);
                } catch (error) {
                  console.error(error);
                } finally {
                  setSaving(false);
                }
              }}
              className="w-full rounded-xl bg-[#6152a8] text-white py-3 font-bold disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </section>
        )}

        {/* Academic Identity */}
        <section className="bg-gray-100/50 p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-1">
              Academic Identity
            </p>
            <h3 className="text-2xl font-bold">Grade {profile?.grade}</h3>
            <p className="text-gray-500">{profile?.stream} Track</p>
          </div>
          <School
            size={120}
            className="absolute -right-4 -bottom-4 opacity-5"
          />
        </section>
        <section className="bg-gray-100/50 p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-1">
              Personal Identity
            </p>
            <h3 className="text-2xl font-bold">Age {profile?.age}</h3>
            <p className="text-gray-500">{profile?.board} Board</p>
            <p className="text-gray-500"> Gender: {profile?.gender} </p>
          </div>
          <User size={120} className="absolute -right-4 -bottom-4 opacity-5" />
        </section>
        <section className="bg-gray-100/50 p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-1">
              Subjects
            </p>
            <h3 className="text-2xl font-bold">
              {profile?.subjects.length} Subjects
            </h3>
            <p className="text-gray-500">{profile?.subjects.join(", ")}</p>
          </div>
          <BookOpen
            size={120}
            className="absolute -right-4 -bottom-4 opacity-5"
          />
        </section>

        {/* Rest of your UI components go here using userData... */}
      </main>
      <NavBar />
    </div>
  );
};

export default ProfilePage;
