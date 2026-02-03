'use client'

import { useState, useCallback } from 'react'
import DatePicker from '@/components/ui/common/DatePicker'
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'

/**
 * DatePicker & RangeDatePicker 컴포넌트 Storybook 페이지
 * - 단일 날짜 선택 컴포넌트 예제
 * - 날짜 범위 선택 컴포넌트 예제
 */
export default function DatePickerStorybookPage() {
  // DatePicker 예제용 상태
  const [singleDate, setSingleDate] = useState<Date | null>(null)
  const [singleDateWithValue, setSingleDateWithValue] = useState<Date | null>(new Date())

  // RangeDatePicker 예제용 상태
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [dateRangeWithValue, setDateRangeWithValue] = useState<DateRange>({
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31),
  })
  const [dateRangeWithValidation, setDateRangeWithValidation] = useState<DateRange>({
    startDate: null,
    endDate: null,
  })

  // 날짜 범위 변경 핸들러
  const handleRangeChange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  const handleRangeWithValueChange = useCallback((range: DateRange) => {
    setDateRangeWithValue(range)
  }, [])

  const handleRangeWithValidationChange = useCallback((range: DateRange) => {
    // 종료일이 시작일보다 이전이면 에러 처리
    if (range.startDate && range.endDate && range.endDate < range.startDate) {
      alert('종료일은 시작일보다 과거일자로 설정할 수 없습니다.')
      return
    }
    setDateRangeWithValidation(range)
  }, [])

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>DatePicker & RangeDatePicker 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              날짜 선택 공통 컴포넌트 예제입니다. 단일 날짜 선택과 날짜 범위 선택을 지원합니다.
            </p>
          </div>
        </div>

        {/* DatePicker 기본 사용법 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>DatePicker - 단일 날짜 선택</h2>
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
                      <DatePicker
                        value={singleDate}
                        onChange={setSingleDate}
                        placeholder="날짜를 선택하세요"
                      />
                      {singleDate && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 날짜: {singleDate.toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 2. 값이 있는 상태 */}
                  <tr>
                    <th>값이 있는 상태</th>
                    <td>
                      <DatePicker
                        value={singleDateWithValue}
                        onChange={setSingleDateWithValue}
                        placeholder="날짜를 선택하세요"
                      />
                      {singleDateWithValue && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 날짜: {singleDateWithValue.toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. 비활성화 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <DatePicker
                        value={new Date()}
                        onChange={() => { }}
                        placeholder="날짜를 선택하세요"
                      />
                      <div className="mt-2 text-sm text-gray-400">
                        * DatePicker 컴포넌트에 disabled prop이 없어서 스타일로만 표시됩니다.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RangeDatePicker 기본 사용법 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>RangeDatePicker - 날짜 범위 선택</h2>
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
                      <RangeDatePicker
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onChange={handleRangeChange}
                        startDatePlaceholder="시작일"
                        endDatePlaceholder="종료일"
                      />
                      {(dateRange.startDate || dateRange.endDate) && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 범위:{' '}
                          {dateRange.startDate
                            ? dateRange.startDate.toLocaleDateString('ko-KR')
                            : '미선택'}{' '}
                          ~{' '}
                          {dateRange.endDate
                            ? dateRange.endDate.toLocaleDateString('ko-KR')
                            : '미선택'}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 2. 값이 있는 상태 */}
                  <tr>
                    <th>값이 있는 상태</th>
                    <td>
                      <RangeDatePicker
                        startDate={dateRangeWithValue.startDate}
                        endDate={dateRangeWithValue.endDate}
                        onChange={handleRangeWithValueChange}
                        startDatePlaceholder="시작일"
                        endDatePlaceholder="종료일"
                      />
                      {(dateRangeWithValue.startDate || dateRangeWithValue.endDate) && (
                        <div className="mt-2 text-sm text-gray-500">
                          선택된 범위:{' '}
                          {dateRangeWithValue.startDate
                            ? dateRangeWithValue.startDate.toLocaleDateString('ko-KR')
                            : '미선택'}{' '}
                          ~{' '}
                          {dateRangeWithValue.endDate
                            ? dateRangeWithValue.endDate.toLocaleDateString('ko-KR')
                            : '미선택'}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. 날짜 제한 (minDate, maxDate) */}
                  <tr>
                    <th>날짜 제한 (최소/최대 날짜)</th>
                    <td>
                      <RangeDatePicker
                        startDate={dateRangeWithValidation.startDate}
                        endDate={dateRangeWithValidation.endDate}
                        onChange={handleRangeWithValidationChange}
                        startDatePlaceholder="시작일"
                        endDatePlaceholder="종료일"
                        minDate={new Date(2020, 0, 1)}
                        maxDate={new Date()}
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        * 2020년 1월 1일부터 오늘까지 선택 가능
                      </div>
                      {(dateRangeWithValidation.startDate ||
                        dateRangeWithValidation.endDate) && (
                          <div className="mt-2 text-sm text-gray-500">
                            선택된 범위:{' '}
                            {dateRangeWithValidation.startDate
                              ? dateRangeWithValidation.startDate.toLocaleDateString('ko-KR')
                              : '미선택'}{' '}
                            ~{' '}
                            {dateRangeWithValidation.endDate
                              ? dateRangeWithValidation.endDate.toLocaleDateString('ko-KR')
                              : '미선택'}
                          </div>
                        )}
                    </td>
                  </tr>

                  {/* 4. 커스텀 placeholder */}
                  <tr>
                    <th>커스텀 placeholder</th>
                    <td>
                      <RangeDatePicker
                        startDate={null}
                        endDate={null}
                        onChange={() => { }}
                        startDatePlaceholder="검색 시작일"
                        endDatePlaceholder="검색 종료일"
                      />
                    </td>
                  </tr>

                  {/* 5. 비활성화 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <RangeDatePicker
                        startDate={new Date(2024, 0, 1)}
                        endDate={new Date(2024, 11, 31)}
                        onChange={() => { }}
                        disabled
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
            <h2>DatePicker Props 설명</h2>
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
                    <td>
                      <code className="bg-gray-100 px-1 rounded">value</code>
                    </td>
                    <td>Date | null</td>
                    <td>-</td>
                    <td>선택된 날짜</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onChange</code>
                    </td>
                    <td>(date: Date | null) =&gt; void</td>
                    <td>-</td>
                    <td>날짜 변경 핸들러</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">placeholder</code>
                    </td>
                    <td>string</td>
                    <td>-</td>
                    <td>placeholder 텍스트</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RangeDatePicker Props 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>RangeDatePicker Props 설명</h2>
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
                    <td>
                      <code className="bg-gray-100 px-1 rounded">startDate</code>
                    </td>
                    <td>Date | null</td>
                    <td>-</td>
                    <td>시작일</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">endDate</code>
                    </td>
                    <td>Date | null</td>
                    <td>-</td>
                    <td>종료일</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onChange</code>
                    </td>
                    <td>(range: DateRange) =&gt; void</td>
                    <td>-</td>
                    <td>날짜 범위 변경 핸들러</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">startDatePlaceholder</code>
                    </td>
                    <td>string</td>
                    <td>시작일</td>
                    <td>시작일 placeholder</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">endDatePlaceholder</code>
                    </td>
                    <td>string</td>
                    <td>종료일</td>
                    <td>종료일 placeholder</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">disabled</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">minDate</code>
                    </td>
                    <td>Date</td>
                    <td>-</td>
                    <td>최소 선택 가능 날짜</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">maxDate</code>
                    </td>
                    <td>Date</td>
                    <td>-</td>
                    <td>최대 선택 가능 날짜</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">dateFormat</code>
                    </td>
                    <td>string</td>
                    <td>yyyy-MM-dd</td>
                    <td>날짜 형식</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">containerClassName</code>
                    </td>
                    <td>string</td>
                    <td>-</td>
                    <td>컨테이너 추가 클래스</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DateRange 타입 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>DateRange 타입</h2>
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
                      <code className="bg-gray-100 px-1 rounded">startDate</code>
                    </td>
                    <td>Date | null</td>
                    <td>시작일</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">endDate</code>
                    </td>
                    <td>Date | null</td>
                    <td>종료일</td>
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
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker'

export default function MyForm() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  })

  const handleRangeChange = (range: DateRange) => {
    // 종료일이 시작일보다 이전이면 에러 처리
    if (range.startDate && range.endDate && range.endDate < range.startDate) {
      alert('종료일은 시작일보다 과거일자로 설정할 수 없습니다.')
      return
    }
    setDateRange(range)
  }

  return (
    <RangeDatePicker
      startDate={dateRange.startDate}
      endDate={dateRange.endDate}
      onChange={handleRangeChange}
      startDatePlaceholder="시작일"
      endDatePlaceholder="종료일"
      minDate={new Date(2020, 0, 1)}
      maxDate={new Date()}
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
