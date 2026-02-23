"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  loginRequestSchema,
  type Authority,
} from "@/lib/schemas/auth";
import { formatZodFieldErrors } from "@/lib/zod-utils";
import { useLoginMutation, useAuthoritySelectMutation } from "@/hooks/queries/use-login-mutation";
import FindIdPw from "@/components/login/FindIdPw";
import "./login.css";

const SAVED_LOGIN_ID_KEY = "savedLoginId";

function setAuthCookie() {
  document.cookie = 'auth-token=true; path=/'
}

const emptySubscribe = () => () => {};

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setAuthority = useAuthStore((state) => state.setAuthority);
  const setAffiliationId = useAuthStore((state) => state.setAffiliationId);
  const setUserInfo = useAuthStore((state) => state.setUserInfo);
  const setSubscriptionPlan = useAuthStore((state) => state.setSubscriptionPlan);

  const loginMutation = useLoginMutation();
  const authoritySelectMutation = useAuthoritySelectMutation();

  // localStorage에서 저장된 로그인 ID를 SSR-safe하게 읽기
  const savedLoginId = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem(SAVED_LOGIN_ID_KEY),
    () => null
  );

  const [loginIdInput, setLoginIdInput] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMeInput, setRememberMeInput] = useState<boolean | null>(null);

  const loginId = loginIdInput ?? savedLoginId ?? "";
  const rememberMe = rememberMeInput ?? (savedLoginId !== null);
  const setLoginId = (value: string) => setLoginIdInput(value);
  const setRememberMe = (value: boolean) => setRememberMeInput(value);
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

    try {
      const data = await loginMutation.mutateAsync(validation.data);

      const { accessToken, refreshToken, authority, companies, loginId: resLoginId, name: resName, mobilePhone, subscriptionPlanId } = data;

      // 권한 처리
      if (authority) {
        // programs 데이터 검증
        if (!authority.programs) {
          alert("로그인에 문제가 생겼습니다. 관리자에게 문의하세요.");
          return;
        }

        setAuthority(authority.programs);
        setAffiliationId(String(authority.authorityId));
        setTokens(accessToken, refreshToken);
        setUserInfo(resLoginId || '', resName || '', mobilePhone || '');
        if (subscriptionPlanId) setSubscriptionPlan(subscriptionPlanId);

        // 아이디 저장 처리
        if (rememberMe) {
          localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId);
        } else {
          localStorage.removeItem(SAVED_LOGIN_ID_KEY);
        }

        setAuthCookie()
        router.push("/logined-main");
      } else if (companies && companies.length > 0) {
        setAuthorities(companies.map((c: { authorityId: number; companyName: string | null; brandName: string | null }) => ({
          id: String(c.authorityId),
          name: c.companyName || c.brandName || `회사 ${c.authorityId}`,
        })));
        setPendingTokens({ accessToken, refreshToken });
        setUserInfo(resLoginId || '', resName || '', mobilePhone || '');
        if (subscriptionPlanId) setSubscriptionPlan(subscriptionPlanId);
        setShowAuthorityModal(true);
      } else {
        alert("로그인에 문제가 생겼습니다. 관리자에게 문의하세요.");
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message ?? "알 수 없는 오류가 발생했습니다.";
      alert(message);
    }
  };

  // Authority 선택 처리
  const handleSelectAuthority = async (authority: Authority) => {
    if (!pendingTokens) return;

    setSelectedAuthorityId(authority.id);

    try {
      const data = await authoritySelectMutation.mutateAsync({
        authorityId: Number(authority.id),
        accessToken: pendingTokens.accessToken,
      });

      if (data?.authority?.programs) {
        setAuthority(data.authority.programs);
      } else {
        setSelectedAuthorityId(null);
        alert("로그인에 문제가 생겼습니다. 관리자에게 문의하세요.");
        return;
      }

      setAffiliationId(authority.id);
      setTokens(pendingTokens.accessToken, pendingTokens.refreshToken);

      if (rememberMe) {
        localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId);
      } else {
        localStorage.removeItem(SAVED_LOGIN_ID_KEY);
      }

      setAuthCookie()

      setShowAuthorityModal(false);
      setPendingTokens(null);
      setSelectedAuthorityId(null);

      router.push("/logined-main");
    } catch {
      setSelectedAuthorityId(null);
      alert("권한 정보를 가져오는데 실패했습니다.");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-inner">
        {/* Header */}
        <div className="login_header">
          <Link href="/" className="logo">
            <Image
              src="/assets/images/contents/login_logo.svg"
              alt="logo"
              width={100}
              height={100}
            />
          </Link>
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
              disabled={loginMutation.isPending}
              className="btn-log-frame basic block"
            >
              {loginMutation.isPending ? "로그인 중..." : "LOGIN"}
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

          {/* Sign Up */}
          <div className="login-signup-wrap">
            <div className="login-signup-txt">
              <div className="login-signup-tit">처음 오셨나요?</div>
              <div className="login-signup-desc">요금제 선택하고 가입하기</div>
            </div>
            <div className="login-signup-btn-wrap">
              <button type="button" className="login-signup-btn">가입하기</button>
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
