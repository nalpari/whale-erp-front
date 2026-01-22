'use client';

import { useMemo, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import type { DayType, StoreScheduleQuery } from '@/types/work-schedule';

type WorkStatusSearchProps = {
  resultCount: number;
  isLoading: boolean;
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
  { label: '평일', value: 'WEEKDAY' },
];

export default function WorkStatusSearch({
  resultCount,
  isLoading,
  onSearch,
  onReset,
}: WorkStatusSearchProps) {
  const [searchOpen, setSearchOpen] = useState(true);
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [form, setForm] = useState({
    officeId: '',
    franchiseId: '',
    storeId: '',
    employeeName: '',
    dayType: '',
    from: defaultRange.from,
    to: defaultRange.to,
  });

  const handleSearch = () => {
    const officeIdValue = Number(form.officeId);
    if (!officeIdValue) {
      alert('본사 ID를 입력해주세요.');
      return;
    }
    if (!form.from || !form.to) {
      alert('기간을 선택해주세요.');
      return;
    }
    const query: StoreScheduleQuery = {
      officeId: officeIdValue,
      from: form.from,
      to: form.to,
    };
    if (form.franchiseId) {
      query.franchiseId = Number(form.franchiseId);
    }
    if (form.storeId) {
      query.storeId = Number(form.storeId);
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
    setForm({
      officeId: '',
      franchiseId: '',
      storeId: '',
      employeeName: '',
      dayType: '',
      from: defaultRange.from,
      to: defaultRange.to,
    });
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
                <th>본사 ID</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="number"
                      className="input-frame"
                      value={form.officeId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, officeId: event.target.value }))
                      }
                      placeholder="필수"
                    />
                  </div>
                </td>
                <th>가맹점 ID</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="number"
                      className="input-frame"
                      value={form.franchiseId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, franchiseId: event.target.value }))
                      }
                      placeholder="선택"
                    />
                  </div>
                </td>
                <th>점포 ID</th>
                <td>
                  <div className="data-filed">
                    <input
                      type="number"
                      className="input-frame"
                      value={form.storeId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, storeId: event.target.value }))
                      }
                      placeholder="선택"
                    />
                  </div>
                </td>
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
                <th>기간 선택</th>
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
