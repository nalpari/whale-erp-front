"use client";
import { useState } from "react";
import FindId from "./find/FindId";
import FindPw from "./find/FindPw";

interface FindIdPwProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FindIdPw({ isOpen, onClose }: FindIdPwProps) {
  const [tab, setTab] = useState<"id" | "pw">("id");

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSwitchToPw = () => {
    setTab("pw");
  };

  return (
    <div className="find-modal-overlay" onClick={handleOverlayClick}>
      <div className="find-modal">
        <div className="find-bx">
          <button
            className="find-close-btn"
            onClick={onClose}
            aria-label="닫기"
          />
          <div className="find-header">
            <button
              className={`find-btn-item ${tab === "id" ? "act" : ""}`}
              onClick={() => setTab("id")}
            >
              ID 찾기
            </button>
            <button
              className={`find-btn-item ${tab === "pw" ? "act" : ""}`}
              onClick={() => setTab("pw")}
            >
              비밀번호 찾기
            </button>
          </div>
          <div className="find-body">
            {tab === "id" ? (
              <FindId onClose={onClose} onSwitchToPw={handleSwitchToPw} />
            ) : (
              <FindPw onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
