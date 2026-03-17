"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useChangePasswordMutation } from "@/hooks/queries/use-change-password-mutation";
import "../login/login.css";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;

export default function ChangePasswordPage() {
  const router = useRouter();
  const setPasswordChangeRequired = useAuthStore((state) => state.setPasswordChangeRequired);
  const changePasswordMutation = useChangePasswordMutation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newPassword) {
      errors.newPassword = "새 비밀번호를 입력해주세요.";
    } else if (!PASSWORD_PATTERN.test(newPassword)) {
      errors.newPassword = "영문, 숫자, 특수문자(@$!%*#?&)를 포함한 8~20자여야 합니다.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "새 비밀번호를 한번 더 입력해주세요.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "새 비밀번호가 일치하지 않습니다.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await changePasswordMutation.mutateAsync({
        newPassword,
      });

      setPasswordChangeRequired(false);
      alert("비밀번호가 변경되었습니다.");
      router.replace("/logined-main");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message =
        axiosError.response?.data?.message ?? "비밀번호 변경에 실패했습니다.";
      alert(message);
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

        {/* Change Password Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-tit">비밀번호 변경</div>
          <p style={{ fontSize: "13px", color: "#5E697B", marginBottom: "20px", textAlign: "center" }}>
            보안을 위해 비밀번호를 변경해주세요.
          </p>

          <div className="login-form-box">
            {/* 새 비밀번호 */}
            <div className="login-form-box-item">
              <div className={`input-icon-log-frame ${formErrors.newPassword ? "err" : ""}`}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="새 비밀번호 (영문+숫자+특수문자, 8~20자)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={`input-icon-btn ${showNewPassword ? "hide" : "show"}`}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                />
              </div>
              {formErrors.newPassword && (
                <p className="login-error-message">{formErrors.newPassword}</p>
              )}
            </div>

            {/* 새 비밀번호 확인 */}
            <div className="login-form-box-item">
              <div className={`input-icon-log-frame ${formErrors.confirmPassword ? "err" : ""}`}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="새 비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={`input-icon-btn ${showConfirmPassword ? "hide" : "show"}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="login-error-message">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="login-form-btn">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="btn-log-frame basic block"
            >
              {changePasswordMutation.isPending ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </form>
      </div>

      {/* Guide */}
      <div className="login-guide">
        <span>
          초기 비밀번호는 마스터 ID와 동일하게 설정되어 있습니다.
        </span>
        <span>
          보안을 위해 영문, 숫자, 특수문자를 조합한 8~20자의 새 비밀번호로 변경해주세요.
        </span>
      </div>
    </div>
  );
}
