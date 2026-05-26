import  { React,useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { ESModulesEvaluator } from 'vite/module-runner';



const SUBJECT_DATA = {
  common: [
    { id: 'math', name: 'Mathematics', sub: 'Arithmetic & Geometry', icon: 'calculate' },
    { id: 'science', name: 'Science', sub: 'Physics, Chem, Bio', icon: 'science' },
    { id: 'social', name: 'Social Science', sub: 'History, Civics, Geo', icon: 'public' },
    { id: 'english', name: 'English', sub: 'Literature & Grammar', icon: 'auto_stories' },
    { id: 'hindi', name: 'Hindi', sub: 'Sahitya & Vyakaran', icon: 'translate' },
    { id: 'cs', name: 'Computer App', sub: 'Basics & Office', icon: 'laptop' }
  ],
  streams: {
    Science: [
      { id: 'physics', name: 'Physics', sub: 'Mechanics & Optics', icon: 'rocket_launch' },
      { id: 'chemistry', name: 'Chemistry', sub: 'Organic & Inorganic', icon: 'biotech' },
      { id: 'math', name: 'Mathematics', sub: 'Calculus & Algebra', icon: 'calculate' },
      { id: 'biology', name: 'Biology', sub: 'Botany & Zoology', icon: 'eco' },
      { id: 'cs', name: 'Computer Science', sub: 'Python & DS', icon: 'terminal' }
    ],
    Commerce: [
      { id: 'accounts', name: 'Accountancy', sub: 'Financial Audit', icon: 'account_balance_wallet' },
      { id: 'bst', name: 'Business Studies', sub: 'Management', icon: 'corporate_fare' },
      { id: 'eco', name: 'Economics', sub: 'Macro & Micro', icon: 'trending_up' },
      { id: 'math', name: 'Applied Math', sub: 'Commerce Math', icon: 'calculate' }
    ],
    Arts: [
      { id: 'history', name: 'History', sub: 'Indian & World', icon: 'history_edu' },
      { id: 'pol', name: 'Political Science', sub: 'Constitution', icon: 'gavel' },
      { id: 'geog', name: 'Geography', sub: 'Physical Map', icon: 'public' },
      { id: 'psy', name: 'Psychology', sub: 'Human Mind', icon: 'psychology' }
    ]
  }
};

const SubjectSelection = (  ) => {
    const { onboardingData } = useLocation().state || {};
  const navigate = useNavigate();
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const isSenior = parseInt(onboardingData.grade) > 10;
  const visibleSubjects = isSenior 
    ? (selectedStream ? SUBJECT_DATA.streams[selectedStream] : []) 
    : SUBJECT_DATA.common;

  const toggleSubject = (name) => {
    setSelectedSubjects(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleContinue = async () => {
    if (isSenior && !selectedStream) return alert("Please select a stream first.");
    if (selectedSubjects.length === 0) return alert("Select at least one subject.");

    try {
      const response = await fetch("http://localhost:3000/api/student/student-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          
          stream: isSenior ? selectedStream : "General",
          subjects: selectedSubjects
        })
      });

      if (response.ok) {
        const resp = await fetch("http://localhost:3000/api/ai/generate-syllabus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            subjects: selectedSubjects, // Generate syllabus for the first selected subject
            grade: onboardingData.grade,
            board: onboardingData.board
          })
        });

        if (!resp.ok) {
          alert("Syllabus generation failed");
        }
        else{
          alert("Syllabus generated successfully");
          
        }
        navigate("/dashboard")
        
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  return (
    <div className="bg-[#f8f9fc] text-[#2d3338] min-h-screen flex flex-col font-['Plus_Jakarta_Sans']">
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-10 pb-32">
        
       
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Set up Focus Nest</h2>
          <p className="text-[#5a6065] mt-2">Class {onboardingData.grade} • {onboardingData.board} Board</p>
        </div>

        
        {isSenior && (
          <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#6152a8] mb-4">Select Stream</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(SUBJECT_DATA.streams).map(stream => (
                <button
                  key={stream}
                  onClick={() => { setSelectedStream(stream); setSelectedSubjects([]); }}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    selectedStream === stream 
                    ? "border-[#6152a8] bg-[#6152a8] text-white shadow-md" 
                    : "border-transparent bg-white text-[#5a6065] hover:bg-[#ebeef3]"
                  }`}
                >
                  {stream}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Subject Grid */}
        {(!isSenior || selectedStream) && (
          <section className="animate-in fade-in duration-700">
            <h3 className="text-lg font-bold mb-6">Choose your Subjects</h3>
            <div className="grid grid-cols-2 gap-4">
              {visibleSubjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject.name);
                return (
                  <div
                    key={subject.id}
                    onClick={() => toggleSubject(subject.name)}
                    className={`p-5 rounded-2xl cursor-pointer transition-all relative border-2 ${
                      isSelected 
                      ? "bg-white border-[#6152a8] shadow-lg scale-[1.02]" 
                      : "bg-[#ebeef3] border-transparent hover:border-[#adb3b8]"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${isSelected ? 'bg-[#6152a8] text-white' : 'bg-white text-[#6152a8]'}`}>
                      <span className="material-symbols-outlined text-xl">{subject.icon}</span>
                    </div>
                    <h4 className="font-bold text-md">{subject.name}</h4>
                    <p className="text-[#5a6065] text-xs mt-1">{subject.sub}</p>
                    
                    {isSelected && (
                      <div className="absolute top-4 right-4 text-[#6152a8]">
                        <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Persistent Action Bar */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-6 border-t border-[#ebeef3]">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleContinue}
            className="w-full bg-[#6152a8] text-white font-bold py-4 rounded-full shadow-lg hover:bg-[#55469b] transition-all active:scale-95 disabled:opacity-50"
            disabled={selectedSubjects.length === 0}
          >
            Finalize My Dashboard
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SubjectSelection;
