import Pagination from "@/components/ui/Pagination";

export default function MypageTab03() {
  return (
    <div className="mypage-frame-wrap">
      <div className="mypage-filter-head">
        <div className="filter-left">
          <div className="filter-tit">청구년도</div>
          <div className="sel-year">
            <select name="" id="" className="select-form">
              <option value="">2025</option>
            </select>
          </div>
        </div>
        <div className="filter-right">
          <button className="btn-form s outline">선택 전자영수증 인쇄</button>
          <div className="sel-number">
            <select name="" id="" className="select-form">
              <option value="">50</option>
            </select>
          </div>
        </div>
      </div>
      <div className="myservice-wrap">
        <table className="mypage-main-table">
          <colgroup>
            <col width='52px'/>
            <col />
            <col />
            <col />
            <col />
            <col />
            <col width='115px'/>
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>
                <div className="check-form-box no-txt header">
                  <input type="checkbox" id="checkbox" />
                  <label htmlFor="checkbox"></label>
                </div>
              </th>
              <th>상품명</th>
              <th>점포명</th>
              <th>청구일</th>
              <th>이용기간</th>
              <th>금액(원)</th>
              <th>납부일</th>
              <th>납부방법</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="check-form-box no-txt">
                  <input type="checkbox" id="checkbox2" />
                  <label htmlFor="checkbox2"></label>
                </div>
              </td>
              <td className="al-l">STANDARD</td>
              <td className="al-l">을지로3가점</td>
              <td>2025.01.01</td>
              <td>2025.01.01 ~ 2025.01.31</td>
              <td className="al-r">39,000원</td>
              <td>
                <button className="s-btn brd-blue block">결제하기</button>
              </td>
              <td>계좌이체</td>
            </tr>
            <tr>
              <td>
                <div className="check-form-box no-txt">
                  <input type="checkbox" id="checkbox2" />
                  <label htmlFor="checkbox2"></label>
                </div>
              </td>
              <td className="al-l">STANDARD</td>
              <td className="al-l">을지로3가점</td>
              <td>2025.01.01</td>
              <td>2025.01.01 ~ 2025.01.31</td>
              <td className="al-r">39,000원</td>
              <td>
                2025.10.26
              </td>
              <td>계좌이체</td>
            </tr>
            <tr>
              <td>
                <div className="check-form-box no-txt">
                  <input type="checkbox" id="checkbox2" />
                  <label htmlFor="checkbox2"></label>
                </div>
              </td>
              <td className="al-l">STANDARD</td>
              <td className="al-l">을지로3가점</td>
              <td>2025.01.01</td>
              <td>2025.01.01 ~ 2025.01.31</td>
              <td className="al-r">39,000원</td>
              <td>
                <button className="s-btn brd-red block">미납</button>
              </td>
              <td>계좌이체</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mypage-paging-wrap">
        <Pagination/>
      </div>
    </div>
  )
}