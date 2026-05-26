import React, { useState } from "react";
import Dashboard from "./student/Dashboard";
import Onboarding from "./student/Onboarding";
import ParentDash from "./parent/ParentDash";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Backend Connection
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData }),
        credentials: "include", // Important for receiving cookies
      });

      const data = await response.json();

      if (response.ok && data.role === "student") {
        const token = data.token; // Assuming your backend sends the token in the response body
        localStorage.setItem("Token", token); // Store the token in localStorage for future authenticated requests
        console.log("Login Success:", data);
       

        alert("Login successful! Redirecting to your dashboard...");
        navigate("/Dashboard"); // Redirect to dashboard after successful login
      }
      if (response.ok && 
         data.role === "parent") {
        const token = data.token; // Assuming your backend sends the token in the response body
        localStorage.setItem("Token", token); // Store the token in localStorage for future authenticated requests
        console.log("Login Success: ", data.token);

        alert("Login successful! Redirecting to your dashboard...");
        navigate("/ParentDash"); // Redirect to dashboard after successful login
      } else {
        alert(data.message || "Login failed. Check your credentials.");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Server is offline. Check your backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fc] text-[#2d3338] min-h-screen flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-[#ae9ffb]">
      {/* Header - Optimized for Mobile */}
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 py-4 md:py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#6152a8] to-[#ae9ffb] rounded-lg md:rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">auto_stories</span>
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tighter text-[#6152a8]">Focus Nest</span>
        </div>
        <Link to="/signup" className="text-[#6152a8] text-sm font-bold md:bg-[#e4e9ee] md:px-6 md:py-2.5 md:rounded-full">
          Sign Up
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
        {/* Background Accents - Hidden on small screens for performance */}
        <div className="hidden md:block absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#6152a8]/5 blur-[120px]"></div>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          
          {/* Left Column - Hidden on Mobile, Shown on LG */}
          <div className="hidden lg:flex flex-col gap-10 pr-12">
            <div className="space-y-6">
              <span className="text-[#31638a] font-semibold tracking-widest text-xs uppercase">Welcome Back</span>
              <h1 className="text-6xl font-bold text-[#2d3338] leading-[1.1]">
                Cultivating <span className="text-[#6152a8] italic">Clarity</span> in Learning.
              </h1>
              <p className="text-[#5a6065] text-lg max-w-md">Step back into your weightless workspace.</p>
            </div>
            <img 
                src="https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg" 
                className="rounded-3xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 h-80 object-cover" 
                alt="study"
            />
          </div>

          {/* Right Column: Login Card - Mobile First (Full width on small, contained on large) */}
          <div className="w-full flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 md:p-14 shadow-xl border border-gray-50">
              
              {/* Identity Toggle */}
              

              <div className="mb-8 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2d3338]">Sign in</h2>
                <p className="text-[#5a6065] text-sm mt-2">Enter your details to continue</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2d3338] uppercase ml-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@academy.com"
                    className="w-full bg-[#f1f4f8] border-none rounded-xl px-5 py-4 text-[#2d3338] focus:ring-2 focus:ring-[#6152a8]/20 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2d3338] uppercase ml-1">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-[#f1f4f8] border-none rounded-xl px-5 py-4 text-[#2d3338] focus:ring-2 focus:ring-[#6152a8]/20 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a6065]"
                    >
                      <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#6152a8] to-[#ae9ffb] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#6152a8]/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
