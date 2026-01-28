export default function MyPageTab02() {
  return (
    <div className="mypage-frame-wrap">
      <div className="mypage-frame-tit">
        <h2>파트너오피스</h2>
      </div>
      <div className="mypage-frame-content">
        <table className="mypage-main-table bold">
          <colgroup>
            <col />
            <col width="160px" />
            <col width="170px" />
            <col />
            <col />
            <col width="98px" />
          </colgroup>
          <thead>
            <tr>
              <th>플랜</th>
              <th>구독일</th>
              <th>이용요금(부가세포함)</th>
              <th>과금 주기</th>
              <th>결제수단</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>STANDARD</td>
              <td>2025.01.01</td>
              <td className="al-r">39,000원</td>
              <td>월 과금</td>
              <td>신용카드</td>
              <td>
                <button className="s-btn navy">해지</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="sub-contents-wrap">
          <div className="sub-contents-tit">이용중인 부가서비스 <span>4건</span></div>
          <div className="myservice-wrap">
            <table className="mypage-sub-table">
              <thead>
                <tr>
                  <th>서비스</th>
                  <th>점포</th>
                  <th>구독일</th>
                  <th>이용요금(부가세포함)</th>
                  <th>과금주기</th>
                  <th>결제수단</th>
                  <th>판매수수료율</th>
                  <th>과금방법</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bold al-l">픽업오더</td>
                  <td className="al-l">을지로3가점</td>
                  <td>2025.01.01</td>
                  <td className="al-r">39,000원</td>
                  <td>월과금</td>
                  <td>신용카드</td>
                  <td className="al-r">3.2%</td>
                  <td>건별과금</td>
                  <td>
                    <button className="s-btn outline">해지</button>
                  </td>
                </tr>
                <tr>
                  <td className="bold al-l">테이블 오더</td>
                  <td className="al-l">을지로3가점</td>
                  <td>2025.01.01</td>
                  <td className="al-r">39,000원</td>
                  <td>월과금</td>
                  <td>신용카드</td>
                  <td className="al-r">3.2%</td>
                  <td>건별과금</td>
                  <td>
                    <button className="s-btn outline">해지</button>
                  </td>
                </tr>
                <tr>
                  <td className="empty" colSpan={9}>이용중인 서비스가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}