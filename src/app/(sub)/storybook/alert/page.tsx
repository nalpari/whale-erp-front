'use client'

import { useAlert } from '@/components/common/ui'

/**
 * Alert 컴포넌트 Storybook 페이지
 * - Alert/Confirm 컴포넌트의 다양한 사용 예제를 확인할 수 있는 페이지
 */
export default function AlertStorybookPage() {
  const { alert, confirm } = useAlert()

  // 기본 Alert
  const handleBasicAlert = async () => {
    await alert('기본 Alert 메시지입니다.')
    console.log('Alert 닫힘')
  }

  // 제목이 있는 Alert
  const handleTitleAlert = async () => {
    await alert('저장이 완료되었습니다.', {
      title: '저장 완료',
    })
    console.log('Alert 닫힘')
  }

  // 커스텀 버튼 텍스트 Alert
  const handleCustomAlert = async () => {
    await alert('작업이 정상적으로 처리되었습니다.', {
      title: '처리 완료',
      confirmText: '닫기',
    })
    console.log('Alert 닫힘')
  }

  // 기본 Confirm
  const handleBasicConfirm = async () => {
    const result = await confirm('정말 삭제하시겠습니까?')
    console.log('Confirm 결과:', result)
    if (result) {
      await alert('삭제되었습니다.')
    }
  }

  // 제목이 있는 Confirm
  const handleTitleConfirm = async () => {
    const result = await confirm('변경 내용을 저장하시겠습니까?', {
      title: '저장 확인',
    })
    console.log('Confirm 결과:', result)
    if (result) {
      await alert('저장되었습니다.')
    } else {
      await alert('취소되었습니다.')
    }
  }

  // 커스텀 버튼 텍스트 Confirm
  const handleCustomConfirm = async () => {
    const result = await confirm('이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?', {
      title: '주의',
      confirmText: '계속',
      cancelText: '돌아가기',
    })
    console.log('Confirm 결과:', result)
  }

  // 여러 단계 Confirm
  const handleMultiStepConfirm = async () => {
    const step1 = await confirm('1단계: 데이터를 검증하시겠습니까?', {
      title: '데이터 검증',
      confirmText: '검증',
    })
    if (!step1) {
      await alert('검증이 취소되었습니다.')
      return
    }

    const step2 = await confirm('2단계: 데이터를 저장하시겠습니까?', {
      title: '데이터 저장',
      confirmText: '저장',
    })
    if (!step2) {
      await alert('저장이 취소되었습니다.')
      return
    }

    await alert('모든 단계가 완료되었습니다.', {
      title: '완료',
    })
  }

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Alert / Confirm 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              JavaScript의 alert()과 confirm()을 대체하는 모달 컴포넌트입니다.
              <br />
              Promise 기반으로 동작하며, async/await 문법으로 직관적으로 사용할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Alert 섹션 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Alert (알림)</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                  <col width="150px" />
                </colgroup>
                <tbody>
                  <tr>
                    <th>기본 Alert</th>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        await alert(&apos;메시지&apos;)
                      </code>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleBasicAlert}>
                        테스트
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>제목 포함</th>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        await alert(&apos;메시지&apos;, &#123; title: &apos;제목&apos; &#125;)
                      </code>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleTitleAlert}>
                        테스트
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>버튼 텍스트 변경</th>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        await alert(&apos;메시지&apos;, &#123; confirmText: &apos;닫기&apos; &#125;)
                      </code>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleCustomAlert}>
                        테스트
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Confirm 섹션 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Confirm (확인)</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                  <col width="150px" />
                </colgroup>
                <tbody>
                  <tr>
                    <th>기본 Confirm</th>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        const result = await confirm(&apos;메시지&apos;)
                      </code>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleBasicConfirm}>
                        테스트
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>제목 포함</th>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        await confirm(&apos;메시지&apos;, &#123; title: &apos;제목&apos; &#125;)
                      </code>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleTitleConfirm}>
                        테스트
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>버튼 텍스트 변경</th>
                    <td>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        await confirm(&apos;메시지&apos;, &#123; confirmText: &apos;계속&apos;, cancelText: &apos;돌아가기&apos; &#125;)
                      </code>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleCustomConfirm}>
                        테스트
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>다중 단계</th>
                    <td>
                      <span className="text-gray-600 text-sm">
                        여러 confirm을 순차적으로 연결하여 단계별 확인 가능
                      </span>
                    </td>
                    <td>
                      <button className="btn-form basic" onClick={handleMultiStepConfirm}>
                        테스트
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 사용법 섹션 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>사용법</h2>
          </div>
          <div className="slidebox-body">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">1. AlertProvider 설정 (레이아웃)</h3>
              <pre className="bg-gray-800 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// src/app/(sub)/layout.tsx
import { AlertProvider } from '@/components/common/ui'

export default function Layout({ children }) {
  return (
    <AlertProvider>
      {children}
    </AlertProvider>
  )
}`}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">2. 컴포넌트에서 사용</h3>
              <pre className="bg-gray-800 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`'use client'

import { useAlert } from '@/components/common/ui'

export default function MyComponent() {
  const { alert, confirm } = useAlert()

  const handleDelete = async () => {
    const result = await confirm('정말 삭제하시겠습니까?', {
      title: '삭제 확인',
      confirmText: '삭제',
      cancelText: '취소',
    })

    if (result) {
      // 삭제 로직 실행
      await deleteItem()
      await alert('삭제되었습니다.')
    }
  }

  return (
    <button onClick={handleDelete}>삭제</button>
  )
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Props 설명 테이블 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>API</h2>
          </div>
          <div className="slidebox-body">
            <h3 className="font-semibold mb-2">alert(message, options?) → Promise&lt;void&gt;</h3>
            <div className="slide-table-wrap mb-6">
              <table className="default-table">
                <colgroup>
                  <col width="150px" />
                  <col width="150px" />
                  <col width="100px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>옵션</th>
                    <th>타입</th>
                    <th>기본값</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">message</code></td>
                    <td>string</td>
                    <td>필수</td>
                    <td>알림 메시지</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">title</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>모달 제목</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">confirmText</code></td>
                    <td>string</td>
                    <td>&apos;확인&apos;</td>
                    <td>확인 버튼 텍스트</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold mb-2">confirm(message, options?) → Promise&lt;boolean&gt;</h3>
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="150px" />
                  <col width="150px" />
                  <col width="100px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>옵션</th>
                    <th>타입</th>
                    <th>기본값</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">message</code></td>
                    <td>string</td>
                    <td>필수</td>
                    <td>확인 메시지</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">title</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>모달 제목</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">confirmText</code></td>
                    <td>string</td>
                    <td>&apos;확인&apos;</td>
                    <td>확인 버튼 텍스트</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">cancelText</code></td>
                    <td>string</td>
                    <td>&apos;취소&apos;</td>
                    <td>취소 버튼 텍스트</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 특징 섹션 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>특징</h2>
          </div>
          <div className="slidebox-body">
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Promise 기반으로 async/await 문법 지원</li>
              <li>window.alert(), window.confirm() 대체 가능</li>
              <li>커스터마이즈 가능한 제목, 버튼 텍스트</li>
              <li>pub 프로젝트의 모달 스타일 적용</li>
              <li>React Context API를 활용한 전역 상태 관리</li>
              <li>TypeScript 완벽 지원</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
