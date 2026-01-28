'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useEmployeeInfoList } from '@/hooks/queries';
import type { DayType, StoreScheduleQuery } from '@/types/work-schedule';

type WorkScheduleSearchProps = {
  resultCount: number;
  isLoading: boolean;
  initialQuery?: {
    officeId?: number | null;
    franchiseId?: number | null;
    storeId?: number | null;
    employeeName?: string;
    dayType?: DayType | '';
    from?: string;
    to?: string;
  };
  onSearch: (query: StoreScheduleQuery) => void;
  onReset: () => void;
};

const buildDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultRange = () => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  return {
    from: buildDateInput(from),
    to: buildDateInput(today),
  };
};

const DAY_OPTIONS: { label: string; value: DayType | '' }[] = [
  { label: '전체', value: '' },
  { label: '월요일', value: 'MONDAY' },
  { label: '화요일', value: 'TUESDAY' },
  { label: '수요일', value: 'WEDNESDAY' },
  { label: '목요일', value: 'THURSDAY' },
  { label: '금요일', value: 'FRIDAY' },
  { label: '토요일', value: 'SATURDAY' },
  { label: '일요일', value: 'SUNDAY' },
];

export default function WorkScheduleSearch({
  resultCount,
  isLoading,
  initialQuery,
  onSearch,
  onReset,
}: WorkScheduleSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true);
  const [showOfficeError, setShowOfficeError] = useState(false);
  const [showPeriodError, setShowPeriodError] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const autoSearchKey = useMemo(() => {
    if (!initialQuery?.officeId || !initialQuery.from || !initialQuery.to) return '';
    return [
      initialQuery.officeId,
      initialQuery.franchiseId ?? '',
      initialQuery.storeId ?? '',
      initialQuery.employeeName ?? '',
      initialQuery.dayType ?? '',
      initialQuery.from,
      initialQuery.to,
    ].join('|');
  }, [
    initialQuery?.dayType,
    initialQuery?.employeeName,
    initialQuery?.franchiseId,
    initialQuery?.officeId,
    initialQuery?.storeId,
    initialQuery?.from,
    initialQuery?.to,
  ]);
  const autoSearchRef = useRef<string>('');
  const initialForm = useMemo(
    () => ({
      officeId: initialQuery?.officeId ?? null,
      franchiseId: initialQuery?.franchiseId ?? null,
      storeId: initialQuery?.storeId ?? null,
      employeeName: initialQuery?.employeeName ?? '',
      dayType: initialQuery?.dayType ?? '',
      from: initialQuery?.from ?? defaultRange.from,
      to: initialQuery?.to ?? defaultRange.to,
    }),
    [
      defaultRange.from,
      defaultRange.to,
      initialQuery?.dayType,
      initialQuery?.employeeName,
      initialQuery?.franchiseId,
      initialQuery?.officeId,
      initialQuery?.storeId,
      initialQuery?.from,
      initialQuery?.to,
    ]
  );
  const [form, setForm] = useState(initialForm);

  const {
    data: employeePage,
    isPending: isEmployeeLoading,
    error: employeeError,
  } = useEmployeeInfoList(
    {
      officeId: form.officeId ?? undefined,
      franchiseId: form.franchiseId ?? undefined,
      storeId: form.storeId ?? undefined,
      workStatus: 'EMPWK_001',
      page: 0,
      size: 100,
    },
    true
  );
  const employeeOptions = useMemo(
    () =>
      (employeePage?.content ?? []).map((employee) => ({
        label: employee.employeeName,
        value: employee.employeeName,
      })),
    [employeePage?.content]
  );
  const employeePlaceholder = employeeError
    ? '전체'
    : isEmployeeLoading
      ? '직원 정보를 조회중입니다.'
      : '전체';

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    if (!autoSearchKey || autoSearchRef.current === autoSearchKey) return;
    autoSearchRef.current = autoSearchKey;
    if (!initialQuery?.officeId || !initialQuery.from || !initialQuery.to) return;
    const query: StoreScheduleQuery = {
      officeId: initialQuery.officeId,
      from: initialQuery.from,
      to: initialQuery.to,
      ...(initialQuery.franchiseId ? { franchiseId: initialQuery.franchiseId } : {}),
      ...(initialQuery.storeId ? { storeId: initialQuery.storeId } : {}),
      ...(initialQuery.employeeName ? { employeeName: initialQuery.employeeName } : {}),
      ...(initialQuery.dayType ? { dayType: initialQuery.dayType as DayType } : {}),
    };
    onSearch(query);
  }, [autoSearchKey, initialQuery, onSearch]);

  const handleSearch = () => {
    const hasOfficeError = !form.officeId;
    const hasPeriodError = !form.from || !form.to;
    const hasDateError = Boolean(form.from && form.to && form.to < form.from);
    setShowOfficeError(hasOfficeError);
    setShowPeriodError(hasPeriodError);
    setShowDateError(hasDateError);
    if (hasOfficeError || hasPeriodError || hasDateError) {
      return;
    }
    const officeId = form.officeId;
    if (!officeId) return;
    const query: StoreScheduleQuery = {
      officeId,
      from: form.from,
      to: form.to,
    };
    if (form.franchiseId) {
      query.franchiseId = form.franchiseId;
    }
    if (form.storeId) {
      query.storeId = form.storeId;
    }
    if (form.employeeName.trim()) {
      query.employeeName = form.employeeName.trim();
    }
    if (form.dayType) {
      query.dayType = form.dayType as DayType;
    }
    onSearch(query);
  };

  const handleReset = () => {
    setForm(initialForm);
    setShowOfficeError(false);
    setShowPeriodError(false);
    setShowDateError(false);
    onReset();
  };

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="searh-result-wrap">
        <div className="search-result">
          조회 결과
          <span>{isLoading ? '조회 중' : `${resultCount}건`}</span>
        </div>
        <ul className="search-result-list">
          <li />
        </ul>
        <button
          className="search-filed-btn"
          onClick={() => setSearchOpen((prev) => !prev)}
        />
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <HeadOfficeFranchiseStoreSelect
                  isHeadOfficeRequired={true}
                  showHeadOfficeError={showOfficeError}
                  officeId={form.officeId ?? null}
                  franchiseId={form.franchiseId ?? null}
                  storeId={form.storeId ?? null}
                  onChange={(next) => {
                    if (next.head_office) {
                      setShowOfficeError(false);
                    }
                    setForm((prev) => ({
                      ...prev,
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    }));
                  }}
                />
              </tr>
              <tr>
                <th>직원명</th>
                <td>
                  <div className="data-filed">
                    <SearchableSelect
                      value={form.employeeName ? form.employeeName : null}
                      options={employeeOptions}
                      placeholder={employeePlaceholder}
                      allLabel="전체"
                      disabled={!form.officeId}
                      onChange={(nextValue) =>
                        setForm((prev) => ({
                          ...prev,
                          employeeName: nextValue ?? '',
                        }))
                      }
                    />
                  </div>
                </td>
                <th>요일</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={form.dayType}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          dayType: event.target.value as DayType | '',
                        }))
                      }
                    >
                      {DAY_OPTIONS.map((option) => (
                        <option key={option.value || 'all'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <th>기간 *</th>
                <td>
                  <div className="date-picker-wrap">
                    <input
                      type="date"
                      className="input-frame"
                      value={form.from}
                      onChange={(event) => {
                        setShowPeriodError(false);
                        setShowDateError(false);
                        setForm((prev) => ({ ...prev, from: event.target.value }));
                      }}
                    />
                    <span>~</span>
                    <input
                      type="date"
                      className="input-frame"
                      value={form.to}
                      onChange={(event) => {
                        setShowPeriodError(false);
                        setShowDateError(false);
                        setForm((prev) => ({ ...prev, to: event.target.value }));
                      }}
                    />
                  </div>
                  {showPeriodError && (
                    <span className="form-helper error">기간을 선택해주세요.</span>
                  )}
                  {!showPeriodError && showDateError && (
                    <span className="form-helper error">
                      종료일은 시작일보다 과거일자로 설정할 수 없습니다.
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray" onClick={() => setSearchOpen(false)}>
              닫기
            </button>
            <button className="btn-form gray" onClick={handleReset}>
              초기화
            </button>
            <button className="btn-form basic" onClick={handleSearch} disabled={isLoading}>
              검색
            </button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  );
}
