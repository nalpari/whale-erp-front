interface PaginationProps {
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

const buildPageRange = (current: number, total: number, maxButtons: number) => {
  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, index) => index)
  }

  const half = Math.floor(maxButtons / 2)
  let start = Math.max(0, current - half)
  const end = Math.min(total, start + maxButtons)

  if (end - start < maxButtons) {
    start = Math.max(0, end - maxButtons)
  }

  return Array.from({ length: end - start }, (_, index) => start + index)
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (page === undefined || totalPages === undefined) {
    return <div className="pagination" />
  }

  const total = Math.max(1, totalPages)
  const current = Math.min(Math.max(page, 0), total - 1)
  const pages = buildPageRange(current, total, 10)

  return (
    <div className="pagination">
      <ol className="pagination-list">
        <li>
          <button
            type="button"
            className={`pagination-button prev ${current === 0 ? 'disabled' : ''}`}
            aria-label="Prev"
            disabled={current === 0}
            onClick={() => onPageChange?.(current - 1)}
          >
            Prev
          </button>
        </li>

        {pages.map((pageNumber) => (
          <li key={pageNumber}>
            <button
              type="button"
              className={`pagination-number ${pageNumber === current ? 'active' : ''}`}
              aria-current={pageNumber === current ? 'page' : undefined}
              onClick={() => onPageChange?.(pageNumber)}
            >
              {pageNumber + 1}
            </button>
          </li>
        ))}

        <li>
          <button
            type="button"
            className={`pagination-button next ${current >= total - 1 ? 'disabled' : ''}`}
            aria-label="Next"
            disabled={current >= total - 1}
            onClick={() => onPageChange?.(current + 1)}
          >
            Next
          </button>
        </li>
      </ol>
    </div>
  )
}
