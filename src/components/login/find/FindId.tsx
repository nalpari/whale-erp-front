"use client";
import { useState } from "react";
import { findLoginId } from "@/lib/api";

interface FindIdProps {
  onClose: () => void;
  onSwitchToPw?: () => void;
}

export default function FindId({ onClose, onSwitchToPw }: FindIdProps) {
  const [findId, setFindId] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [foundId, setFoundId] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFindId = async () => {
    const newErrors: { name?: string; email?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = "이름을 입력해 주세요.";
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
    setIsLoading(true);

    try {
      const loginId = await findLoginId(name, email);
      setFoundId(loginId);
      setFindId(true);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message ?? "일치하는 계정을 찾을 수 없습니다.";
      setErrors({ email: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFindId(false);
    setName("");
    setEmail("");
    setFoundId("");
    setErrors({});
  };

  return findId ? (
    <div className="find-form">
      <div className="find-form-header">
        <div className="find-form-header-tit">ID 찾기 완료</div>
        <div className="find-form-header-desc">
          회원정보에 등록된 이메일로 아이디를 찾았습니다.
        </div>
      </div>
      <div className="id-find">
        <span>{name}</span>님의 ID찾기가 완료 되었습니다.
      </div>
      <div className="find-form-content">
        <div className="block">
          <input
            type="text"
            className="input-log-frame"
            placeholder="ID"
            value={foundId}
            readOnly
          />
        </div>
      </div>
      <div className="find-form-btn">
        <button
          type="button"
          className="btn-log-frame basic l"
          onClick={onSwitchToPw}
        >
          ID로 비밀번호 찾기
        </button>
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
        <div className="find-form-header-tit">ID 찾기</div>
        <div className="find-form-header-desc">
          회원정보에 등록된 이메일로 아이디를 찾을 수 있습니다.
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
          onClick={handleFindId}
          disabled={isLoading}
        >
          {isLoading ? "찾는 중..." : "ID 찾기"}
        </button>
        <button type="button" className="btn-log-frame gray" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}
