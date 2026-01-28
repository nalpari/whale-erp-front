import Pagination from "@/components/ui/Pagination";

export default function MypageTab04() {
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
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>서비스</th>
              <th>점포</th>
              <th>정산월</th>
              <th>판매금액(부가세포함)</th>
              <th>수수료(부가세포함)</th>
              <th>정산금액(부가세포함)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="al-l">픽업오더</td>
              <td className="al-l">을지로3가점</td>
              <td>2025.10.26</td>
              <td className="al-r">139,000원</td>
              <td className="al-r">39,000원</td>
              <td className="al-r">100,000원</td>
            </tr>
            <tr>
              <td className="al-l">테이블 오더</td>
              <td className="al-l">을지로3가점</td>
              <td>2025.10.26</td>
              <td className="al-r">139,000원</td>
              <td className="al-r">39,000원</td>
              <td className="al-r">100,000원</td>
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