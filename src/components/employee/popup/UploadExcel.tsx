'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useAlert } from '@/components/common/ui'

type UploadErrorRow = {
  rowNumber: number
  message: string
}

type UploadResult = {
  success: boolean
  totalRows: number
  successRows: number
  failedRows: number
  errors: UploadErrorRow[]
}

type UploadExcelProps = {
  isUploading?: boolean
  result?: UploadResult | null
  onClose: () => void
  onUpload: (file: File) => void
  onDownloadSample?: () => void
}

export default function UploadExcel({
  isUploading = false,
  result = null,
  onClose,
  onUpload,
  onDownloadSample,
}: UploadExcelProps) {
  const { alert } = useAlert()
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { alert } = useAlert()

  const errorRows = useMemo(() => result?.errors ?? [], [result])
  const isSuccess = useMemo(() => result?.success ?? false, [result])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    event.target.value = ''
  }

  const handleUpload = async () => {
    if (!file) {
      await alert('엑셀 파일을 선택해주세요.')
      return
    }
    onUpload(file)
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
                  <col style={{ width: '140px' }} />
                  <col style={{ width: 'auto' }} />
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
                        aria-label="엑셀 파일 선택"
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

            {result && (
              <div className="search-filed" style={{ marginTop: 16 }}>
                {result.success ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#22c55e' }}>
                    ✓ 정상적으로 업로드되었습니다.
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '16px', textAlign: 'center', color: '#ef4444' }}>
                      ✗ 실패했습니다. 다시 시도해주세요.
                    </div>
                    {errorRows.length > 0 && (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                        <table className="default-table">
                          <thead>
                            <tr>
                              <th style={{ width: '80px' }}>행 번호</th>
                              <th>오류 내용</th>
                            </tr>
                          </thead>
                          <tbody>
                            {errorRows.map((error, idx) => (
                              <tr key={idx}>
                                <td style={{ textAlign: 'center' }}>{error.rowNumber}행</td>
                                <td>{error.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="pop-btn-content" style={{ marginTop: 16 }}>
              {isSuccess && (
                <button
                  className="btn-form outline"
                  onClick={onClose}
                >
                  저장
                </button>
              )}
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
