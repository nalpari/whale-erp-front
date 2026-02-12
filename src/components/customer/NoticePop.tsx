import type { NoticeDetail } from '@/lib/schemas/notice'
import { formatDateDot } from '@/util/date-util'

type NoticePopProps = {
  notice: NoticeDetail
  onClose: () => void
}

export default function NoticePop({ notice, onClose }: NoticePopProps) {
  return (
    <div className="modal-popup" onClick={onClose}>
      <div className="modal-dialog notice" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <button className="modal-close" aria-label="닫기" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="notice-header">
              <div className="notice-date">{formatDateDot(notice.createdAt)}</div>
              <div className="notice-tit">{notice.title}</div>
            </div>
            <div className="notice-content">
              <p>{notice.content}</p>
            </div>
            {notice.files && notice.files.length > 0 && (
              <div className="notice-file">
                <div className="notice-file-tit">첨부파일</div>
                <ul className="notice-file-list">
                  {notice.files.map((file) => (
                    <li className="notice-file-item" key={file.id}>
                      <button
                        type="button"
                        className="notice-file-btn"
                        onClick={() => {
                          if (file.downloadUrl && /^https?:\/\//i.test(file.downloadUrl)) {
                            window.open(file.downloadUrl, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        {file.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
