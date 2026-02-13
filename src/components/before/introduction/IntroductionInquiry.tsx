export default function IntroductionInquiry({
  setIntroductionSuccess,
  setPersonalinformationConset,
}: {
  setIntroductionSuccess: (success: boolean) => void
  setPersonalinformationConset: (conset: boolean) => void
}) {
  return (
    <div className="introduction-wrap">
      <div className="introduction-form">
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              이름 <span className="red">*</span>
            </div>
            <div className="before">
              <input type="text" placeholder="이름을 입력해 주세요." />
            </div>
            <div className="error-message">이름을 입력해 주세요.</div>
          </div>
          <div className="introduction-item">
            <div className="introduction-item-tit">업종</div>
            <div className="before">
              <select>
                <option value="">선택</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              휴대전화번호 <span className="red">*</span>
            </div>
            <div className="before">
              <input type="number" placeholder="숫자만 입력해주세요." />
            </div>
            <div className="error-message">숫자만 입력해 주세요.</div>
          </div>
          <div className="introduction-item">
            <div className="introduction-item-tit">
              주력메뉴 <span className="red">*</span>
            </div>
            <div className="before">
              <input type="text" placeholder="커피, 디저트 등 간단하게 입력해 주세요." />
            </div>
            <div className="error-message">주력메뉴를 입력해 주세요.</div>
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              이메일 <span className="red">*</span>
            </div>
            <div className="before">
              <input type="email" placeholder="이메일을 입력해주세요." />
            </div>
            <div className="error-message">이메일을 입력해 주세요.</div>
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              관심 서비스 <span className="red">*</span> <b>(복수선택 가능)</b>
            </div>
            <div className="introduction-select">
              <button className="introduction-select-btn">매장운영</button>
              <button className="introduction-select-btn checked">재무관리</button>
              <button className="introduction-select-btn">프랜차이즈</button>
              <button className="introduction-select-btn">기타</button>
            </div>
            <div className="error-message">관심 서비스를 선택해 주세요.</div>
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              문의사항 <span className="red">*</span>
            </div>
            <div className="before">
              <textarea
                name=""
                id=""
                placeholder="궁금하신 내용을 입력해 주세요. 도입을 희망하는 기능과 예상인원을 함께 적어 주시면 더욱 정확한 상담이 가능합니다."
              ></textarea>
            </div>
            <div className="error-message">문의사항을 입력해 주세요.</div>
          </div>
        </div>
        <div className="introduction-line-wrap">
          <div className="introduction-item">
            <div className="introduction-item-tit">
              개인정보 수집 및 이용 동의 <span className="red">*</span>
            </div>
            <div className="before">
              <div className="introduction-check">
                <div className="check-form-box">
                  <input type="checkbox" id="introduction-agree" />
                  <label htmlFor="introduction-agree">
                    <span>(필수)</span>개인정보 수집 및 이용 동의
                  </label>
                </div>
                <button className="introduction-check-btn" onClick={() => setPersonalinformationConset(true)}>
                  전문보기
                </button>
              </div>
            </div>
            <div className="error-message">개인정보 수집 및 이용 동의를 동의해 주세요.</div>
          </div>
        </div>
      </div>
      <div className="introduction-btn-wrap">
        <button className="introduction-btn" onClick={() => setIntroductionSuccess(true)}>
          제출
        </button>
      </div>
    </div>
  )
}
