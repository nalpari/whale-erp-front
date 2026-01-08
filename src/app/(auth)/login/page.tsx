"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        loginId,
        password,
      });
      console.log("Login success:", response.data);

      const { accessToken, refreshToken } = response.data;
      setTokens(accessToken, refreshToken);

      // 로그인 성공 후 메인 페이지로 이동
      router.push("/");
    } catch (error: unknown) {
      console.log("Login failed:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message ?? "알 수 없는 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Brand Panel (Left) */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          {/* Whale Logo */}
          <div className="login-whale-logo">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M85 45c0-20-15-35-35-35S15 25 15 45c0 8 3 16 8 22l-8 18c-.5 1 .5 2 1.5 1.5l18-8c6 5 14 8 22 8 20 0 35-15 35-35z" />
              <ellipse cx="35" cy="40" rx="4" ry="5" fill="#0a0f1a" />
              <path
                d="M50 55c-8 0-15-3-15-7s7-7 15-7 15 3 15 7-7 7-15 7z"
                fill="#0a0f1a"
                opacity="0.3"
              />
              <path
                d="M70 30c5 5 8 12 8 20"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M25 60c-2 5-3 10-2 15"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </div>

          <h1 className="login-brand-title">
            Whale <span>ERP</span>
          </h1>
          <p className="login-brand-tagline">
            Streamline your business operations with intelligent enterprise solutions
          </p>
        </div>

        {/* Wave Decoration */}
        <div className="login-wave-decoration">
          <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path
              d="M0,100 C150,150 350,50 600,100 C850,150 1050,50 1200,100 L1200,200 L0,200 Z"
              fill="rgba(59, 130, 246, 0.1)"
            />
            <path
              d="M0,120 C200,170 400,70 600,120 C800,170 1000,70 1200,120 L1200,200 L0,200 Z"
              fill="rgba(37, 99, 235, 0.08)"
            />
          </svg>
        </div>
      </div>

      {/* Form Panel (Right) */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Form Header */}
          <div className="login-form-header">
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleLogin}>
            {/* Login ID Input */}
            <div className="login-input-group">
              <label htmlFor="loginId" className="login-input-label">
                Login ID
              </label>
              <div className="login-input-wrapper">
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  required
                  className="login-input"
                  placeholder="Enter your login ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                />
                <svg
                  className="login-input-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Password Input */}
            <div className="login-input-group">
              <label htmlFor="password" className="login-input-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <svg
                  className="login-input-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="login-options-row">
              <label className="login-remember-me">
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="login-checkbox-label">Remember me</span>
              </label>
              <a href="#" className="login-forgot-link">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? (
                <span className="login-btn-spinner">
                  <span className="login-spinner" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Divider */}
            {/* <div className="login-divider">
              <span className="login-divider-line" />
              <span className="login-divider-text">or</span>
              <span className="login-divider-line" />
            </div> */}

            {/* Social Login Buttons */}
            {/* <div className="login-social-buttons">
              <button type="button" className="login-social-btn">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button type="button" className="login-social-btn">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div> */}
          </form>

          {/* Footer */}
          {/* <div className="login-footer">
            <p className="login-footer-text">
              Don&apos;t have an account?{" "}
              <a href="#" className="login-footer-link">
                Contact administrator
              </a>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
