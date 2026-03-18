'use client'

const SignupStep06 = () => {
  return (
    <div className="signup-wrap">
      <div className="signup-form-wrap">
        <div className="signup-form-header">
          <div className="signup-form-header-tit">
            BUSINESS PARTNER로 회원가입이 성공했습니다.
            <br />
            구독 결제를 진행해 주세요.
          </div>
          <div className="signup-form-header-desc">
            <span>구독을 위한 결제를 진행합니다.</span>
          </div>
        </div>
        <div className="subscrip-price-wrap">
          <table className="subscrip-price-table">
            <colgroup>
              <col width="80px" />
              <col />
              <col />
              <col />
              <col width="120px" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <div className="border-box">선택</div>
                </th>
                <th>
                  <div className="border-box">결제 주기</div>
                </th>
                <th>
                  <div className="border-box">구독 기간</div>
                </th>
                <th>
                  <div className="border-box">구독료</div>
                </th>
                <th>
                  <div className="border-box">구독료 혜택</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="radio-form-box no-txt">
                    <input type="radio" id="radio-box-monthly" name="plan" disabled />
                    <label htmlFor="radio-box-monthly"></label>
                  </div>
                </td>
                <td className="al-l">월별 구독</td>
                <td>2025.01.01~2025.01.31</td>
                <td>
                  <div className="subscrip-price-wrap">
                    <span className="price">19,000원</span>
                    <span className="discount">17,100원</span>
                  </div>
                </td>
                <td className="al-r">5% 할인</td>
              </tr>
              <tr>
                <td>
                  <div className="radio-form-box no-txt">
                    <input type="radio" id="radio-box-half" name="plan" disabled />
                    <label htmlFor="radio-box-half"></label>
                  </div>
                </td>
                <td className="al-l">6개월 구독</td>
                <td>2025.01.01~2025.01.31</td>
                <td>
                  <div className="subscrip-price-wrap">
                    <span className="price">114,000원</span>
                    <span className="discount">108.300원</span>
                  </div>
                </td>
                <td className="al-r">5% 할인</td>
              </tr>
              <tr>
                <td>
                  <div className="radio-form-box no-txt">
                    <input type="radio" id="radio-box-annual" name="plan" disabled />
                    <label htmlFor="radio-box-annual"></label>
                  </div>
                </td>
                <td className="al-l">연간 구독</td>
                <td>2025.01.01~2025.01.31</td>
                <td>
                  <div className="subscrip-price-wrap">
                    <span className="price">114,000원</span>
                    <span className="discount">108.300원</span>
                  </div>
                </td>
                <td className="al-r">10% 할인</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="introduction-btn-wrap">
        <button type="button" className="introduction-btn" disabled>
          구독 결제하기
        </button>
      </div>
    </div>
  )
}

export default SignupStep06
