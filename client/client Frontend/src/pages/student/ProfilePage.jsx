import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Flame, 
  School, 
  BookOpen, 
  BarChart3, 
  Users, 
  User 
} from 'lucide-react';
const ProfilePage = () => {
  // 1. Initialize state with null or loading defaults
  
const [profile, setProfile] = useState(null);


  // 2. Correct Hook placement
  useEffect(() => {
   

const fetchProfile = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/student/profile', {
      method: "GET",
      credentials: "include" 
    });

    const result = await response.json();

    if (response.ok) {
      // Accessing the 'data' key we defined in the controller
      setProfile(result.data); 
    } else {
      console.error("Auth Error:", result.message);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
};

    fetchProfile();
     
  }, []); // Empty dependency array means this runs ONCE on mount

  // 3. Handle the loading state (don't try to render undefined data)
  if (!profile) return <div className="flex h-screen items-center justify-center">Error loading profile.</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3338] font-sans">
      <header className="fixed top-0 w-full bg-[#f8f9fc]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full text-[#6152a8]"><ArrowLeft size={24} /></button>
          <h1 className="font-semibold text-lg">Profile</h1>
        </div>
        <button className="p-2 rounded-full text-[#6152a8]"><Settings size={24} /></button>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
        {/* Profile Header */}
        <section className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#6152a8] to-[#3a675b]">
              <img 
                src={profile?.profileImage || "https://i.pinimg.com/1200x/1a/fa/89/1afa89a6e93c2baf313a1857694e1a57.jpg"} 
                alt={profile?.name} 
                className="w-full h-full object-cover rounded-full border-4 border-[#f8f9fc]"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white shadow-md px-4 py-2 rounded-full flex items-center gap-2">
              <Flame size={16} className="text-orange-500 fill-orange-500" />
              <span className="text-xs font-bold">{profile?.streak} Day Streak</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{profile?.name}</h2>
            <p className="text-gray-500 font-medium mt-1">Student | {profile?.age}</p>
          </div>
        </section>

        {/* Academic Identity */}
        <section className="bg-gray-100/50 p-8 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-1">Academic Identity</p>
            <h3 className="text-2xl font-bold">Grade {profile?.grade}</h3>
            <p className="text-gray-500">{profile?.stream} Track</p>
          </div>
          <School size={120} className="absolute -right-4 -bottom-4 opacity-5" />
        </section>
        
        {/* Rest of your UI components go here using userData... */}
      </main>

      <nav className="fixed bottom-0 left-0 w-full px-4 pb-6 pt-3 bg-white border-t flex justify-around items-center">
        <NavItem icon={<BookOpen size={24} />} label="Learn" />
        <NavItem icon={<BarChart3 size={24} />} label="Insights" />
        <NavItem icon={<Users size={24} />} label="Social" />
        <NavItem icon={<User size={24} />} label="Profile" active />
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <button className={`flex flex-col items-center px-5 py-2 ${active ? 'text-[#6152a8]' : 'text-gray-400'}`}>
    {icon}
    <span className="text-[11px] font-medium mt-1">{label}</span>
  </button>
);

export default ProfilePage;