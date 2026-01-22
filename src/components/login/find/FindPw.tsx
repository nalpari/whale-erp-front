"use client";
import { useState } from "react";

interface FindPwProps {
  onClose: () => void;
  initialId?: string;
}

export default function FindPw({ onClose, initialId = "" }: FindPwProps) {
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState(initialId);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    loginId?: string;
    email?: string;
  }>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleFindPw = () => {
    const newErrors: { name?: string; loginId?: string; email?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = "이름을 입력해 주세요.";
    }
    if (!loginId.trim()) {
      newErrors.loginId = "아이디를 입력해 주세요.";
    }
    if (!email.trim()) {
      newErrors.email = "이메일을 입력해 주세요.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "올바른 이메일 형식을 입력해 주세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    // TODO: API 호출로 비밀번호 찾기
    setIsComplete(true);
  };

  const handleReset = () => {
    setName("");
    setLoginId("");
    setEmail("");
    setErrors({});
    setIsComplete(false);
  };

  return isComplete ? (
    <div className="find-form">
      <div className="find-form-header">
        <div className="find-form-header-tit">비밀번호 찾기 완료</div>
        <div className="find-form-header-desc">
          등록된 이메일로 임시 비밀번호가 발송되었습니다.
        </div>
      </div>
      <div className="find-form-content">
        <div className="block">
          <input
            type="email"
            className="input-log-frame"
            placeholder="Email"
            value={email}
            readOnly
          />
        </div>
      </div>
      <div className="find-form-btn">
        <button type="button" className="btn-log-frame basic" onClick={onClose}>
          로그인
        </button>
        <button
          type="button"
          className="btn-log-frame gray"
          onClick={handleReset}
        >
          다시 찾기
        </button>
      </div>
    </div>
  ) : (
    <div className="find-form">
      <div className="find-form-header">
        <div className="find-form-header-tit">비밀번호 찾기</div>
        <div className="find-form-header-desc">
          회원정보에 등록된 이메일로 비밀번호를 찾을 수 있습니다.
        </div>
      </div>
      <div className="find-form-content">
        <div className="block">
          <input
            type="text"
            className="input-log-frame"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {errors.name && <div className="red">{errors.name}</div>}
        <div className="block">
          <input
            type="text"
            className="input-log-frame"
            placeholder="ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
        </div>
        {errors.loginId && <div className="red">{errors.loginId}</div>}
        <div className="block">
          <input
            type="email"
            className="input-log-frame"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {errors.email && <div className="red">{errors.email}</div>}
      </div>
      <div className="find-form-btn">
        <button
          type="button"
          className="btn-log-frame basic"
          onClick={handleFindPw}
        >
          비밀번호 찾기
        </button>
        <button type="button" className="btn-log-frame gray" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}
