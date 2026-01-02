export default function Pagination() {
  return (
    <div className="pagination">
      <ol className="pagination-list">
        {/* 이전 버튼 */}
        <li>
          <button type="button" className="pagination-button prev disabled" aria-label="이전 페이지" disabled>
            Prev
          </button>
        </li>

        {/* 페이지 번호들 */}
        <li>
          <button className="pagination-number">1</button>
        </li>
        <li>
          <button className="pagination-number active" aria-current="page">
            2
          </button>
        </li>
        <li>
          <button className="pagination-number">3</button>
        </li>

        {/* 다음 버튼 */}
        <li>
          <button type="button" className="pagination-button next" aria-label="다음 페이지">
            Next
          </button>
        </li>
      </ol>
    </div>
  )
}
