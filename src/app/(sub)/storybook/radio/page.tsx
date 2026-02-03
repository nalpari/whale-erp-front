'use client'

import { useState } from 'react'
import { RadioButtonGroup } from '@/components/common/ui'

/**
 * RadioButtonGroup 컴포넌트 Storybook 페이지
 * - RadioButtonGroup 컴포넌트의 다양한 사용 예제를 확인할 수 있는 페이지
 */
export default function RadioStorybookPage() {
  // 기본 예제용 상태
  const [status, setStatus] = useState<'all' | 'pending' | 'completed'>('pending')

  // 다양한 옵션 예제
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [disabled, setDisabled] = useState<'yes' | 'no'>('yes')

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>RadioButtonGroup 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              버튼 형태의 라디오 그룹 컴포넌트입니다. radio-wrap, radio-btn 스타일을 사용합니다.
            </p>
          </div>
        </div>

        {/* RadioButtonGroup 컴포넌트 섹션 */}
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
                  <col width="150px" />
                </colgroup>
                <tbody>
                  {/* 1. 기본 RadioButtonGroup */}
                  <tr>
                    <th>기본 (처리 상태)</th>
                    <td>
                      <RadioButtonGroup
                        options={[
                          { value: 'all', label: '전체' },
                          { value: 'pending', label: '처리전' },
                          { value: 'completed', label: '처리완료' },
                        ]}
                        value={status}
                        onChange={setStatus}
                      />
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">선택: {status}</span>
                    </td>
                  </tr>

                  {/* 2. 2개 옵션 */}
                  <tr>
                    <th>2개 옵션 (성별)</th>
                    <td>
                      <RadioButtonGroup
                        options={[
                          { value: 'male', label: '남성' },
                          { value: 'female', label: '여성' },
                        ]}
                        value={gender}
                        onChange={setGender}
                      />
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">선택: {gender}</span>
                    </td>
                  </tr>

                  {/* 3. 라벨 포함 */}
                  <tr>
                    <th>라벨 포함</th>
                    <td>
                      <RadioButtonGroup
                        label="우선순위"
                        options={[
                          { value: 'high', label: '높음' },
                          { value: 'medium', label: '보통' },
                          { value: 'low', label: '낮음' },
                        ]}
                        value={priority}
                        onChange={setPriority}
                      />
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">선택: {priority}</span>
                    </td>
                  </tr>

                  {/* 4. 필수 입력 표시 */}
                  <tr>
                    <th>필수 입력</th>
                    <td>
                      <RadioButtonGroup
                        label="활성화 여부"
                        required
                        options={[
                          { value: 'yes', label: '활성화' },
                          { value: 'no', label: '비활성화' },
                        ]}
                        value={disabled}
                        onChange={setDisabled}
                      />
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">선택: {disabled}</span>
                    </td>
                  </tr>

                  {/* 5. 비활성화 상태 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <RadioButtonGroup
                        options={[
                          { value: 'all', label: '전체' },
                          { value: 'pending', label: '처리전' },
                          { value: 'completed', label: '처리완료' },
                        ]}
                        value="pending"
                        onChange={() => {}}
                        disabled
                      />
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">클릭 불가</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 코드 예제 섹션 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>사용 예제 코드</h2>
          </div>
          <div className="slidebox-body">
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { useState } from 'react'
import { RadioButtonGroup } from '@/components/common/ui'

function MyComponent() {
  const [status, setStatus] = useState<'all' | 'pending' | 'completed'>('pending')

  return (
    <RadioButtonGroup
      options={[
        { value: 'all', label: '전체' },
        { value: 'pending', label: '처리전' },
        { value: 'completed', label: '처리완료' },
      ]}
      value={status}
      onChange={setStatus}
    />
  )
}`}
            </pre>
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
                  <col width="200px" />
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
                    <td><code className="bg-gray-100 px-1 rounded">options</code></td>
                    <td>{`RadioOption<T>[]`}</td>
                    <td>필수</td>
                    <td>라디오 옵션 배열 (value, label)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">value</code></td>
                    <td>T (string)</td>
                    <td>필수</td>
                    <td>현재 선택된 값</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onChange</code></td>
                    <td>{`(value: T) => void`}</td>
                    <td>필수</td>
                    <td>값 변경 핸들러</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">label</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>그룹 상단에 표시되는 라벨</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">required</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>필수 입력 여부 (라벨에 * 표시)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">disabled</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">name</code></td>
                    <td>string</td>
                    <td>auto</td>
                    <td>폼 전송용 라디오 버튼 이름</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">className</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>컨테이너 추가 클래스</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RadioOption 타입 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>RadioOption 타입</h2>
          </div>
          <div className="slidebox-body">
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`interface RadioOption<T extends string = string> {
  /** 옵션 값 */
  value: T
  /** 옵션 라벨 (표시 텍스트) */
  label: ReactNode
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
