'use client'

import { useState } from 'react'
import { Input } from '@/components/common/ui'

/**
 * Input 컴포넌트 Storybook 페이지
 * - Input 컴포넌트의 다양한 사용 예제를 확인할 수 있는 페이지
 */
export default function InputStorybookPage() {
  // Input 예제용 상태
  const [basicValue, setBasicValue] = useState('')
  const [requiredValue, setRequiredValue] = useState('')
  const [errorValue, setErrorValue] = useState('')
  const [clearValue, setClearValue] = useState('삭제 가능한 텍스트')
  const [explainValue, setExplainValue] = useState('주식회사 따름인')

  // 숫자/금액/퍼센트 타입 예제용 상태
  const [numberValue, setNumberValue] = useState('')
  const [numberActual, setNumberActual] = useState<number | null>(null)
  const [currencyValue, setCurrencyValue] = useState('')
  const [currencyActual, setCurrencyActual] = useState<number | null>(null)
  const [percentValue, setPercentValue] = useState('')
  const [percentActual, setPercentActual] = useState<number | null>(null)

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Input 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              여러 화면에서 재사용 가능한 Input 컴포넌트 예제입니다.
            </p>
          </div>
        </div>

        {/* Input 컴포넌트 섹션 */}
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
                  {/* 1. 기본 Input */}
                  <tr>
                    <th>기본 Input</th>
                    <td>
                      <Input
                        placeholder="텍스트를 입력하세요"
                        value={basicValue}
                        onChange={(e) => setBasicValue(e.target.value)}
                      />
                    </td>
                  </tr>

                  {/* 2. 라벨 + 필수 입력 */}
                  <tr>
                    <th>라벨 + 필수 입력</th>
                    <td>
                      <Input
                        label="업체명"
                        required
                        placeholder="업체명을 입력하세요"
                        value={requiredValue}
                        onChange={(e) => setRequiredValue(e.target.value)}
                      />
                    </td>
                  </tr>

                  {/* 3. 에러 상태 + 에러 메시지 */}
                  <tr>
                    <th>에러 상태</th>
                    <td>
                      <Input
                        label="사업자등록번호"
                        required
                        placeholder="000-00-00000"
                        value={errorValue}
                        onChange={(e) => setErrorValue(e.target.value)}
                        error={true}
                        helpText="필수 입력 항목입니다."
                        showClear
                        onClear={() => setErrorValue('')}
                      />
                    </td>
                  </tr>

                  {/* 4. Clear 버튼 */}
                  <tr>
                    <th>Clear 버튼</th>
                    <td>
                      <Input
                        placeholder="값을 입력하면 X 버튼이 나타납니다"
                        value={clearValue}
                        onChange={(e) => setClearValue(e.target.value)}
                        showClear
                        onClear={() => setClearValue('')}
                      />
                    </td>
                  </tr>

                  {/* 5. 설명 텍스트 (explain) */}
                  <tr>
                    <th>설명 텍스트</th>
                    <td>
                      <Input
                        label="업체명"
                        required
                        value={explainValue}
                        onChange={(e) => setExplainValue(e.target.value)}
                        showClear
                        onClear={() => setExplainValue('')}
                        explain="BMI1234"
                      />
                    </td>
                  </tr>

                  {/* 6. 읽기 전용 */}
                  <tr>
                    <th>읽기 전용 (readOnly)</th>
                    <td>
                      <Input
                        value="Hc-1234567"
                        readOnly
                        endAdornment={
                          <button className="btn-form outline s">중복 확인</button>
                        }
                      />
                    </td>
                  </tr>

                  {/* 7. 비활성화 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <Input
                        value="홍길동(hs_admin)"
                        disabled
                      />
                    </td>
                  </tr>

                  {/* 8. 도움말 텍스트 */}
                  <tr>
                    <th>도움말 텍스트</th>
                    <td>
                      <Input
                        label="Master ID"
                        required
                        value="whale-erp-001"
                        readOnly
                        helpText="WHALE ERP의 Partner Office에 로그인할 때 사용할 ID를 입력해 주세요."
                      />
                    </td>
                  </tr>

                  {/* 9. 전체 너비 */}
                  <tr>
                    <th>전체 너비 (fullWidth)</th>
                    <td>
                      <Input
                        placeholder="전체 너비를 사용하는 Input"
                        value=""
                        onChange={() => { }}
                        fullWidth
                      />
                    </td>
                  </tr>

                  {/* 10. 좌측 버튼 + Input 조합 */}
                  <tr>
                    <th>좌측 버튼 조합</th>
                    <td>
                      <Input
                        value=""
                        onChange={() => { }}
                        placeholder="옵션을 선택하세요"
                        startAdornment={
                          <button className="btn-form outline s">옵션 찾기</button>
                        }
                        explain="PDM10005"
                        endAdornment={
                          <div className="store-badge blue">운영</div>
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 숫자/금액/퍼센트 타입 섹션 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>숫자/금액/퍼센트 타입</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                  <col width="200px" />
                </colgroup>
                <tbody>
                  {/* 11. 숫자만 입력 */}
                  <tr>
                    <th>숫자만 입력 (number)</th>
                    <td>
                      <Input
                        type="number"
                        placeholder="숫자만 입력 가능"
                        value={numberValue}
                        onChange={(e) => setNumberValue(e.target.value)}
                        onValueChange={(val) => setNumberActual(val)}
                      />
                    </td>
                    <td className="text-gray-500 text-sm">
                      실제 값: {numberActual !== null ? numberActual : '(없음)'}
                    </td>
                  </tr>

                  {/* 12. 금액 입력 */}
                  <tr>
                    <th>금액 (currency)</th>
                    <td>
                      <Input
                        type="currency"
                        label="단가"
                        placeholder="금액을 입력하세요"
                        value={currencyValue}
                        onChange={(e) => setCurrencyValue(e.target.value)}
                        onValueChange={(val) => setCurrencyActual(val)}
                        endAdornment={<span className="explain">원</span>}
                      />
                    </td>
                    <td className="text-gray-500 text-sm">
                      실제 값: {currencyActual !== null ? currencyActual.toLocaleString() : '(없음)'}
                    </td>
                  </tr>

                  {/* 13. 퍼센트 입력 */}
                  <tr>
                    <th>퍼센트 (percent)</th>
                    <td>
                      <Input
                        type="percent"
                        label="할인율"
                        placeholder="0~100 사이 값"
                        value={percentValue}
                        onChange={(e) => setPercentValue(e.target.value)}
                        onValueChange={(val) => setPercentActual(val)}
                        endAdornment={<span className="explain">%</span>}
                        helpText="0보다 크고 100보다 작은 값만 입력 가능합니다."
                      />
                    </td>
                    <td className="text-gray-500 text-sm">
                      실제 값: {percentActual !== null ? percentActual : '(없음)'}
                    </td>
                  </tr>

                  {/* 14. 금액 + Clear 버튼 */}
                  <tr>
                    <th>금액 + Clear 버튼</th>
                    <td>
                      <Input
                        type="currency"
                        label="판매가"
                        required
                        placeholder="판매가를 입력하세요"
                        value={currencyValue}
                        onChange={(e) => setCurrencyValue(e.target.value)}
                        onValueChange={(val) => setCurrencyActual(val)}
                        showClear
                        onClear={() => {
                          setCurrencyValue('')
                          setCurrencyActual(null)
                        }}
                        endAdornment={<span className="explain">원</span>}
                      />
                    </td>
                    <td className="text-gray-500 text-sm">
                      실제 값: {currencyActual !== null ? currencyActual.toLocaleString() : '(없음)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Props 설명 테이블 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Props 설명</h2>
          </div>
          <div className="slidebox-body">
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
                    <th>Prop</th>
                    <th>타입</th>
                    <th>기본값</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">label</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>입력 필드 위에 표시되는 라벨</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">required</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>필수 입력 여부 (라벨에 * 표시)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">error</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>에러 상태 (빨간 테두리)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">helpText</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>에러 메시지 또는 도움말 텍스트</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">explain</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>입력 필드 옆 보조 텍스트 (예: ID코드)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">showClear</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>값 초기화 버튼 표시 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onClear</code></td>
                    <td>() =&gt; void</td>
                    <td>-</td>
                    <td>값 초기화 버튼 클릭 핸들러</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">startAdornment</code></td>
                    <td>ReactNode</td>
                    <td>-</td>
                    <td>입력 필드 좌측에 렌더링할 요소</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">endAdornment</code></td>
                    <td>ReactNode</td>
                    <td>-</td>
                    <td>입력 필드 우측에 렌더링할 요소</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">fullWidth</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>전체 너비 사용 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">type</code></td>
                    <td>&apos;text&apos; | &apos;number&apos; | &apos;currency&apos; | &apos;percent&apos;</td>
                    <td>&apos;text&apos;</td>
                    <td>입력 타입 (text: 일반, number: 숫자만, currency: 금액, percent: 퍼센트)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onValueChange</code></td>
                    <td>(value: number | null) =&gt; void</td>
                    <td>-</td>
                    <td>숫자 타입에서 실제 숫자 값 변경 핸들러</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 타입별 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>타입별 특징</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="120px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>타입</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">text</code></td>
                    <td>일반 텍스트 입력 (기본값)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">number</code></td>
                    <td>숫자만 입력 가능 (정수). 음수 허용.</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">currency</code></td>
                    <td>금액 입력. 입력 시 3자리마다 콤마 표시. 실제 값은 숫자.</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">percent</code></td>
                    <td>퍼센트 입력. 숫자와 소수점만 허용. 0 &lt; 값 &lt; 100 범위 제한.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
