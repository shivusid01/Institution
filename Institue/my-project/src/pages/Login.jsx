import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [forgotData, setForgotData] = useState({
    phone: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [autoReceivedOtp, setAutoReceivedOtp] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (!result || !result.success) {
        setErrors({
          general: result?.error || "Invalid email or password",
        });
        return;
      }

      if (result.user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    } catch (error) {
      setErrors({ general: "Login failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password modal functions
  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (forgotErrors[name]) {
      setForgotErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotData.phone.trim() || !/^[0-9]{10}$/.test(forgotData.phone.trim())) {
      setForgotErrors({ phone: "Please enter a valid 10-digit phone number" });
      return;
    }

    setForgotSubmitting(true);
    setForgotErrors({});
    setForgotMessage("");

    try {
      const response = await authAPI.sendOTP({ phone: forgotData.phone.trim() });
      if (response.data.success) {
        setForgotMessage("OTP sent successfully. Please check your phone.");
        setForgotStep(2);

        if (response.data.otp) {
          setAutoReceivedOtp(response.data.otp);
          setForgotData((prev) => ({ ...prev, otp: response.data.otp }));
        }
      }
    } catch (err) {
      setForgotErrors({
        general:
          err.response?.data?.message ||
          "Failed to send OTP. Please make sure the number is registered.",
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!forgotData.otp.trim()) errs.otp = "OTP is required";
    if (!forgotData.newPassword) errs.newPassword = "New password is required";
    if (forgotData.newPassword.length < 6)
      errs.newPassword = "Password must be at least 6 characters";
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setForgotErrors(errs);
      return;
    }

    setForgotSubmitting(true);
    setForgotErrors({});
    setForgotMessage("");

    try {
      const response = await authAPI.resetPasswordOTP({
        phone: forgotData.phone.trim(),
        otp: forgotData.otp.trim(),
        newPassword: forgotData.newPassword,
      });

      if (response.data.success) {
        setForgotMessage("Password reset successfully! Closing modal...");
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setForgotData({ phone: "", otp: "", newPassword: "", confirmPassword: "" });
          setAutoReceivedOtp("");
          setForgotMessage("");
        }, 2000);
      }
    } catch (err) {
      setForgotErrors({
        general:
          err.response?.data?.message ||
          "Failed to reset password. Please check your OTP.",
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gray-50 fade-in">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1a365d]">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your coaching account to access lectures & materials
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.email ? "border-red-500" : "border-gray-300 bg-blue-50/30"
                }`}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.password ? "border-red-500" : "border-gray-300 bg-blue-50/30"
                }`}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold text-sm transition-all duration-200 ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-sm"
            }`}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 pt-2">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-800">
            Sign up
          </Link>
        </p>
      </div>

      {/* OTP Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-gray-100">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotData({ phone: "", otp: "", newPassword: "", confirmPassword: "" });
                setAutoReceivedOtp("");
                setForgotErrors({});
                setForgotMessage("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="text-xl font-extrabold text-blue-900 mb-2">Forgot Password?</h3>
            <p className="text-xs text-gray-500 mb-5">
              Reset your password using phone number OTP authentication.
            </p>

            {forgotErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
                {forgotErrors.general}
              </div>
            )}
            {forgotMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold">
                {forgotMessage}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={forgotData.phone}
                      onChange={handleForgotChange}
                      placeholder="Enter 10-digit number"
                      className={`w-full px-3 py-2 border rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        forgotErrors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                  </div>
                  {forgotErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{forgotErrors.phone}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                >
                  {forgotSubmitting ? "Sending OTP..." : "Request Verification OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {autoReceivedOtp && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs">
                    💡 <strong>Test Helper:</strong> Auto-captured OTP code is: <strong>{autoReceivedOtp}</strong>.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">OTP Code</label>
                  <input
                    type="text"
                    name="otp"
                    value={forgotData.otp}
                    onChange={handleForgotChange}
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest font-bold ${
                      forgotErrors.otp ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                  {forgotErrors.otp && (
                    <p className="mt-1 text-xs text-red-600">{forgotErrors.otp}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={forgotData.newPassword}
                    onChange={handleForgotChange}
                    placeholder="Min 6 characters"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      forgotErrors.newPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                  {forgotErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">{forgotErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={forgotData.confirmPassword}
                    onChange={handleForgotChange}
                    placeholder="Re-enter password"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      forgotErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                  {forgotErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{forgotErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                >
                  {forgotSubmitting ? "Resetting..." : "Confirm & Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;