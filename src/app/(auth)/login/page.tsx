"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
  loginRequestSchema,
  type Authority,
} from "@/lib/schemas/auth";
import { formatZodFieldErrors } from "@/lib/zod-utils";
import FindIdPw from "@/components/login/FindIdPw";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setAuthority = useAuthStore((state) => state.setAuthority);
  const setAffiliationId = useAuthStore((state) => state.setAffiliationId);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 모달 관련 상태
  const [showAuthorityModal, setShowAuthorityModal] = useState(false);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [pendingTokens, setPendingTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string | null>(
    null
  );

  // ID/Password 찾기 팝업 상태
  const [showFindIdPw, setShowFindIdPw] = useState(false);

  const handleClearLoginId = () => {
    setLoginId("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Zod로 폼 유효성 검사
    const validation = loginRequestSchema.safeParse({ loginId, password });
    if (!validation.success) {
      setFormErrors(formatZodFieldErrors(validation.error));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", validation.data);
      console.log("Login success:", response.data);

      const { accessToken, refreshToken, authorities } = response.data.data;

      console.log(authorities);
      // authorities 처리
      if (authorities && authorities.length === 1) {
        console.log("Processing single authority...");
        // authorities가 하나인 경우: authorities API 호출
        const authoritiesResponse = await api.get(
          `/api/system/authorities/${authorities[0].id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log("Authorities:", authoritiesResponse.data);

        // zustand에 authority detail 저장
        if (authoritiesResponse.data?.data?.detail) {
          setAuthority(authoritiesResponse.data.data.detail);
        }

        // affiliation header 설정을 위한 id 저장
        setAffiliationId(authorities[0].id);

        setTokens(accessToken, refreshToken);

        // 로그인 성공 후 메인 페이지로 이동
        router.push("/");
      } else if (authorities && authorities.length > 1) {
        // authorities가 여러 개인 경우: 모달로 선택하도록 함
        console.log("Multiple authorities found:", authorities);
        setAuthorities(authorities);
        setPendingTokens({ accessToken, refreshToken });
        setShowAuthorityModal(true);
      }
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

  // Authority 선택 처리
  const handleSelectAuthority = async (authority: Authority) => {
    if (!pendingTokens) return;

    setSelectedAuthorityId(authority.id);

    try {
      const authoritiesResponse = await api.get(
        `/api/system/authorities/${authority.id}`,
        {
          headers: {
            Authorization: `Bearer ${pendingTokens.accessToken}`,
          },
        }
      );
      console.log("Selected Authority:", authoritiesResponse.data);

      // zustand에 authority detail 저장
      if (authoritiesResponse.data?.data?.detail) {
        setAuthority(authoritiesResponse.data.data.detail);
      }

      // affiliation header 설정을 위한 id 저장
      setAffiliationId(authority.id);

      setTokens(pendingTokens.accessToken, pendingTokens.refreshToken);

      // 모달 닫기 및 상태 초기화
      setShowAuthorityModal(false);
      setPendingTokens(null);
      setSelectedAuthorityId(null);

      // 로그인 성공 후 메인 페이지로 이동
      router.push("/");
    } catch (error) {
      console.error("Failed to fetch authority details:", error);
      setSelectedAuthorityId(null);
      alert("권한 정보를 가져오는데 실패했습니다.");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-inner">
        {/* Header */}
        <div className="login_header">
          <div className="logo">
            <Image
              src="/assets/images/contents/login_logo.svg"
              alt="logo"
              width={100}
              height={100}
            />
          </div>
          <div className="login_title">
            <span>WHALE ERP</span>
            <span>PARTNER OFFICE</span>
          </div>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form-tit">All in One 점포관리 플랫폼</div>
          <div className="login-form-box">
            {/* Login ID Input */}
            <div className="login-form-box-item">
              <div className={`input-icon-log-frame ${formErrors.loginId ? 'err' : ''}`}>
                <input
                  type="text"
                  placeholder="User ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                />
                {loginId && (
                  <button
                    type="button"
                    className="input-icon-btn del"
                    onClick={handleClearLoginId}
                  />
                )}
              </div>
              {formErrors.loginId && (
                <p className="login-error-message">{formErrors.loginId}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="login-form-box-item">
              <div className={`input-icon-log-frame ${formErrors.password ? 'err' : ''}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={`input-icon-btn ${showPassword ? 'hide' : 'show'}`}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              {formErrors.password && (
                <p className="login-error-message">{formErrors.password}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="login-form-btn">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-log-frame basic block"
            >
              {isLoading ? "로그인 중..." : "LOGIN"}
            </button>
          </div>

          {/* Options Row */}
          <div className="login-check-wrap">
            <div className="check-form-box">
              <input
                type="checkbox"
                id="login-check"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="login-check">ID 저장</label>
            </div>
            <div className="find-btn-wrap">
              <button
                type="button"
                className="find-btn-item"
                onClick={() => setShowFindIdPw(true)}
              >
                ID / Password 찾기
              </button>
            </div>
          </div>

          {/* Social Login */}
          <div className="another-login-wrap">
            <div className="another-login-tit">다른 방법으로 로그인</div>
            <div className="another-login-list">
              <button type="button" className="another-login-btn">
                <i className="icon kakao" />
                <span>카카오 계정 로그인</span>
              </button>
              <button type="button" className="another-login-btn">
                <i className="icon naver" />
                <span>네이버 계정 로그인</span>
              </button>
              <button type="button" className="another-login-btn">
                <i className="icon google" />
                <span>Google 계정 로그인</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Guide */}
      <div className="login-guide">
        <span>
          본 서비스는 BP 마스터 계정 또는 파트너오피스 로그인 권한이 부여된
          직원만 이용할 수 있습니다.
        </span>
        <span>
          직원은 <i>직원용 App 계정</i>으로 로그인 하며 카카오 · 네이버 · 구글
          간편 로그인을 지원합니다.
        </span>
      </div>

      {/* ID/Password 찾기 팝업 */}
      <FindIdPw isOpen={showFindIdPw} onClose={() => setShowFindIdPw(false)} />

      {/* Authority Selection Modal */}
      {showAuthorityModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <div className="login-modal-header">
              <h3 className="login-modal-title">조직 선택</h3>
              <p className="login-modal-subtitle">
                로그인할 조직을 선택해주세요
              </p>
            </div>
            <div className="login-modal-body">
              <div className="login-authority-list">
                {authorities.map((authority) => (
                  <button
                    key={authority.id}
                    type="button"
                    className={`login-authority-item ${
                      selectedAuthorityId === authority.id ? "is-loading" : ""
                    }`}
                    onClick={() => handleSelectAuthority(authority)}
                    disabled={selectedAuthorityId !== null}
                  >
                    <div className="login-authority-icon">
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div className="login-authority-info">
                      <div className="login-authority-name">
                        {authority.name}
                      </div>
                      <div className="login-authority-desc">클릭하여 선택</div>
                    </div>
                    <svg
                      className="login-authority-arrow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
