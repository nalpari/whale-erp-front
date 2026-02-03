'use client'

import { useState, useCallback } from 'react'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

// 샘플 데이터
const SAMPLE_OPTIONS: SelectOption[] = [
  { value: 'kim-cheolsu', label: '김철수' },
  { value: 'lee-sunsin', label: '이순신' },
  { value: 'park-cheolsu', label: '박철수' },
  { value: 'choi-younghee', label: '최영희' },
  { value: 'jang-minsu', label: '장민수' },
  { value: 'jung-hanna', label: '정한나' },
  { value: 'oh-sehoon', label: '오세훈' },
  { value: 'shin-jiyeon', label: '신지연' },
  { value: 'bae-soojin', label: '배수진' },
  { value: 'lee-jinwook', label: '이진욱' },
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: '운영중' },
  { value: 'inactive', label: '미운영' },
  { value: 'pending', label: '대기중' },
  { value: 'suspended', label: '정지됨' },
]

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'food', label: '음식점' },
  { value: 'cafe', label: '카페' },
  { value: 'retail', label: '소매점' },
  { value: 'service', label: '서비스업' },
  { value: 'etc', label: '기타' },
]

/**
 * SearchSelect 컴포넌트 Storybook 페이지
 * - 검색 가능한 셀렉트 박스 공통 컴포넌트 예제
 * - 단일 선택, 다중 선택, 다양한 옵션 지원
 */
