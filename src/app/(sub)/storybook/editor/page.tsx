'use client'

import { useState, useCallback } from 'react'
import { Editor } from '@/components/common/ui'

/**
 * Editor 컴포넌트 Storybook 페이지
 * - Tiptap 기반 에디터 컴포넌트 예제
 * - 이미지 드래그&드롭, 붙여넣기 지원
 */
export default function EditorStorybookPage() {
  // 기본 예제용 상태
  const [basicContent, setBasicContent] = useState('')

  // 라벨 + 필수 예제용 상태
  const [requiredContent, setRequiredContent] = useState('')

  // 에러 상태 예제용 상태
  const [errorContent, setErrorContent] = useState('')

  // 값이 있는 예제용 상태
  const [filledContent, setFilledContent] = useState(
    '<h2>환영합니다!</h2><p>이것은 <strong>Tiptap 에디터</strong>입니다.</p><p>다양한 텍스트 서식을 지원합니다:</p><ul><li>굵은 텍스트</li><li>기울임 텍스트</li><li>취소선</li><li><code>인라인 코드</code></li></ul><blockquote>인용구도 사용할 수 있습니다.</blockquote>'
  )

  // 이미지 업로드 시뮬레이션 핸들러
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    // 실제 프로젝트에서는 S3 등에 업로드 후 URL 반환
    // 여기서는 Base64로 변환하여 반환 (시뮬레이션)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 1초 딜레이로 업로드 시뮬레이션
        setTimeout(() => {
          resolve(reader.result as string)
        }, 500)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Editor 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              Tiptap 기반의 리치 텍스트 에디터 컴포넌트입니다.
              <br />
              이미지를 드래그&드롭하거나 붙여넣기(Ctrl+V)로 삽입할 수 있습니다.
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
                  {/* 1. 기본 에디터 */}
                  <tr>
                    <th>기본 에디터</th>
                    <td>
                      <Editor
                        placeholder="텍스트를 입력하세요..."
                        value={basicContent}
                        onChange={setBasicContent}
                        minHeight={150}
                      />
                    </td>
                  </tr>

                  {/* 2. 라벨 + 필수 입력 */}
                  <tr>
                    <th>라벨 + 필수 입력</th>
                    <td>
                      <Editor
                        label="공지사항 내용"
                        required
                        placeholder="공지사항 내용을 입력하세요..."
                        value={requiredContent}
                        onChange={setRequiredContent}
                        minHeight={150}
                      />
                    </td>
                  </tr>

                  {/* 3. 에러 상태 */}
                  <tr>
                    <th>에러 상태</th>
                    <td>
                      <Editor
                        label="상세 설명"
                        required
                        placeholder="상세 설명을 입력하세요..."
                        value={errorContent}
                        onChange={setErrorContent}
                        error={errorContent.length === 0}
                        helpText={errorContent.length === 0 ? '필수 입력 항목입니다.' : undefined}
                        minHeight={150}
                      />
                    </td>
                  </tr>

                  {/* 4. 값이 있는 상태 */}
                  <tr>
                    <th>값이 있는 상태</th>
                    <td>
                      <Editor
                        label="수정 중인 문서"
                        value={filledContent}
                        onChange={setFilledContent}
                        minHeight={200}
                      />
                    </td>
                  </tr>

                  {/* 5. 이미지 업로드 핸들러 */}
                  <tr>
                    <th>이미지 업로드 (커스텀)</th>
                    <td>
                      <Editor
                        label="이미지 포함 문서"
                        placeholder="이미지를 드래그하거나 툴바에서 추가하세요..."
                        onImageUpload={handleImageUpload}
                        maxImageSize={5 * 1024 * 1024} // 5MB
                        minHeight={200}
                        helpText="이미지 최대 크기: 5MB / 지원 형식: JPG, PNG, GIF, WebP"
                      />
                    </td>
                  </tr>

                  {/* 6. 높이 제한 */}
                  <tr>
                    <th>높이 제한 (스크롤)</th>
                    <td>
                      <Editor
                        label="제한된 높이"
                        placeholder="최대 높이가 200px로 제한되어 있습니다..."
                        minHeight={100}
                        maxHeight={200}
                      />
                    </td>
                  </tr>

                  {/* 7. 읽기 전용 */}
                  <tr>
                    <th>읽기 전용</th>
                    <td>
                      <Editor
                        label="읽기 전용 문서"
                        value="<h3>읽기 전용 모드</h3><p>이 에디터는 <strong>수정할 수 없습니다</strong>.</p><p>내용을 확인하는 용도로만 사용됩니다.</p>"
                        readOnly
                        minHeight={150}
                      />
                    </td>
                  </tr>

                  {/* 8. 비활성화 */}
                  <tr>
                    <th>비활성화</th>
                    <td>
                      <Editor
                        label="비활성화된 에디터"
                        value="<p>비활성화된 상태입니다.</p>"
                        disabled
                        minHeight={100}
                      />
                    </td>
                  </tr>

                  {/* 9. 툴바 없음 */}
                  <tr>
                    <th>툴바 없음</th>
                    <td>
                      <Editor
                        placeholder="툴바 없이 입력하세요... (슬래시 '/' 키로 명령어 사용 가능)"
                        showToolbar={false}
                        minHeight={150}
                      />
                    </td>
                  </tr>

                  {/* 10. 슬래시 명령어 비활성화 */}
                  <tr>
                    <th>슬래시 명령어 비활성화</th>
                    <td>
                      <Editor
                        label="슬래시 명령어 없음"
                        placeholder="슬래시 명령어가 비활성화된 에디터입니다..."
                        enableSlashCommands={false}
                        minHeight={150}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 지원 기능 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>지원 기능</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="150px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>기능</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>텍스트 서식</strong></td>
                    <td>굵게, 기울임, 취소선, 인라인 코드</td>
                  </tr>
                  <tr>
                    <td><strong>제목</strong></td>
                    <td>H1, H2, H3 제목 스타일</td>
                  </tr>
                  <tr>
                    <td><strong>목록</strong></td>
                    <td>글머리 기호 목록, 번호 매기기 목록</td>
                  </tr>
                  <tr>
                    <td><strong>블록 요소</strong></td>
                    <td>인용구, 코드 블록, 가로줄</td>
                  </tr>
                  <tr>
                    <td><strong>이미지</strong></td>
                    <td>툴바 버튼, 드래그&드롭, 클립보드 붙여넣기</td>
                  </tr>
                  <tr>
                    <td><strong>단축키</strong></td>
                    <td>Ctrl+B (굵게), Ctrl+I (기울임), Ctrl+Z (실행 취소), Ctrl+Y (다시 실행)</td>
                  </tr>
                  <tr>
                    <td><strong>슬래시 명령어</strong></td>
                    <td>
                      &apos;/&apos; 입력 시 명령어 팝업 표시 (제목, 목록, 인용구, 코드 블록, 가로줄 등)
                      <br />
                      ↑↓ 키로 선택, Enter로 실행, Esc로 취소
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
                  <col width="220px" />
                  <col width="150px" />
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
                    <td><code className="bg-gray-100 px-1 rounded">value</code></td>
                    <td>string</td>
                    <td>{`''`}</td>
                    <td>에디터 내용 (HTML 문자열)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onChange</code></td>
                    <td>(html: string) =&gt; void</td>
                    <td>-</td>
                    <td>내용 변경 핸들러</td>
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
                    <td><code className="bg-gray-100 px-1 rounded">placeholder</code></td>
                    <td>string</td>
                    <td>{`'내용을 입력하세요...'`}</td>
                    <td>플레이스홀더 텍스트</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">minHeight</code></td>
                    <td>number</td>
                    <td>200</td>
                    <td>최소 높이 (px)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">maxHeight</code></td>
                    <td>number</td>
                    <td>-</td>
                    <td>최대 높이 (px)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">disabled</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">readOnly</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>읽기 전용 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onImageUpload</code></td>
                    <td>(file: File) =&gt; Promise&lt;string&gt;</td>
                    <td>-</td>
                    <td>이미지 업로드 핸들러 (URL 반환)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">maxImageSize</code></td>
                    <td>number</td>
                    <td>10MB</td>
                    <td>이미지 최대 크기 (bytes)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">acceptImageTypes</code></td>
                    <td>string[]</td>
                    <td>{`['image/jpeg', ...]`}</td>
                    <td>허용 이미지 타입</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">showToolbar</code></td>
                    <td>boolean</td>
                    <td>true</td>
                    <td>툴바 표시 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">enableSlashCommands</code></td>
                    <td>boolean</td>
                    <td>true</td>
                    <td>슬래시 명령어 사용 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">slashCommands</code></td>
                    <td>SlashCommandItem[]</td>
                    <td>기본 명령어</td>
                    <td>커스텀 슬래시 명령어 배열</td>
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
import { Editor } from '@/components/common/ui'

export default function MyForm() {
  const [content, setContent] = useState('')

  // S3 업로드 예시
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    return data.url // S3 URL 반환
  }

  return (
    <Editor
      label="공지사항 내용"
      required
      placeholder="공지사항 내용을 입력하세요..."
      value={content}
      onChange={setContent}
      onImageUpload={handleImageUpload}
      maxImageSize={5 * 1024 * 1024} // 5MB
      error={content.length === 0}
      helpText={content.length === 0 ? '필수 입력 항목입니다.' : undefined}
      minHeight={300}
    />
  )
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* HTML 출력 확인 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>HTML 출력 확인</h2>
          </div>
          <div className="slidebox-body">
            <div className="mb-4">
              <strong>기본 에디터 HTML 출력:</strong>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all">
                {basicContent || '(에디터에 내용을 입력하세요)'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
