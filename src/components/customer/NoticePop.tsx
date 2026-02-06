 'use client'
 
 type NoticeFile = {
  id: number
  name: string
  downloadUrl: string
 }
 
 type NoticePopProps = {
   notice: {
     title: string
    createdAt: string
     content: string
     files?: NoticeFile[]
   }
   onClose: () => void
 }
 
const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
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
                <div className="notice-date">{formatDate(notice.createdAt)}</div>
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
