
export default function MypageTab05() {
  return (
    <div className="mypage-frame-wrap">
      <div className="mypage-frame-tit">
        <h2>결제수단 목록</h2>
      </div>
      <div className="mypage-frame-content">
        <div className="pay-method-wrap">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="pay-method-item" key={index}>
              <div className="pay-method-inner">
                <div className="pay-method-info">
                  <div className="pay-method-tit">현대 ZERO Ed3(할인카드) 현대 ZERO Ed3(할인카드)</div>
                  <div className="pay-method-num">12345*****123*</div>
                </div>
                <button className="pay-method-del"></button>
              </div>
              <div className="pay-method-date">
                <span>등록일</span>
                <span className="date">2025.11.12 10:10:12</span>
              </div>
            </div>
          ))}
          <button className="pay-method-add">
            결제수단 등록<i className="method-add"></i>
          </button>
        </div>
      </div>
    </div>
  )
}