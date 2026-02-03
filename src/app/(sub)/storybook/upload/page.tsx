'use client'

import { useState, useCallback } from 'react'
import { FileUpload, type FileItem } from '@/components/common/ui'

/**
 * FileUpload 컴포넌트 Storybook 페이지
 * - 파일 업로드 컴포넌트 예제
 */
export default function UploadStorybookPage() {
  // 기본 예제용 상태
  const [basicFiles, setBasicFiles] = useState<FileItem[]>([])

  // 다중 파일 예제용 상태
  const [multipleFiles, setMultipleFiles] = useState<FileItem[]>([])

  // 에러 상태 예제용
  const [requiredFiles, setRequiredFiles] = useState<FileItem[]>([])

  // 값이 있는 예제용 상태
  const [filledFiles, setFilledFiles] = useState<FileItem[]>([
    { id: 1, name: '을지로3가점 영업허가증.pdf' },
    { id: 2, name: '사업자등록증.pdf' },
  ])

  // 파일 추가 핸들러
  const handleAddFiles = useCallback(
    (
      newFiles: File[],
      currentFiles: FileItem[],
      setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
    ) => {
      const fileItems: FileItem[] = newFiles.map((file) => ({
        name: file.name,
        file,
        type: file.type,
        size: file.size,
      }))
      setFiles([...currentFiles, ...fileItems])
    },
    []
  )

  // 파일 삭제 핸들러
  const handleRemoveFile = useCallback(
    (
      index: number,
      currentFiles: FileItem[],
      setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>
    ) => {
      setFiles(currentFiles.filter((_, i) => i !== index))
    },
    []
  )

  // 파일 클릭 핸들러
  const handleFileClick = useCallback((file: FileItem) => {
    if (file.file) {
      // 새 파일인 경우 다운로드
      const url = URL.createObjectURL(file.file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert(`파일 클릭: ${file.name}`)
    }
  }, [])

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>FileUpload 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              파일 업로드 공통 컴포넌트 예제입니다. 박스를 클릭하거나 파일을 드래그하세요.
            </p>
          </div>
        </div>

        {/* 기본 사용법 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>기본 사용법</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 1. 기본 파일 업로드 (단일) */}
                  <tr>
                    <th>단일 파일 업로드</th>
                    <td>
                      <FileUpload
                        files={basicFiles}
                        onAdd={(files) => handleAddFiles(files, basicFiles, setBasicFiles)}
                        onRemove={(index) => handleRemoveFile(index, basicFiles, setBasicFiles)}
                        onFileClick={handleFileClick}
                      />
                    </td>
                  </tr>

                  {/* 2. 다중 파일 업로드 */}
                  <tr>
                    <th>다중 파일 업로드</th>
                    <td>
                      <FileUpload
                        label="첨부파일"
                        files={multipleFiles}
                        onAdd={(files) => handleAddFiles(files, multipleFiles, setMultipleFiles)}
                        onRemove={(index) => handleRemoveFile(index, multipleFiles, setMultipleFiles)}
                        onFileClick={handleFileClick}
                        multiple
                      />
                      {multipleFiles.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          총 {multipleFiles.length}개 파일
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. 필수 입력 + 에러 상태 */}
                  <tr>
                    <th>필수 입력 + 에러</th>
                    <td>
                      <FileUpload
                        label="사업자등록증"
                        required
                        files={requiredFiles}
                        onAdd={(files) => handleAddFiles(files, requiredFiles, setRequiredFiles)}
                        onRemove={(index) => handleRemoveFile(index, requiredFiles, setRequiredFiles)}
                        onFileClick={handleFileClick}
                        error={requiredFiles.length === 0}
                        helpText={requiredFiles.length === 0 ? '필수 입력 항목입니다.' : undefined}
                      />
                    </td>
                  </tr>

                  {/* 4. 값이 있는 상태 */}
                  <tr>
                    <th>값이 있는 상태</th>
                    <td>
                      <FileUpload
                        label="업로드된 파일"
                        files={filledFiles}
                        onAdd={(files) => handleAddFiles(files, filledFiles, setFilledFiles)}
                        onRemove={(index) => handleRemoveFile(index, filledFiles, setFilledFiles)}
                        onFileClick={handleFileClick}
                        multiple
                      />
                    </td>
                  </tr>

                  {/* 5. 비활성화 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <FileUpload
                        label="읽기 전용"
                        files={[
                          { id: 1, name: '계약서.pdf' },
                          { id: 2, name: '동의서.pdf' },
                        ]}
                        onAdd={() => { }}
                        onRemove={() => { }}
                        disabled
                      />
                    </td>
                  </tr>

                  {/* 6. 파일 타입 제한 */}
                  <tr>
                    <th>파일 타입 제한</th>
                    <td>
                      <FileUpload
                        label="PDF 파일만"
                        files={[]}
                        onAdd={() => { }}
                        onRemove={() => { }}
                        accept=".pdf"
                        guideText="PDF 파일만 업로드 가능합니다."
                      />
                    </td>
                  </tr>

                  {/* 7. 커스텀 안내 문구 */}
                  <tr>
                    <th>커스텀 안내 문구</th>
                    <td>
                      <FileUpload
                        files={[]}
                        onAdd={() => { }}
                        onRemove={() => { }}
                        guideText="파일을 여기에 끌어다 놓거나 클릭하여 선택하세요."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Props 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Props 설명</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="160px" />
                  <col width="200px" />
                  <col width="180px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>타입</th>
                    <th>기본값</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">files</code></td>
                    <td>FileItem[]</td>
                    <td>필수</td>
                    <td>현재 파일 목록</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onAdd</code></td>
                    <td>(files: File[]) =&gt; void</td>
                    <td>필수</td>
                    <td>파일 추가 핸들러</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onRemove</code></td>
                    <td>(index: number) =&gt; void</td>
                    <td>필수</td>
                    <td>파일 삭제 핸들러</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onFileClick</code></td>
                    <td>(file, index) =&gt; void</td>
                    <td>-</td>
                    <td>파일 클릭 핸들러</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">label</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>라벨 텍스트</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">required</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>필수 입력 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">error</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>에러 상태</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">helpText</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>에러/도움말 메시지</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">multiple</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>다중 파일 허용</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">disabled</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">accept</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>허용 파일 타입 (예: .pdf)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">guideText</code></td>
                    <td>string</td>
                    <td>Drag & Drop으로...</td>
                    <td>안내 문구</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FileItem 타입 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>FileItem 타입</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="160px" />
                  <col width="180px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>필드</th>
                    <th>타입</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">id</code></td>
                    <td>string | number (optional)</td>
                    <td>파일 고유 ID (기존 파일용)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">name</code></td>
                    <td>string</td>
                    <td>파일명</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">file</code></td>
                    <td>File (optional)</td>
                    <td>파일 객체 (새로 추가된 파일)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">type</code></td>
                    <td>string (optional)</td>
                    <td>파일 MIME 타입</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">size</code></td>
                    <td>number (optional)</td>
                    <td>파일 크기 (bytes)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>사용 예시</h2>
          </div>
          <div className="slidebox-body">
            <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-100">
                {`import { useState } from 'react'
import { FileUpload, type FileItem } from '@/components/common/ui'

export default function MyForm() {
  const [files, setFiles] = useState<FileItem[]>([])

  const handleAdd = (newFiles: File[]) => {
    const items = newFiles.map((file) => ({
      name: file.name,
      file,
      type: file.type,
    }))
    setFiles([...files, ...items])
  }

  const handleRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <FileUpload
      label="첨부파일"
      required
      files={files}
      onAdd={handleAdd}
      onRemove={handleRemove}
      multiple
      accept=".pdf,.doc,.docx"
      error={files.length === 0}
      helpText={files.length === 0 ? '필수 입력 항목입니다.' : undefined}
    />
  )
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
