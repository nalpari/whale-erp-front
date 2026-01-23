'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import HeadOfficeFranchiseStoreSelect from '@/components/ui/common/HeadOfficeFranchiseStoreSelect';
import type { DayType, StoreScheduleQuery } from '@/types/work-schedule';

type WorkScheduleSearchProps = {
  resultCount: number;
  isLoading: boolean;
  initialQuery?: Partial<StoreScheduleQuery> & {
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
    if (!form.officeId) {
      alert('본사를 선택해주세요.');
      return;
    }
    if (!form.from || !form.to) {
      alert('기간을 선택해주세요.');
      return;
    }
    const query: StoreScheduleQuery = {
      officeId: form.officeId,
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
    onReset();
  };

  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="searh-result-wrap">
        <div className="search-result">
          검색결과
          <span>{isLoading ? '조회중' : `${resultCount}건`}</span>
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
                  officeId={form.officeId}
                  franchiseId={form.franchiseId}
                  storeId={form.storeId}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      officeId: next.head_office,
                      franchiseId: next.franchise,
                      storeId: next.store,
                    }))
                  }
                />
              </tr>
              <tr>
                <th>직원명</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="text"
                      className="input-frame"
                      value={form.employeeName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, employeeName: event.target.value }))
                      }
                      placeholder="직원명/임시근무자"
                    />
                  </div>
                </td>
                <th>요일 선택</th>
                <td>
                  <div className="data-filed">
                    <select
                      className="select-form"
                      value={form.dayType}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, dayType: event.target.value }))
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
                <th>기간 선택 *</th>
                <td>
                  <div className="date-picker-wrap">
                    <input
                      type="date"
                      className="input-frame"
                      value={form.from}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, from: event.target.value }))
                      }
                    />
                    <span>~</span>
                    <input
                      type="date"
                      className="input-frame"
                      value={form.to}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, to: event.target.value }))
                      }
                    />
                  </div>
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
