'use client'
import MyPageTab01Layout from "./mypagetab/MyPageTab01Layout";
import MyPageTab02 from "./mypagetab/MyPageTab02";
import MypageTab03 from "./mypagetab/MypageTab03";
import MypageTab04 from "./mypagetab/MypageTab04";
import MypageTab05 from "./mypagetab/MypageTab05";
import MyPageTab06 from "./mypagetab/MyPageTab06";
import { useMyPageStore } from "@/stores/mypage-store";

export default function MyPageLayout() {
  const { isOpen, activeTab, setActiveTab, closeMyPage } = useMyPageStore()

  if (!isOpen) {
    return null
  }
  return (
    <div className="modal-popup">
      <div className="modal-dialog mypage">
        <div className="modal-content">
          <div className="mypage-header">
            <h2>MYPAGE</h2>
            <button className="modal-close" onClick={closeMyPage}></button>
          </div>
          <div className="mypage-body">
            <div className="pop-frame">
              <div className="mypage-tab">
                <button className={`mypage-tab-item ${activeTab === 0 ? 'act' : ''}`} onClick={() => setActiveTab(0)}>사업자정보 확인 및 수정</button>
                <button className={`mypage-tab-item ${activeTab === 1 ? 'act' : ''}`} onClick={() => setActiveTab(1)}>서비스 구독현황</button>
                <button className={`mypage-tab-item ${activeTab === 2 ? 'act' : ''}`} onClick={() => setActiveTab(2)}>구독료청구 및 납부현황</button>
                <button className={`mypage-tab-item ${activeTab === 3 ? 'act' : ''}`} onClick={() => setActiveTab(3)}>정산현황</button>
                <button className={`mypage-tab-item ${activeTab === 4 ? 'act' : ''}`} onClick={() => setActiveTab(4)}>결제수단관리</button>
                <button className={`mypage-tab-item ${activeTab === 5 ? 'act' : ''}`} onClick={() => setActiveTab(5)}>비밀번호변경</button>
              </div>
              {activeTab === 0 && <MyPageTab01Layout />}
              {activeTab === 1 && <MyPageTab02 />}
              {activeTab === 2 && <MypageTab03 />}
              {activeTab === 3 && <MypageTab04 />}
              {activeTab === 4 && <MypageTab05 />}
              {activeTab === 5 && <MyPageTab06 />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}