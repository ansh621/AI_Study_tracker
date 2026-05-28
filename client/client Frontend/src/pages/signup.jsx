import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ParentDash from "./parent/ParentDash";
import Onboarding from "./student/Onboarding";
import Dashboard from "./student/Dashboard";

// --- Sub-components (Updated to handle props) ---

const FormInput = ({
  label,
  type,
  placeholder,
  icon,
  name,
  value,
  onChange,
}) => (
  <div className="group">
    <label className="block font-semibold text-[#5a6065] mb-2 ml-1 text-sm">
      {label}
    </label>
    <div className="relative">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        className="w-full bg-[#f1f4f8] border-none rounded-full px-6 py-4 text-[#2d3338] placeholder:text-[#757b81]/50 focus:ring-2 focus:ring-[#6152a8]/20 focus:bg-white transition-all outline-none"
      />
      {icon && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#5a6065] pointer-events-none">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      )}
    </div>
  </div>
);

// --- Main Page Component ---

const Signup = () => {
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    parentPhoneNumber: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure this endpoint matches your backend route
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: role,
          phoneNumber: formData.phoneNumber,
          parentPhoneNumber: formData.parentPhoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok && role === "student") {
        alert("Account created successfully!");
        navigate("/Onboarding"); // Redirect to onboarding page
      }

      if (response.ok && role === "parent") {
        alert("Account created successfully!");
        alert(`Welcome, ${data.name}! Your parent account has been created.`);
        navigate("/ParentDash"); // Redirect to dashboard page
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      alert(
        "Cannot connect to server. Ensure your backend is running on port 3000.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mx-8 my-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6152a8] to-[#ae9ffb] flex items-center justify-center text-white">
          <span className="material-symbols-outlined">auto_stories</span>
        </div>
        <span className="text-xl font-bold tracking-tighter text-[#6152a8]">
          Focus Nest
        </span>
      </div>
      <div className="bg-violet-100 text-[#2d3338] min-h-screen flex items-center justify-center p-6 sm:p-12 font-['Plus_Jakarta_Sans']">
        <main className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Editorial Section */}
          <div className="lg:col-span-5 space-y-10 order-2 lg:order-1">
            <header>
              <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6">
                Begin your journey <br /> towards{" "}
                <span className="text-[#6152a8] italic">focused mastery.</span>
              </h1>
              <p className="text-lg text-[#5a6065] max-w-md">
                A weightless digital environment designed for students who value
                clarity and parents who value growth.
              </p>
            </header>

            <div className="relative group max-w-sm">
              <div className="absolute inset-0 bg-[#6152a8]/5 rounded-xl blur-2xl"></div>
              <div className="relative bg-[#f1f4f8] p-8 rounded-xl space-y-6 border border-white/50">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full border-4 border-[#f1f4f8] bg-gray-400" />
                  <div className="w-12 h-12 rounded-full border-4 border-[#f1f4f8] bg-[#ae9ffb]" />
                </div>
                <blockquote className="text-[#5a6065] italic">
                  "The interface feels like fresh paper. It removes the digital
                  noise so I can actually focus on learning."
                </blockquote>
                <span className="block text-[10px] text-[#31638a] font-bold tracking-widest uppercase">
                  Member Spotlight
                </span>
              </div>
            </div>
          </div>

          {/* Signup Form Section */}
          <div className="lg:col-span-7 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-xl shadow-xl p-8 sm:p-12 border border-gray-100">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">Create your account</h2>
                <p className="text-[#5a6065]">
                  Step into your new study sanctum.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Role Selection */}
                <div className="flex p-1 bg-[#f1f4f8] rounded-full">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${role === "student" ? "bg-white text-[#6152a8] shadow-sm" : "text-[#5a6065]"}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("parent")}
                    className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${role === "parent" ? "bg-white text-[#6152a8] shadow-sm" : "text-[#5a6065]"}`}
                  >
                    Parent
                  </button>
                </div>

                <div className="space-y-5">
                  <FormInput
                    label="Full Name"
                    name="fullName"
                    type="text"
                    placeholder="Alice Johnson"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                  <FormInput
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="alice@focusnest.app"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {role === "student" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <FormInput
                        label="Parent's Mobile Number"
                        name="parentPhoneNumber"
                        type="tel"
                        placeholder="+91 98765-XXXXX"
                        value={formData.parentPhoneNumber}
                        onChange={handleChange}
                      />
                      <FormInput
                        label="Your Mobile Number"
                        name="phoneNumber"
                        type="tel"
                        placeholder="+91 98765-XXXXX"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                      <p className="text-[10px] text-[#6152a8] font-bold mt-2 ml-1 uppercase tracking-wider">
                        Required for student-parent linking
                      </p>
                    </div>
                  )}

                  {role === "parent" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <FormInput
                        label="Mobile Number"
                        name="phoneNumber"
                        type="tel"
                        placeholder="+91 98765-XXXXX"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                      <p className="text-[10px] text-[#6152a8] font-bold mt-2 ml-1 uppercase tracking-wider">
                        Required for student-parent linking
                      </p>
                    </div>
                  )}

                  <div className="group">
                    <label className="block font-semibold text-[#5a6065] mb-2 ml-1 text-sm">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#f1f4f8] border-none rounded-full px-6 py-4 text-[#2d3338] focus:ring-2 focus:ring-[#6152a8]/20 focus:bg-white transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[#5a6065]"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#6152a8] to-[#ae9ffb] text-white font-bold rounded-full shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? "Creating Sanctum..." : "Create Account"}
                  {!loading && (
                    <span className="material-symbols-outlined text-[20px]">
                      arrow_forward
                    </span>
                  )}
                </button>

                <div className="text-center mt-6">
                  <p className="text-[#5a6065] text-sm">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-[#6152a8] font-bold hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Signup;