export default function SearchSelectStorybookPage() {
  // 단일 선택 예제
  const [singleValue, setSingleValue] = useState<SelectOption | null>(null)
  const [singleWithDefault, setSingleWithDefault] = useState<SelectOption | null>(
    STATUS_OPTIONS[0]
  )

  // 다중 선택 예제
  const [multiValue, setMultiValue] = useState<SelectOption[]>([])
  const [multiWithDefault, setMultiWithDefault] = useState<SelectOption[]>([
    CATEGORY_OPTIONS[0],
    CATEGORY_OPTIONS[1],
  ])

  // 핸들러
  const handleSingleChange = useCallback((value: SelectOption | null) => {
    setSingleValue(value)
  }, [])

  const handleSingleWithDefaultChange = useCallback((value: SelectOption | null) => {
    setSingleWithDefault(value)
  }, [])

  const handleMultiChange = useCallback((value: SelectOption[]) => {
    setMultiValue(value)
  }, [])

  const handleMultiWithDefaultChange = useCallback((value: SelectOption[]) => {
    setMultiWithDefault(value)
  }, [])

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>SearchSelect 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              검색 가능한 셀렉트 박스 공통 컴포넌트입니다. react-select 라이브러리를 기반으로 구현되었습니다.
            </p>
          </div>
        </div>

        {/* 단일 선택 예제 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>단일 선택 (Single Select)</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 1. 기본 사용법 */}
                  <tr>
                    <th>기본 사용법</th>
                    <td>
                      <SearchSelect
                        options={SAMPLE_OPTIONS}
                        value={singleValue}
                        onChange={handleSingleChange}
                        placeholder="담당자를 선택하세요"
                      />
                      {singleValue && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 값: {singleValue.label} ({singleValue.value})
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 2. 기본값이 있는 상태 */}
                  <tr>
                    <th>기본값이 있는 상태</th>
                    <td>
                      <SearchSelect
                        options={STATUS_OPTIONS}
                        value={singleWithDefault}
                        onChange={handleSingleWithDefaultChange}
                        placeholder="상태 선택"
                      />
                      {singleWithDefault && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 값: {singleWithDefault.label}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. 라벨 + 필수 */}
                  <tr>
                    <th>라벨 + 필수</th>
                    <td>
                      <SearchSelect
                        options={CATEGORY_OPTIONS}
                        value={null}
                        onChange={() => {}}
                        placeholder="업종을 선택하세요"
                        label="업종"
                        required
                      />
                    </td>
                  </tr>

                  {/* 4. 초기화 불가 */}
                  <tr>
                    <th>초기화 불가 (isClearable=false)</th>
                    <td>
                      <SearchSelect
                        options={STATUS_OPTIONS}
                        value={STATUS_OPTIONS[0]}
                        onChange={() => {}}
                        isClearable={false}
                      />
                      <div className="mt-2 text-sm text-gray-400">
                        * X 버튼이 표시되지 않아 선택 후 초기화 불가
                      </div>
                    </td>
                  </tr>

                  {/* 5. 검색 불가 */}
                  <tr>
                    <th>검색 불가 (isSearchable=false)</th>
                    <td>
                      <SearchSelect
                        options={STATUS_OPTIONS}
                        value={null}
                        onChange={() => {}}
                        placeholder="상태 선택"
                        isSearchable={false}
                      />
                      <div className="mt-2 text-sm text-gray-400">
                        * 드롭다운에서만 선택 가능 (텍스트 입력 불가)
                      </div>
                    </td>
                  </tr>

                  {/* 6. 비활성화 */}
                  <tr>
                    <th>비활성화 (isDisabled)</th>
                    <td>
                      <SearchSelect
                        options={SAMPLE_OPTIONS}
                        value={SAMPLE_OPTIONS[2]}
                        onChange={() => {}}
                        isDisabled
                      />
                    </td>
                  </tr>

                  {/* 7. 로딩 상태 */}
                  <tr>
                    <th>로딩 상태 (isLoading)</th>
                    <td>
                      <SearchSelect
                        options={[]}
                        value={null}
                        onChange={() => {}}
                        placeholder="데이터를 불러오는 중..."
                        isLoading
                      />
                    </td>
                  </tr>

                  {/* 8. 전체 너비 */}
                  <tr>
                    <th>전체 너비 (fullWidth)</th>
                    <td>
                      <SearchSelect
                        options={SAMPLE_OPTIONS}
                        value={null}
                        onChange={() => {}}
                        placeholder="담당자를 선택하세요"
                        fullWidth
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 다중 선택 예제 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>다중 선택 (Multi Select)</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 1. 기본 다중 선택 */}
                  <tr>
                    <th>기본 다중 선택</th>
                    <td>
                      <SearchSelect
                        options={SAMPLE_OPTIONS}
                        value={multiValue}
                        onChange={handleMultiChange}
                        placeholder="담당자를 선택하세요 (복수 선택 가능)"
                        isMulti
                      />
                      {multiValue.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 값: {multiValue.map((v) => v.label).join(', ')}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 2. 기본값이 있는 다중 선택 */}
                  <tr>
                    <th>기본값이 있는 상태</th>
                    <td>
                      <SearchSelect
                        options={CATEGORY_OPTIONS}
                        value={multiWithDefault}
                        onChange={handleMultiWithDefaultChange}
                        placeholder="업종을 선택하세요"
                        isMulti
                      />
                      {multiWithDefault.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 값: {multiWithDefault.map((v) => v.label).join(', ')}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. 라벨 + 필수 (다중) */}
                  <tr>
                    <th>라벨 + 필수</th>
                    <td>
                      <SearchSelect
                        options={STATUS_OPTIONS}
                        value={[]}
                        onChange={() => {}}
                        placeholder="상태를 선택하세요"
                        label="운영 상태"
                        required
                        isMulti
                      />
                    </td>
                  </tr>

                  {/* 4. 비활성화 (다중) */}
                  <tr>
                    <th>비활성화</th>
                    <td>
                      <SearchSelect
                        options={CATEGORY_OPTIONS}
                        value={[CATEGORY_OPTIONS[0], CATEGORY_OPTIONS[2]]}
                        onChange={() => {}}
                        isMulti
                        isDisabled
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
                  <col width="220px" />
                  <col width="120px" />
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
                    <td>
                      <code className="bg-gray-100 px-1 rounded">options</code>
                    </td>
                    <td>SelectOption[]</td>
                    <td>-</td>
                    <td>선택 옵션 목록 (필수)</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">value</code>
                    </td>
                    <td>SelectOption | SelectOption[] | null</td>
                    <td>-</td>
                    <td>선택된 값</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onChange</code>
                    </td>
                    <td>(value) =&gt; void</td>
                    <td>-</td>
                    <td>값 변경 핸들러</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">isMulti</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>다중 선택 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">placeholder</code>
                    </td>
                    <td>string</td>
                    <td>선택</td>
                    <td>placeholder 텍스트</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">isDisabled</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">isLoading</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>로딩 상태</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">isClearable</code>
                    </td>
                    <td>boolean</td>
                    <td>true</td>
                    <td>선택값 초기화 가능 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">isSearchable</code>
                    </td>
                    <td>boolean</td>
                    <td>true</td>
                    <td>검색 가능 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">noOptionsMessage</code>
                    </td>
                    <td>string</td>
                    <td>검색 결과가 없습니다</td>
                    <td>검색 결과 없음 메시지</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">label</code>
                    </td>
                    <td>string</td>
                    <td>-</td>
                    <td>라벨 텍스트</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">required</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>필수 입력 여부 (라벨에 * 표시)</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">fullWidth</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>전체 너비 사용 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">className</code>
                    </td>
                    <td>string</td>
                    <td>-</td>
                    <td>추가 클래스명</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SelectOption 타입 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>SelectOption 타입</h2>
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
                    <td>
                      <code className="bg-gray-100 px-1 rounded">value</code>
                    </td>
                    <td>string</td>
                    <td>옵션의 고유 값</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">label</code>
                    </td>
                    <td>string</td>
                    <td>화면에 표시되는 텍스트</td>
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
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

const options: SelectOption[] = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3' },
]

export default function MyForm() {
  // 단일 선택
  const [selected, setSelected] = useState<SelectOption | null>(null)

  // 다중 선택
  const [multiSelected, setMultiSelected] = useState<SelectOption[]>([])

  return (
    <>
      {/* 단일 선택 */}
      <SearchSelect
        options={options}
        value={selected}
        onChange={setSelected}
        placeholder="옵션을 선택하세요"
        label="옵션"
        required
      />

      {/* 다중 선택 */}
      <SearchSelect
        options={options}
        value={multiSelected}
        onChange={setMultiSelected}
        placeholder="복수 선택 가능"
        isMulti
      />
    </>
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
