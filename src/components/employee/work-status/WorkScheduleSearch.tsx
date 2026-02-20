'use client';

import '@/components/common/custom-css/FormHelper.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect';
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect';
import RangeDatePicker, { type DateRange } from '@/components/ui/common/RangeDatePicker';
import { useEmployeeInfoList } from '@/hooks/queries';
import type { DayType, StoreScheduleQuery } from '@/types/work-schedule';
import { formatDateYmd } from '@/util/date-util';

type WorkScheduleSearchProps = {
  resultCount: number;
  isLoading: boolean;
  showStoreError?: boolean;
  onStoreErrorChange?: (next: boolean) => void;
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

const getDefaultRange = () => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  return {
    from: formatDateYmd(from, ''),
    to: formatDateYmd(today, ''),
  };
};

const DAY_OPTIONS: SelectOption[] = [
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
  showStoreError = false,
  onStoreErrorChange,
  initialQuery,
  onSearch,
  onReset,
}: WorkScheduleSearchProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showOfficeError, setShowOfficeError] = useState(false);
  const [showPeriodError, setShowPeriodError] = useState(false);
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const defaultForm = useMemo(
    () => ({
      officeId: null as number | null,
      franchiseId: null as number | null,
      storeId: null as number | null,
      employeeName: '',
      dayType: '' as DayType | '',
      from: defaultRange.from,
      to: defaultRange.to,
    }),
    [defaultRange.from, defaultRange.to]
  );
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
  }, [initialQuery]);
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
    [defaultRange.from, defaultRange.to, initialQuery]
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

  // render-time setState: initialForm이 실제로 변경될 때만 form 동기화
  // (마운트 시 실행 방지 — bpTree auto-apply 값을 덮어쓰지 않음)
  const [prevInitialForm, setPrevInitialForm] = useState(initialForm);
  if (initialForm !== prevInitialForm) {
    setPrevInitialForm(initialForm);
    setForm(initialForm);
  }

  // render-time: employeeOptions 변경 시 현재 선택된 employeeName이 유효한지 체크
  const [prevEmployeeOptions, setPrevEmployeeOptions] = useState(employeeOptions);
  if (employeeOptions !== prevEmployeeOptions) {
    setPrevEmployeeOptions(employeeOptions);
    if (form.employeeName) {
      const isValid = employeeOptions.some((opt) => opt.value === form.employeeName);
      if (!isValid) {
        setForm((prev) => ({ ...prev, employeeName: '' }));
      }
    }
  }

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
    const hasStoreError = !form.storeId;
    const hasPeriodError = !form.from || !form.to;
    setShowOfficeError(hasOfficeError);
    onStoreErrorChange?.(hasStoreError);
    setShowPeriodError(hasPeriodError);
    if (hasOfficeError || hasStoreError || hasPeriodError) {
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
    setForm(defaultForm);
    setShowOfficeError(false);
    setShowPeriodError(false);
    onStoreErrorChange?.(false);
    onReset();
  };

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="search-result-wrap">
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
                  isStoreRequired={true}
                  showStoreError={showStoreError}
                  officeId={form.officeId ?? null}
                  franchiseId={form.franchiseId ?? null}
                  storeId={form.storeId ?? null}
                  onChange={(next) => {
                    if (next.head_office) {
                      setShowOfficeError(false);
                    }
                    if (next.store) {
                      onStoreErrorChange?.(false);
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
                    <SearchSelect
                      value={form.employeeName ? employeeOptions.find((opt) => opt.value === form.employeeName) || null : null}
                      options={employeeOptions}
                      placeholder={employeePlaceholder}
                      isDisabled={isEmployeeLoading || Boolean(employeeError)}
                      isSearchable={true}
                      isClearable={true}
                      onChange={(option) =>
                        setForm((prev) => ({
                          ...prev,
                          employeeName: option?.value ?? '',
                        }))
                      }
                    />
                  </div>
                </td>
                <th>요일</th>
                <td>
                  <div className="data-filed">
                    <SearchSelect
                      value={form.dayType ? DAY_OPTIONS.find((opt) => opt.value === form.dayType) || null : null}
                      options={DAY_OPTIONS}
                      placeholder="전체"
                      isSearchable={false}
                      isClearable={true}
                      onChange={(option) =>
                        setForm((prev) => ({
                          ...prev,
                          dayType: (option?.value as DayType | '') ?? '',
                        }))
                      }
                    />
                  </div>
                </td>
                <th>기간 <span className="red">*</span></th>
                <td>
                  <RangeDatePicker
                    startDate={form.from ? new Date(form.from) : null}
                    endDate={form.to ? new Date(form.to) : null}
                    onChange={(range: DateRange) => {
                      setShowPeriodError(false);
                      setForm((prev) => ({
                        ...prev,
                        from: range.startDate ? formatDateYmd(range.startDate) : '',
                        to: range.endDate ? formatDateYmd(range.endDate) : '',
                      }));
                    }}
                    startDatePlaceholder="시작일"
                    endDatePlaceholder="종료일"
                  />
                  {showPeriodError && (
                    <span className="warning-txt">기간을 선택해주세요.</span>
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
