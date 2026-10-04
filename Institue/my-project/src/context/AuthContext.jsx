import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ======================================================
     SESSION TIMEOUT HELPERS
  ====================================================== */
  const isSessionExpired = () => {
    const lastActivity = localStorage.getItem("lastActivity");
    if (!lastActivity) return true;
    return Date.now() - parseInt(lastActivity, 10) > SESSION_TIMEOUT_MS;
  };

  const updateLastActivity = () => {
    localStorage.setItem("lastActivity", Date.now().toString());
  };

  /* ======================================================
     RESTORE SESSION ON REFRESH & CHECK EXPIRATION
  ====================================================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      if (isSessionExpired()) {
        console.log("⏰ Session expired on startup");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastActivity");
        setUser(null);
      } else {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          updateLastActivity();
          console.log("✅ Session restored:", parsedUser.email);
        } catch (err) {
          console.error("❌ Error restoring session:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("lastActivity");
          setUser(null);
        }
      }
    }

    setLoading(false);
  }, []);

  /* ======================================================
     ACTIVITY LISTENER & PERIODIC SESSION TIMEOUT CHECK
  ====================================================== */
  useEffect(() => {
    if (!user) return;

    // Check every 30 seconds if the session has expired
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        console.log("⏰ Session timed out due to inactivity. Logging out...");
        logout();
      }
    }, 30000);

    // Throttle updating lastActivity to at most once per 60 seconds
    let lastUpdate = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 60000) {
        lastUpdate = now;
        updateLastActivity();
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleUserActivity));

    return () => {
      clearInterval(interval);
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, [user]);

  /* ======================================================
     UPDATE USER (NEW ✅)
  ====================================================== */
  const updateUser = (userData) => {
    setUser((prev) => ({
      ...prev,
      ...userData,
    }));

    // sync with localStorage
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...currentUser,
        ...userData,
      })
    );

    console.log("🔄 User updated:", userData);
  };

  /* ======================================================
     LOGIN
  ====================================================== */
  const login = async (credentials) => {
    try {
      setError(null);
      console.log("🔐 Login attempt for:", credentials.email);

      const response = await authAPI.login(credentials);

      const { success, token, user: userData, message } = response.data;

      if (!success || !userData) {
        return {
          success: false,
          error: message || "Login failed",
        };
      }

      const userWithRole = {
        ...userData,
        role: userData.role || "student",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userWithRole));
      updateLastActivity();
      setUser(userWithRole);

      console.log("✅ Login successful:", userWithRole.email);

      return {
        success: true,
        user: userWithRole,
        token,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Server error. Please try again.";

      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /* ======================================================
     SIGNUP
  ====================================================== */
  const signup = async (userData) => {
    try {
      setError(null);

      const response = await authAPI.register(userData);

      if (!response.data.success) {
        return {
          success: false,
          error: response.data.message,
        };
      }

      const { token, user: newUser } = response.data;

      const userWithRole = {
        ...newUser,
        role: newUser.role || "student",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userWithRole));
      updateLastActivity();
      setUser(userWithRole);

      console.log("✅ Signup successful:", userWithRole.email);

      return {
        success: true,
        user: userWithRole,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);
      return {
        success: false,
        error: message,
      };
    }
  };

  /* ======================================================
     GOOGLE LOGIN
  ====================================================== */
  const googleLogin = async (credentialData) => {
    try {
      setError(null);
      console.log("🔐 Google login attempt");

      const response = await authAPI.googleLogin(credentialData);

      const { success, token, user: userData, message } = response.data;

      if (!success || !userData) {
        return {
          success: false,
          error: message || "Google login failed",
        };
      }

      const userWithRole = {
        ...userData,
        role: userData.role || "student",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userWithRole));
      updateLastActivity();
      setUser(userWithRole);

      console.log("✅ Google login successful:", userWithRole.email);

      return {
        success: true,
        user: userWithRole,
        token,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Google authentication failed. Please try again.";

      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /* ======================================================
     LOGOUT
  ====================================================== */
  const logout = () => {
    console.log("🚪 Logging out:", user?.email);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user, // ✅ backward compatibility
        loading,
        error,
        login,
        signup,
        googleLogin,
        logout,
        updateUser, // ✅ ADDED
        clearError,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
