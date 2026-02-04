'use client'
import React, { useState, useEffect } from 'react'
import { Tooltip } from 'react-tooltip'
import {
  useLaborContractSettings,
  useSaveLaborContractSettings,
} from '@/hooks/queries/use-employee-settings-queries'
import {
  DEFAULT_FULLTIME_SETTINGS,
  DEFAULT_PARTTIME_SETTINGS,
  type FulltimeContractSettings,
  type ParttimeContractSettings,
  type OtherItem,
} from '@/lib/api/laborContractSettings'
import { DEFAULT_HEAD_OFFICE_ID, DEFAULT_FRANCHISE_ID } from '@/lib/constants/organization'

// 탭 타입 정의
type TabType = 'fulltime' | 'parttime'

// 기타 항목 행 컴포넌트
interface OtherItemRowProps {
  item: OtherItem
  index: number
  prefix: string
  onContentChange: (id: number, content: string) => void
  onAddItem: () => void
  onDeleteItem: (id: number) => void
}

function OtherItemRow({
  item,
  index,
  prefix,
  onContentChange,
  onAddItem,
  onDeleteItem,
}: OtherItemRowProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  const handleAddItem = () => {
    setIsTooltipOpen(false)
    onAddItem()
  }

  const handleDeleteItem = () => {
    setIsTooltipOpen(false)
    onDeleteItem(item.id)
  }

  return (
    <tr>
      <th>기타 #{index + 3}</th>
      <td>
        <div className="filed-flx">
          <div className="block" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-frame"
              placeholder="추가 문구"
              value={item.content}
              onChange={(e) => onContentChange(item.id, e.target.value)}
            />
          </div>
          <div className="auto-right">
            <div className="more-btn">
              <span
                className="icon-more"
                id={`${prefix}-other-${item.id}`}
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
              ></span>
              <Tooltip
                className="option-list"
                anchorSelect={`#${prefix}-other-${item.id}`}
                place="left-end"
                offset={0}
                isOpen={isTooltipOpen}
                setIsOpen={setIsTooltipOpen}
                clickable={true}
                opacity={1}
              >
                <button
                  className="option-item"
                  onClick={handleAddItem}
                >
                  기타 추가
                </button>
                <button
                  className="option-item"
                  onClick={handleDeleteItem}
                >
                  기타 삭제
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// 파트타이머 기타 항목 행 컴포넌트
interface ParttimeOtherItemRowProps {
  item: OtherItem
  index: number
  onContentChange: (id: number, content: string) => void
  onAddItem: () => void
  onDeleteItem: (id: number) => void
}

function ParttimeOtherItemRow({
  item,
  index,
  onContentChange,
  onAddItem,
  onDeleteItem,
}: ParttimeOtherItemRowProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  const handleAddItem = () => {
    setIsTooltipOpen(false)
    onAddItem()
  }

  const handleDeleteItem = () => {
    setIsTooltipOpen(false)
    onDeleteItem(item.id)
  }

  return (
    <tr>
      <th>기타 #{index + 1}</th>
      <td>
        <div className="filed-flx">
          <div className="block" style={{ flex: 1 }}>
            <input
              type="text"
              className="input-frame"
              placeholder="추가 문구"
              value={item.content}
              onChange={(e) => onContentChange(item.id, e.target.value)}
            />
          </div>
          <div className="auto-right">
            <div className="more-btn">
              <span
                className="icon-more"
                id={`parttime-other-${item.id}`}
                onClick={() => setIsTooltipOpen(!isTooltipOpen)}
              ></span>
              <Tooltip
                className="option-list"
                anchorSelect={`#parttime-other-${item.id}`}
                place="left-end"
                offset={0}
                isOpen={isTooltipOpen}
                setIsOpen={setIsTooltipOpen}
                clickable={true}
                opacity={1}
              >
                <button
                  className="option-item"
                  onClick={handleAddItem}
                >
                  기타 추가
                </button>
                <button
                  className="option-item"
                  onClick={handleDeleteItem}
                >
                  기타 삭제
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function LaborContractSettings() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('fulltime')

  // 본사/가맹점 선택
  const [selectedHeadOfficeId, setSelectedHeadOfficeId] = useState<number>(DEFAULT_HEAD_OFFICE_ID)
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<number>(DEFAULT_FRANCHISE_ID)

  // TanStack Query - 설정 조회
  const { data: settingsData, isPending: isLoading, refetch } = useLaborContractSettings({
    headOfficeId: selectedHeadOfficeId,
    franchiseId: selectedFranchiseId,
  })

  // TanStack Query - 설정 저장
  const saveMutation = useSaveLaborContractSettings()
  const isSaving = saveMutation.isPending

  // 정직원 계약서 설정 (로컬 상태)
  const [fulltimeSettings, setFulltimeSettings] = useState<FulltimeContractSettings>(DEFAULT_FULLTIME_SETTINGS)

  // 파트타이머 계약서 설정 (로컬 상태)
  const [parttimeSettings, setParttimeSettings] = useState<ParttimeContractSettings>(DEFAULT_PARTTIME_SETTINGS)

  // 서버 데이터가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    if (settingsData?.codeMemoContent) {
      const { fulltime, parttime } = settingsData.codeMemoContent
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 쿼리 데이터 로드 시 상태 동기화
      setFulltimeSettings(fulltime || DEFAULT_FULLTIME_SETTINGS)
      setParttimeSettings(parttime || DEFAULT_PARTTIME_SETTINGS)
    } else {
      setFulltimeSettings(DEFAULT_FULLTIME_SETTINGS)
      setParttimeSettings(DEFAULT_PARTTIME_SETTINGS)
    }
  }, [settingsData])

  // 검색 (refetch)
  const handleSearch = () => {
    refetch()
  }

  // 저장
  const handleSave = async () => {
    // 빈 값인 otherItems 제거
    const filteredFulltimeOtherItems = fulltimeSettings.otherItems
      .filter(item => item.content.trim() !== '')
      .map((item, index) => ({ ...item, sortOrder: index + 1 }))
    const filteredParttimeOtherItems = parttimeSettings.otherItems
      .filter(item => item.content.trim() !== '')
      .map((item, index) => ({ ...item, sortOrder: index + 1 }))

    try {
      await saveMutation.mutateAsync({
        headOfficeId: selectedHeadOfficeId,
        franchiseId: selectedFranchiseId,
        codeMemoContent: {
          fulltime: {
            ...fulltimeSettings,
            otherItems: filteredFulltimeOtherItems
          },
          parttime: {
            ...parttimeSettings,
            otherItems: filteredParttimeOtherItems
          }
        }
      })

      // 로컬 상태도 업데이트
      setFulltimeSettings(prev => ({ ...prev, otherItems: filteredFulltimeOtherItems }))
      setParttimeSettings(prev => ({ ...prev, otherItems: filteredParttimeOtherItems }))

      alert('저장되었습니다.')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    }
  }

  // 정직원 설정 변경
  const handleFulltimeChange = (field: keyof FulltimeContractSettings, value: string) => {
    setFulltimeSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 파트타이머 설정 변경
  const handleParttimeChange = (field: keyof ParttimeContractSettings, value: string) => {
    setParttimeSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 기타 항목 추가 (정직원)
  const handleAddFulltimeOtherItem = () => {
    const items = fulltimeSettings.otherItems
    const newId = Math.max(...items.map(i => i.id), 0) + 1
    setFulltimeSettings(prev => ({
      ...prev,
      otherItems: [
        ...prev.otherItems,
        { id: newId, content: '', sortOrder: items.length + 1 }
      ]
    }))
  }

  // 기타 항목 삭제 (정직원)
  const handleDeleteFulltimeOtherItem = (id: number) => {
    setFulltimeSettings(prev => ({
      ...prev,
      otherItems: prev.otherItems
        .filter(item => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index + 1 }))
    }))
  }

  // 기타 항목 변경 (정직원)
  const handleFulltimeOtherItemChange = (id: number, content: string) => {
    setFulltimeSettings(prev => ({
      ...prev,
      otherItems: prev.otherItems.map(item =>
        item.id === id ? { ...item, content } : item
      )
    }))
  }

  // 기타 항목 추가 (파트타이머)
  const handleAddParttimeOtherItem = () => {
    const items = parttimeSettings.otherItems
    const newId = Math.max(...items.map(i => i.id), 0) + 1
    setParttimeSettings(prev => ({
      ...prev,
      otherItems: [
        ...prev.otherItems,
        { id: newId, content: '', sortOrder: items.length + 1 }
      ]
    }))
  }

  // 기타 항목 삭제 (파트타이머)
  const handleDeleteParttimeOtherItem = (id: number) => {
    setParttimeSettings(prev => ({
      ...prev,
      otherItems: prev.otherItems
        .filter(item => item.id !== id)
        .map((item, index) => ({ ...item, sortOrder: index + 1 }))
    }))
  }

  // 기타 항목 변경 (파트타이머)
  const handleParttimeOtherItemChange = (id: number, content: string) => {
    setParttimeSettings(prev => ({
      ...prev,
      otherItems: prev.otherItems.map(item =>
        item.id === id ? { ...item, content } : item
      )
    }))
  }

  // 정직원 탭 렌더링
  const renderFulltimeTab = () => (
    <div className="preferences-contents">
      {/* 계약서 기준 정보 */}
      <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        계약서 기준 정보
      </h3>

      <table className="default-table" style={{ marginBottom: '24px' }}>
        <colgroup>
          <col width="150px" />
          <col />
        </colgroup>
        <tbody>
          {/* 근로 장소 */}
          <tr>
            <th>근로 장소</th>
            <td>
              <div className="filed-flx">
                <div className="btn-group" style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 24px',
                      border: 'none',
                      backgroundColor: fulltimeSettings.workPlace === 'company' ? '#333' : '#fff',
                      color: fulltimeSettings.workPlace === 'company' ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onClick={() => handleFulltimeChange('workPlace', 'company')}
                  >
                    회사
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 24px',
                      border: 'none',
                      borderLeft: '1px solid #ddd',
                      backgroundColor: fulltimeSettings.workPlace === 'store' ? '#333' : '#fff',
                      color: fulltimeSettings.workPlace === 'store' ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                    onClick={() => handleFulltimeChange('workPlace', 'store')}
                  >
                    점포
                  </button>
                </div>
                <div className="block" style={{ maxWidth: '200px' }}>
                  <select
                    className="select-form"
                    value={fulltimeSettings.workPlaceStore}
                    onChange={(e) => handleFulltimeChange('workPlaceStore', e.target.value)}
                    disabled={fulltimeSettings.workPlace === 'company'}
                  >
                    <option value="">선택</option>
                    <option value="을지로3가점">을지로3가점</option>
                  </select>
                </div>
              </div>
            </td>
          </tr>
          {/* 휴일 */}
          <tr>
            <th>휴일</th>
            <td>
              <div className="filed-flx" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span className="info-text">
                  기본 문구 : 근로계약서의 근무일 이외의 요일 + 근로자의 날은 유급휴일로 한다.
                </span>
                <div className="block" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="input-frame"
                    placeholder="추가 문구"
                    value={fulltimeSettings.holidayAdditional}
                    onChange={(e) => handleFulltimeChange('holidayAdditional', e.target.value)}
                  />
                </div>
              </div>
            </td>
          </tr>
          {/* 연차 휴가 */}
          <tr>
            <th>연차 휴가</th>
            <td>
              <div className="filed-flx" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span className="info-text">
                  기본 문구 : &apos;회사&apos;는 &apos;사원&apos;에게 근로기준법에 따른 연차휴가를 준다.
                </span>
                <div className="block" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="input-frame"
                    placeholder="추가 문구"
                    value={fulltimeSettings.annualLeaveAdditional}
                    onChange={(e) => handleFulltimeChange('annualLeaveAdditional', e.target.value)}
                  />
                </div>
              </div>
            </td>
          </tr>
          {/* 퇴사 시 업무 인수인계 */}
          <tr>
            <th>퇴사 시 업무 인수인계</th>
            <td>
              <div className="filed-flx" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span className="info-text">
                  기본 문구 : &apos;사원&apos;은 근속기간 중 근로계약을 해지하고자 할 때에는 퇴직 예정일 1개월전까지 &apos;회사&apos;에 통보하고 업무인수인계를 모두 마친 후에 퇴사하여야 하며, 사직서가 수리되기 전에 퇴사하는 경우 무단 결근으로 처리한다.
                </span>
                <div className="block" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="input-frame"
                    placeholder="추가 문구"
                    value={fulltimeSettings.resignationAdditional}
                    onChange={(e) => handleFulltimeChange('resignationAdditional', e.target.value)}
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 기타 정보 */}
      <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        기타 정보
      </h3>

      <table className="default-table">
        <colgroup>
          <col width="150px" />
          <col />
        </colgroup>
        <tbody>
          {/* 기본 문구 기타 #1 */}
          <tr>
            <th>기타 #1</th>
            <td>
              <span className="info-text">
                기본 문구 : &apos;사원&apos;은 &apos;회사&apos;가 정한 취업규칙을 성실히 준수할 의무를 부담한다.
              </span>
            </td>
          </tr>
          {/* 기본 문구 기타 #2 */}
          <tr>
            <th>기타 #2</th>
            <td>
              <span className="info-text">
                기본 문구 : 이 계약에 정함이 없는 사항은 근로기준법 등 노동관계법령 및 취업규칙에 의한다.
              </span>
            </td>
          </tr>
          {/* 동적 기타 항목들 */}
          {fulltimeSettings.otherItems.map((item, index) => (
            <OtherItemRow
              key={item.id}
              item={item}
              index={index}
              prefix="fulltime"
              onContentChange={handleFulltimeOtherItemChange}
              onAddItem={handleAddFulltimeOtherItem}
              onDeleteItem={handleDeleteFulltimeOtherItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  )

  // 파트타이머 탭 렌더링
  const renderParttimeTab = () => (
    <div className="preferences-contents">
      {/* 계약 기준 정보 */}
      <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        계약 기준 정보
      </h3>

      <table className="default-table" style={{ marginBottom: '24px' }}>
        <colgroup>
          <col width="150px" />
          <col />
        </colgroup>
        <tbody>
          {/* 연차 휴가 */}
          <tr>
            <th>연차 휴가</th>
            <td>
              <div className="filed-flx" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span className="info-text">
                  기본 문구 : 근로기준법 제 60조의 연차유급휴가는 하계 및 동계휴가, 관공서 휴일에 관한 규정에 따른 공휴일에 갈음하여 사용함
                </span>
                <div className="block" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="input-frame"
                    placeholder="추가 문구"
                    value={parttimeSettings.annualLeaveAdditional}
                    onChange={(e) => handleParttimeChange('annualLeaveAdditional', e.target.value)}
                  />
                </div>
              </div>
            </td>
          </tr>
          {/* 퇴직금 */}
          <tr>
            <th>퇴직금</th>
            <td>
              <div className="filed-flx" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span className="info-text">
                  기본 문구 : 계속근로기간 1년에 대하여 30일분의 퇴직금을 지급함
                </span>
                <div className="block" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="input-frame"
                    placeholder="추가 문구"
                    value={parttimeSettings.severancePayAdditional}
                    onChange={(e) => handleParttimeChange('severancePayAdditional', e.target.value)}
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 기타 정보 */}
      <h3 className="section-title" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        기타 정보
      </h3>

      <table className="default-table">
        <colgroup>
          <col width="150px" />
          <col />
        </colgroup>
        <tbody>
          {parttimeSettings.otherItems.map((item, index) => (
            <ParttimeOtherItemRow
              key={item.id}
              item={item}
              index={index}
              onContentChange={handleParttimeOtherItemChange}
              onAddItem={handleAddParttimeOtherItem}
              onDeleteItem={handleDeleteParttimeOtherItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="contents-wrap">
      {/* 저장 버튼 */}
      <div className="contents-btn">
        <button className="btn-form basic" onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장중...' : '저장'}
        </button>
      </div>

      <div className="contents-body">
        {/* 본사/가맹점 선택 */}
        <div className="content-wrap">
          <table className="default-table">
            <colgroup>
              <col width="160px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>본사/가맹점 선택</th>
                <td>
                  <div className="filed-flx">
                    <div className="block" style={{ maxWidth: '250px' }}>
                      <select
                        className="select-form"
                        value={selectedHeadOfficeId}
                        onChange={(e) => setSelectedHeadOfficeId(Number(e.target.value))}
                      >
                        <option value={1}>따름인</option>
                      </select>
                    </div>
                    <div className="block" style={{ maxWidth: '250px' }}>
                      <select
                        className="select-form"
                        value={selectedFranchiseId}
                        onChange={(e) => setSelectedFranchiseId(Number(e.target.value))}
                      >
                        <option value={2}>을지로3가점</option>
                      </select>
                    </div>
                    <button className="btn-form basic" onClick={handleSearch} disabled={isLoading}>
                      {isLoading ? '조회중...' : '검색'}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 탭 메뉴 */}
        <div className="content-wrap">
          <div className="preferences-tab">
            <button
              className={`preferences-menu ${activeTab === 'fulltime' ? 'act' : ''}`}
              onClick={() => setActiveTab('fulltime')}
            >
              정직원
            </button>
            <button
              className={`preferences-menu ${activeTab === 'parttime' ? 'act' : ''}`}
              onClick={() => setActiveTab('parttime')}
            >
              파트타이머
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : (
            activeTab === 'fulltime' ? renderFulltimeTab() : renderParttimeTab()
          )}
        </div>
      </div>
    </div>
  )
}
