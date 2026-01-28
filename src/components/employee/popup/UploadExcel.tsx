'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'

type UploadPolicy = 'skipError' | 'cancelOnError'

type UploadErrorRow = {
  row: number
  message: string
}

type UploadResult = {
  total: number
  success: number
  failed: number
  errors: UploadErrorRow[]
}

type UploadExcelProps = {
  isUploading?: boolean
  result?: UploadResult | null
  onClose: () => void
  onUpload: (file: File, policy: UploadPolicy) => void
  onDownloadSample?: () => void
  onDownloadErrorFile?: () => void
}

export default function UploadExcel({
  isUploading = false,
  result = null,
  onClose,
  onUpload,
  onDownloadSample,
  onDownloadErrorFile,
}: UploadExcelProps) {
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const errorRows = useMemo(() => result?.errors ?? [], [result])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    event.target.value = ''
  }

  const handleUpload = () => {
    if (!file) {
      alert('엑셀 파일을 선택해주세요.')
      return
    }
    onUpload(file, 'skipError')
  }

  return (
    <div className="modal-popup">
      <div className="modal-dialog xl">
        <div className="modal-content">
          <div className="modal-header">
            <h2>엑셀 업로드</h2>
            <button className="modal-close" aria-label="닫기" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="search-filed">
              <table className="default-table">
                <colgroup>
                  <col width="140px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>
                      <label htmlFor="excel-upload-file">엑셀 파일</label>
                    </th>
                    <td>
                      <div className="filed-check-flx">
                        <input
                          id="excel-upload-file"
                          className="input-frame"
                          type="text"
                          value={file?.name ?? ''}
                          placeholder="엑셀 파일을 선택해주세요."
                          readOnly
                        />
                        <button
                          type="button"
                          className="btn-form outline s"
                          onClick={() => uploadRef.current?.click()}
                          disabled={isUploading}
                        >
                          파일 찾기
                        </button>
                        <button
                          type="button"
                          className="btn-form outline s"
                          onClick={onDownloadSample}
                          disabled={!onDownloadSample || isUploading}
                        >
                          샘플
                        </button>
                      </div>
                      <input
                        ref={uploadRef}
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="btn-filed">
                <button className="btn-form basic" onClick={handleUpload} disabled={isUploading}>
                  업로드
                </button>
              </div>
            </div>

            <div className="pop-btn-content" style={{ marginTop: 16 }}>
              <button
                className="btn-form outline"
                onClick={onDownloadErrorFile}
                disabled={!onDownloadErrorFile || errorRows.length === 0}
              >
                에러 파일 다운로드
              </button>
              <button className="btn-form gray" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
