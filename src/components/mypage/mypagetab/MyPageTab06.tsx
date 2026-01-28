export default function MyPageTab06() {
  return (
    <div className="mypage-frame-wrap">
      <div className="password-change-wrap">
        <div className="password-change-inner">
          <div className="filed-wrap">
            <div className="filed-item">
              <div className="filed-tit">현재 비밀번호 <span className="red">*</span></div>
              <div className="filed-input">
                <div className="input-icon-log-frame">
                  <input placeholder="8자 이상 영문과 숫자 조합으로 입력해 주세요" type="password"/>
                  <button type="button" className="input-icon-btn show"></button>
                  <button type="button" className="input-icon-btn hide"></button>
                </div>
              </div>
              <div className="filed-error">현재 비밀번호를 입력해 주세요.</div>
            </div>
            <div className="filed-item">
              <div className="filed-tit">신규 비밀번호 <span className="red">*</span></div>
              <div className="filed-input">
                <div className="input-icon-log-frame">
                  <input placeholder="8자 이상 영문과 숫자 조합으로 입력해 주세요" type="password"/>
                  <button type="button" className="input-icon-btn show"></button>
                  <button type="button" className="input-icon-btn hide"></button>
                </div>
              </div>
              <div className="filed-error">신규 비밀번호를 입력해 주세요.</div>
            </div>
            <div className="filed-item">
              <div className="filed-tit">비밀번호 확인 <span className="red">*</span></div>
              <div className="filed-input">
                <div className="input-icon-log-frame">
                  <input type="password"/>
                  <button type="button" className="input-icon-btn show"></button>
                  <button type="button" className="input-icon-btn hide"></button>
                </div>
              </div>
              <div className="filed-error">비밀번호를 입력해 주세요.</div>
            </div>
          </div>
        </div>
        <div className="password-change-btn">
          <button type="button" className="btn-form gray">취소</button>
          <button type="button" className="btn-form basic">저장</button>
        </div>
      </div>
    </div>
  )
}