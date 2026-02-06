import type { NoticeDetail } from '@/lib/schemas/notice'
import { formatDateDot } from '@/util/date-util'

type NoticePopProps = {
  notice: NoticeDetail
  onClose: () => void
}

export default function NoticePop({ notice, onClose }: NoticePopProps) {
  return (
    <div className="modal-popup" onClick={onClose}>
      <div className="modal-dialog xl notice" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <button className="modal-close" aria-label="닫기" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="pop-frame">
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
                        <a className="notice-file-btn" href={file.downloadUrl} download>
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
