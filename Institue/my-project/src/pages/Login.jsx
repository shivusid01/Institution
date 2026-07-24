import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP, 3: Complete Profile
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Registration data for step 3
  const [registrationData, setRegistrationData] = useState({
    name: "",
    email: "",
    course: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoReceivedOtp, setAutoReceivedOtp] = useState("");
  const [timer, setTimer] = useState(30);

  const navigate = useNavigate();
  const otpInputsRef = useRef([]);

  // Resend OTP timer logic
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Send OTP to Phone
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      setErrors({ phone: "Please enter a valid 10-digit mobile number" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await authAPI.sendLoginOTP({ phone });
      if (response.data.success) {
        setIsNewUser(response.data.isNewUser);
        setStep(2);
        setTimer(30);
        
        // Auto fill OTP in dev mode
        if (response.data.otp) {
          setAutoReceivedOtp(response.data.otp);
          setOtp(response.data.otp.split(""));
          console.log("🔥 [DEV TEST] Auto-captured OTP:", response.data.otp);
        }
      } else {
        setErrors({ general: response.data.message || "Failed to send OTP" });
      }
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Failed to send OTP. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6 || isNaN(otpCode)) {
      setErrors({ otp: "Please enter a 6-digit OTP code" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await authAPI.verifyLoginOTP({ phone, otp: otpCode });
      if (response.data.success) {
        if (response.data.isNewUser) {
          // New user: must complete registration (Step 3)
          setStep(3);
        } else {
          // Existing user: logged in successfully
          const { token, user } = response.data;
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          
          if (user.role === "admin") {
            window.location.href = "/admin/dashboard";
          } else {
            window.location.href = "/student/dashboard";
          }
        }
      } else {
        setErrors({ otp: response.data.message || "Invalid OTP code" });
      }
    } catch (err) {
      setErrors({
        otp: err.response?.data?.message || "OTP verification failed. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    const { name, email, course } = registrationData;
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Valid email is required";
    if (!course) newErrors.course = "Please select your class or course";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await authAPI.completeOTPRegistration({
        phone,
        name,
        email,
        course
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        window.location.href = "/student/dashboard";
      } else {
        setErrors({ general: response.data.message || "Failed to complete registration" });
      }
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Failed to complete registration. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP inputs handlers
  const handleOtpInputChange = (e, idx) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    newOtp[idx] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (val && idx < 5) {
      otpInputsRef.current[idx + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!otp[idx] && idx > 0) {
        const newOtp = [...otp];
        newOtp[idx - 1] = "";
        setOtp(newOtp);
        otpInputsRef.current[idx - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[idx] = "";
        setOtp(newOtp);
      }
    }
  };

  // Courses list matching standard signup page
  const courses = [
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8",
    "Class 9", "Class 10",
    "Class 11 (Commerce)", "Class 12 (Commerce)",
    "B.COM 1st Year", "B.COM 2nd Year", "B.COM 3rd Year",
    "M.COM",
    "Competition Exams"
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-6 lg:px-12 bg-white fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl w-full mx-auto">
        
        {/* Left Side: Login / Verification Box */}
        <div className="lg:col-span-7 flex flex-col justify-center max-w-md mx-auto lg:mx-0 w-full">
          
          {step === 1 && (
            <>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-[#3c4852] leading-tight tracking-tight mb-2">
                Crack your goal with Sharma Institute's top educators
              </h1>
              <p className="text-sm text-gray-500 font-medium mb-6">
                Over 10 crore learners trust us for their preparation
              </p>

              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold animate-shake">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className={`border rounded-xl flex items-center px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all ${errors.phone ? 'border-red-500' : 'border-[#d0d6de]'}`}>
                  <div className="flex items-center gap-1.5 cursor-default mr-3 pr-3 border-r border-[#e9edf2] text-sm text-[#3c4852] font-semibold">
                    <span className="text-lg">🇮🇳</span>
                    <span>+91</span>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPhone(val);
                      if (errors.phone) setErrors({});
                    }}
                    placeholder="Enter your mobile number"
                    className="w-full text-base text-[#3c4852] font-semibold placeholder:text-gray-400 placeholder:font-normal focus:outline-none bg-transparent"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-600 font-semibold">{errors.phone}</p>
                )}

                <p className="text-xs text-[#7a8b94] font-medium mt-1">
                  We'll send an OTP for verification
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3.5 bg-[#3c4852] hover:bg-[#2c3842] disabled:bg-gray-300 text-white font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Sending OTP..." : "Join for free"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-400 font-medium">
                New user? Enter your number to get registered instantly!
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp(Array(6).fill(""));
                    setErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  Change number
                </button>
              </div>

              <h2 className="text-2xl lg:text-3xl font-extrabold text-[#3c4852] leading-tight tracking-tight mb-2">
                Verify OTP
              </h2>
              <p className="text-sm text-gray-500 font-medium mb-6">
                Enter the 6-digit OTP code sent to <strong className="text-gray-800">+91 {phone}</strong>
              </p>

              {autoReceivedOtp && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs">
                  💡 <strong>Test Helper:</strong> Auto-captured OTP code is: <strong>{autoReceivedOtp}</strong> (already filled).
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex justify-between gap-2 max-w-sm">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInputChange(e, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className={`w-12 h-14 border rounded-xl text-center font-bold text-xl text-[#3c4852] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.otp ? "border-red-500" : "border-[#d0d6de]"
                      }`}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-xs text-red-600 font-semibold">{errors.otp}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  {timer > 0 ? (
                    <span className="text-gray-400 font-medium">Resend OTP in {timer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#3c4852] hover:bg-[#2c3842] disabled:bg-gray-300 text-white font-bold text-base rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? "Verifying..." : "Verify & Proceed"}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-[#3c4852] leading-tight tracking-tight mb-2">
                Complete Your Profile
              </h2>
              <p className="text-sm text-gray-500 font-medium mb-6">
                Enter your details to finalize your registration for Sharma Institute
              </p>

              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={registrationData.name}
                    onChange={(e) => {
                      setRegistrationData({ ...registrationData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-[#d0d6de]"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={registrationData.email}
                    onChange={(e) => {
                      setRegistrationData({ ...registrationData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="name@gmail.com"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-500" : "border-[#d0d6de]"
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Select Your Course / Class</label>
                  <select
                    value={registrationData.course}
                    onChange={(e) => {
                      setRegistrationData({ ...registrationData, course: e.target.value });
                      if (errors.course) setErrors({ ...errors, course: "" });
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                      errors.course ? "border-red-500" : "border-[#d0d6de]"
                    }`}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Choose your class...</option>
                    {courses.map((course, idx) => (
                      <option key={idx} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                  {errors.course && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.course}</p>}
                </div>

                <div className="flex items-start mt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    defaultChecked
                    className="mt-1 mr-3 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-500 font-medium">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 font-bold hover:underline">Terms & Conditions</a>
                    {" "}and{" "}
                    <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3.5 bg-[#3c4852] hover:bg-[#2c3842] disabled:bg-gray-300 text-white font-bold text-base rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? "Finalizing..." : "Complete Registration & Login"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Side: Flat Vector Illustration in Circular Border */}
        <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
          <div className="w-[600px] h-[600px] xl:w-[540px] xl:h-[540px] flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-[1.02]">
            <img
              src="https://plus.unsplash.com/premium_vector-1682307798482-3d415c287228?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Student reading vector illustration"
              className="w-full h-full object-contain select-none"
              onError={(e) => {
                e.target.src = "https://img.freepik.com/free-vector/learning-concept-illustration_114360-6186.jpg";
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;