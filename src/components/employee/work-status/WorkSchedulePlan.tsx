'use client';

import '@/components/employee/custom-css/WorkScheduleTable.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorkScheduleSearch from './WorkScheduleSearch';
import type { DayType, ScheduleResponse, StoreScheduleQuery } from '@/types/work-schedule';
import {
  fetchStoreSchedules,
  storeScheduleKeys,
  useStoreScheduleUpsert,
} from '@/hooks/queries';
import { useStoreScheduleViewStore } from '@/stores/store-schedule-store';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from 'react-tooltip';
import EmployeeSearch from '../popup/EmployeeSearch';
import { buildStoreScheduleParams, toQueryString } from '@/util/store-schedule';

type WorkerPlan = {
  id: string;
  name: string;
  contractType: string;
  workerId?: number | null;
  shiftId?: number | null;
  tempWorkerName?: string | null;
  hasWork: boolean;
  hasBreak: boolean;
  startIndex: number;
  endIndex: number;
  breakStartIndex: number;
  breakEndIndex: number;
};

type DayPlan = {
  date: string;
  dayLabel: string;
  workers: WorkerPlan[];
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BLOCKS = Array.from({ length: 48 }, (_, i) => ({
  index: i,
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}));

const CONTRACT_COLOR_MAP: Record<string, 'blue' | 'green'> = {
  정직원: 'blue',
  계약직: 'blue',
  수습: 'blue',
  파트타이머: 'green',
  임시근무: 'green',
};
const CONTRACT_ORDER: Record<string, number> = {
  정직원: 1,
  계약직: 2,
  수습: 3,
  파트타이머: 4,
  임시근무: 5,
};

const indexToTime = (index: number) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const indexToTimeWithSeconds = (index: number) => `${indexToTime(index)}:00`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseTimeToIndex = (value?: string | null) => {
  if (!value) return null;
  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  const minuteIndex = minute >= 30 ? 1 : 0;
  return clamp(hour * 2 + minuteIndex, 0, 48);
};

const sortWorkersByRule = (workers: ScheduleResponse['workerList']) =>
  [...workers].sort((a, b) => {
    const startA = parseTimeToIndex(a.workStartTime) ?? 0;
    const startB = parseTimeToIndex(b.workStartTime) ?? 0;
    if (startA !== startB) return startA - startB;
    const orderA = CONTRACT_ORDER[a.contractType ?? ''] ?? 99;
    const orderB = CONTRACT_ORDER[b.contractType ?? ''] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.workerName ?? '').localeCompare(b.workerName ?? '');
  });

const buildPlansFromSchedules = (schedules: ScheduleResponse[]): DayPlan[] =>
  schedules.map((schedule) => {
    const dayLabel = schedule.day ?? '';
    const workers: WorkerPlan[] = sortWorkersByRule(schedule.workerList).map((worker, index) => {
      const startIndex = parseTimeToIndex(worker.workStartTime) ?? 0;
      const endIndex = parseTimeToIndex(worker.workEndTime) ?? startIndex;
      const safeEndIndex = endIndex <= startIndex ? clamp(startIndex + 1, 1, 48) : endIndex;
      const breakStartIndex = parseTimeToIndex(worker.breakStartTime) ?? 0;
      const breakEndIndex = parseTimeToIndex(worker.breakEndTime) ?? breakStartIndex;
      const safeBreakStart = clamp(breakStartIndex, startIndex, safeEndIndex - 1);
      const safeBreakEnd = clamp(breakEndIndex, safeBreakStart + 1, safeEndIndex);
      const id = worker.shiftId ?? worker.workerId ?? `worker-${schedule.date}-${index}`;
      const isTempWorker = !worker.workerId;
      return {
        id: String(id),
        name: worker.workerName ?? '직원',
        contractType: worker.contractType ?? '정직원',
        workerId: worker.workerId ?? null,
        shiftId: worker.shiftId ?? null,
        tempWorkerName: isTempWorker ? worker.workerName ?? null : null,
        hasWork: worker.hasWork,
        hasBreak: worker.hasBreak,
        startIndex,
        endIndex: safeEndIndex,
        breakStartIndex: safeBreakStart,
        breakEndIndex: safeBreakEnd,
      };
    });
    return {
      date: schedule.date,
      dayLabel,
      workers,
    };
  });

const buildWorkBlockStates = (worker: WorkerPlan) =>
  BLOCKS.map((block) => {
    const isWorking = block.index >= worker.startIndex && block.index < worker.endIndex;
    return { state: isWorking ? ('work' as const) : ('empty' as const) };
  });

const buildBreakBlockStates = (worker: WorkerPlan) =>
  BLOCKS.map((block) => {
    const isBreak =
      worker.hasBreak &&
      block.index >= worker.breakStartIndex &&
      block.index < worker.breakEndIndex;
    return { state: isBreak ? ('break' as const) : ('empty' as const) };
  });

const DEFAULT_WORK_RANGE = { startIndex: 18, endIndex: 36 };
const DEFAULT_BREAK_RANGE = { startIndex: 24, endIndex: 26 };

const buildDefaultTimeRange = (workers: WorkerPlan[]) => {
  if (workers.length === 0) return DEFAULT_WORK_RANGE;
  const lastWorker = workers[workers.length - 1];
  return {
    startIndex: lastWorker.startIndex,
    endIndex: lastWorker.endIndex,
  };
};

const createWorkerPlan = ({
  id,
  name,
  contractType,
  workerId,
  tempWorkerName,
  baseRange,
}: {
  id: string;
  name: string;
  contractType: string;
  workerId?: number | null;
  tempWorkerName?: string | null;
  baseRange: { startIndex: number; endIndex: number };
}): WorkerPlan => ({
  id,
  name,
  contractType,
  workerId: workerId ?? null,
  shiftId: null,
  tempWorkerName: tempWorkerName ?? null,
  hasWork: true,
  hasBreak: false,
  startIndex: baseRange.startIndex,
  endIndex: baseRange.endIndex,
  breakStartIndex: DEFAULT_BREAK_RANGE.startIndex,
  breakEndIndex: DEFAULT_BREAK_RANGE.endIndex,
});

const buildWorkerRequest = (worker: WorkerPlan, isDeleted = false) => {
  const hasWorkerId = worker.workerId !== null && worker.workerId !== undefined;
  return ({
  shiftId: worker.shiftId ?? null,
  workerId: worker.workerId ?? null,
  tempWorkerName: hasWorkerId ? null : worker.tempWorkerName ?? worker.name ?? null,
  hasWork: isDeleted ? false : worker.hasWork,
  workStartTime: !isDeleted && worker.hasWork ? indexToTimeWithSeconds(worker.startIndex) : null,
  workEndTime: !isDeleted && worker.hasWork ? indexToTimeWithSeconds(worker.endIndex) : null,
  hasBreak: !isDeleted && worker.hasWork ? worker.hasBreak : false,
  breakStartTime:
    !isDeleted && worker.hasWork && worker.hasBreak
      ? indexToTimeWithSeconds(worker.breakStartIndex)
      : null,
  breakEndTime:
    !isDeleted && worker.hasWork && worker.hasBreak
      ? indexToTimeWithSeconds(worker.breakEndIndex)
      : null,
  isDeleted,
});
};

const validatePlans = (plans: DayPlan[]) => {
  for (const day of plans) {
    const workRangesByKey = new Map<string, Array<{ start: number; end: number }>>();
    for (const worker of day.workers) {
      const label = `${day.date} ${worker.name || '근무자'}`;
      if (!worker.workerId && !worker.tempWorkerName && !worker.name) {
        return `${label} : 근무자 정보가 없습니다.`;
      }
      if (worker.hasWork && worker.endIndex <= worker.startIndex) {
        return `${label} : 근무 시작/종료 시간을 확인해주세요.`;
      }
      if (worker.hasBreak) {
        if (!worker.hasWork) {
          return `${label} : 휴게 시간은 근무 시간 설정 후 가능합니다.`;
        }
        if (worker.breakEndIndex <= worker.breakStartIndex) {
          return `${label} : 휴게 시작/종료 시간을 확인해주세요.`;
        }
        if (worker.breakStartIndex < worker.startIndex || worker.breakEndIndex > worker.endIndex) {
          return `${label} : 휴게 시간이 근무 시간 범위를 벗어났습니다.`;
        }
      }
      if (worker.hasWork) {
        const key = worker.workerId
          ? `worker-${worker.workerId}`
          : worker.tempWorkerName
            ? `temp-${worker.tempWorkerName}`
            : `name-${worker.name}`;
        const ranges = workRangesByKey.get(key) ?? [];
        const current = { start: worker.startIndex, end: worker.endIndex };
        const hasOverlap = ranges.some((range) => current.start < range.end && current.end > range.start);
        if (hasOverlap) {
          return `${label} : 동일한 날짜에 중복된 근무 시간이 있습니다.`;
        }
        ranges.push(current);
        workRangesByKey.set(key, ranges);
      }
    }
  }
  return null;
};

const buildWorkerSnapshot = (worker: WorkerPlan) => ({
  workerId: worker.workerId ?? null,
  tempWorkerName: worker.tempWorkerName ?? null,
  hasWork: worker.hasWork,
  hasBreak: worker.hasBreak,
  startIndex: worker.startIndex,
  endIndex: worker.endIndex,
  breakStartIndex: worker.breakStartIndex,
  breakEndIndex: worker.breakEndIndex,
});


export default function WorkSchedulePlan() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const lastQuery = useStoreScheduleViewStore((state) => state.lastQuery);
  const setLastQuery = useStoreScheduleViewStore((state) => state.setLastQuery);
  const upsertMutation = useStoreScheduleUpsert();
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<Record<string, WorkerPlan[]>>({});
  const [employeeModal, setEmployeeModal] = useState<{
    mode: 'add' | 'replace';
    dayIndex: number;
    workerId?: string;
  } | null>(null);
  const [tempWorkerModal, setTempWorkerModal] = useState<{
    dayIndex: number;
    afterWorkerId?: string;
  } | null>(null);
  const [tempWorkerName, setTempWorkerName] = useState('');
  const initialWorkersRef = useRef<Map<string, Map<string, ReturnType<typeof buildWorkerSnapshot>>>>(
    new Map()
  );
  const dirtyWorkersRef = useRef<Set<string>>(new Set());
  const isLoading = isFetching || upsertMutation.isPending;
  
  const dragRef = useRef<{
    dayIndex: number;
    workerId: string;
    type: 'work-start' | 'work-end' | 'break-start' | 'break-end';
    slider: HTMLDivElement;
  } | null>(null);
  const initialQuery = useMemo(() => {
    const getNumberParam = (key: string) => {
      const value = searchParams.get(key);
      if (!value) return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const officeId = getNumberParam('officeId') ?? undefined;
    const franchiseId = getNumberParam('franchiseId') ?? undefined;
    const storeId = getNumberParam('storeId') ?? undefined;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const employeeName = searchParams.get('employeeName') ?? undefined;
    const dayType = (searchParams.get('dayType') as DayType | null) ?? undefined;
    return {
      officeId,
      franchiseId,
      storeId,
      from,
      to,
      employeeName,
      dayType,
    };
  }, [searchParams]);

  const handleSearch = useCallback(
    async (query: StoreScheduleQuery) => {
      setIsFetching(true);
      try {
        const data = await queryClient.fetchQuery({
          queryKey: storeScheduleKeys.list(query),
          queryFn: () => fetchStoreSchedules(query),
        });
        const nextPlans = buildPlansFromSchedules(data ?? []);
        setPlans(nextPlans);
        setPendingDeletes({});
        dirtyWorkersRef.current = new Set();
        const nextInitial = new Map<string, Map<string, ReturnType<typeof buildWorkerSnapshot>>>();
        nextPlans.forEach((day) => {
          const dayMap = new Map<string, ReturnType<typeof buildWorkerSnapshot>>();
          day.workers.forEach((worker) => {
            if (worker.shiftId) {
              dayMap.set(`shift-${worker.shiftId}`, buildWorkerSnapshot(worker));
            }
          });
          nextInitial.set(day.date, dayMap);
        });
        initialWorkersRef.current = nextInitial;
        setLastQuery(query);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '근무 계획 조회에 실패했습니다.';
        alert(message);
      } finally {
        setIsFetching(false);
      }
    },
    [queryClient, setLastQuery]
  );

  const handleReset = useCallback(() => {
    setPlans([]);
    setPendingDeletes({});
    initialWorkersRef.current = new Map();
    dirtyWorkersRef.current = new Set();
    setLastQuery(null);
  }, [setLastQuery]);

  const handleBreakToggle = (dayIndex: number, workerId: string, enabled: boolean) => {
    setPlans((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;
        return {
          ...day,
          workers: day.workers.map((worker) => {
            if (worker.id !== workerId) return worker;
            dirtyWorkersRef.current.add(`${day.date}|${worker.id}`);
            if (!enabled) {
              return { ...worker, hasBreak: false };
            }
            if (!worker.hasWork) {
              return { ...worker, hasBreak: false };
            }
            const defaultBreakStart = clamp(worker.startIndex + 6, worker.startIndex, worker.endIndex - 1);
            const defaultBreakEnd = clamp(defaultBreakStart + 2, defaultBreakStart + 1, worker.endIndex);
            const isValidBreak =
              worker.breakEndIndex > worker.breakStartIndex &&
              worker.breakStartIndex >= worker.startIndex &&
              worker.breakEndIndex <= worker.endIndex;
            return {
              ...worker,
              hasBreak: true,
              breakStartIndex: isValidBreak ? worker.breakStartIndex : defaultBreakStart,
              breakEndIndex: isValidBreak ? worker.breakEndIndex : defaultBreakEnd,
            };
          }),
        };
      })
    );
  };

  const openAddEmployee = (dayIndex: number, afterWorkerId?: string) => {
    setEmployeeModal({ mode: 'add', dayIndex, workerId: afterWorkerId });
  };

  const openReplaceEmployee = (dayIndex: number, workerId: string) => {
    setEmployeeModal({ mode: 'replace', dayIndex, workerId });
  };

  const openTempWorker = (dayIndex: number, afterWorkerId?: string) => {
    setTempWorkerName('');
    setTempWorkerModal({ dayIndex, afterWorkerId });
  };

  const handleApplyEmployee = (employee: { workerId: number; workerName: string; contractType: string }) => {
    if (!employeeModal) return;
    setPlans((prev) =>
      prev.map((day, index) => {
        if (index !== employeeModal.dayIndex) return day;
        if (employeeModal.mode === 'add') {
          const baseRange = buildDefaultTimeRange(day.workers);
          const nextWorker = createWorkerPlan({
            id: `worker-${employee.workerId}-${Date.now()}`,
            name: employee.workerName,
            contractType: employee.contractType ?? '정직원',
            workerId: employee.workerId,
            baseRange,
          });
          dirtyWorkersRef.current.add(`${day.date}|${nextWorker.id}`);
          if (!employeeModal.workerId) {
            return { ...day, workers: [...day.workers, nextWorker] };
          }
          const targetIndex = day.workers.findIndex((worker) => worker.id === employeeModal.workerId);
          if (targetIndex < 0) {
            return { ...day, workers: [...day.workers, nextWorker] };
          }
          const nextWorkers = [...day.workers];
          nextWorkers.splice(targetIndex + 1, 0, nextWorker);
          return { ...day, workers: nextWorkers };
        }
        if (employeeModal.workerId) {
          dirtyWorkersRef.current.add(`${day.date}|${employeeModal.workerId}`);
        }
        return {
          ...day,
          workers: day.workers.map((worker) =>
            worker.id !== employeeModal.workerId
              ? worker
              : {
                  ...worker,
                  name: employee.workerName,
                  contractType: employee.contractType ?? worker.contractType,
                  workerId: employee.workerId,
                  tempWorkerName: null,
                }
          ),
        };
      })
    );
    setEmployeeModal(null);
  };

  const handleApplyTempWorker = () => {
    if (!tempWorkerModal) return;
    const trimmed = tempWorkerName.trim();
    if (!trimmed) {
      alert('임시 근무자 이름을 입력해주세요.');
      return;
    }
    setPlans((prev) =>
      prev.map((day, index) => {
        if (index !== tempWorkerModal.dayIndex) return day;
        const baseRange = buildDefaultTimeRange(day.workers);
        const nextWorker = createWorkerPlan({
          id: `temp-${Date.now()}`,
          name: trimmed,
          contractType: '임시근무',
          tempWorkerName: trimmed,
          baseRange,
        });
        dirtyWorkersRef.current.add(`${day.date}|${nextWorker.id}`);
        if (!tempWorkerModal.afterWorkerId) {
          return { ...day, workers: [...day.workers, nextWorker] };
        }
        const targetIndex = day.workers.findIndex((worker) => worker.id === tempWorkerModal.afterWorkerId);
        if (targetIndex < 0) {
          return { ...day, workers: [...day.workers, nextWorker] };
        }
        const nextWorkers = [...day.workers];
        nextWorkers.splice(targetIndex + 1, 0, nextWorker);
        return { ...day, workers: nextWorkers };
      })
    );
    setTempWorkerModal(null);
  };

  const handleDeleteWorker = (dayIndex: number, workerId: string) => {
    if (!confirm('선택한 근무자를 삭제하시겠습니까?')) return;
    setPlans((prev) => {
      const targetDay = prev[dayIndex];
      if (!targetDay) return prev;
      const targetWorker = targetDay.workers.find((worker) => worker.id === workerId);
      if (!targetWorker) return prev;
      if (targetWorker.shiftId || targetWorker.workerId || targetWorker.tempWorkerName) {
        setPendingDeletes((prevDeletes) => {
          const nextList = [...(prevDeletes[targetDay.date] ?? []), targetWorker];
          return { ...prevDeletes, [targetDay.date]: nextList };
        });
      }
      return prev.map((day, index) =>
        index !== dayIndex
          ? day
          : { ...day, workers: day.workers.filter((worker) => worker.id !== workerId) }
      );
    });
  };

  const handleSave = useCallback(async () => {
    if (isLoading) return;
    if (!lastQuery?.storeId) {
      alert('점포를 선택해주세요.');
      return;
    }
    const validationError = validatePlans(plans);
    if (validationError) {
      alert(validationError);
      return;
    }
    const payload = plans
      .map((day) => {
        const changedWorkers = day.workers.filter((worker) =>
          dirtyWorkersRef.current.has(`${day.date}|${worker.id}`)
        );
        const deletedWorkers = pendingDeletes[day.date] ?? [];
        const workerRequests = [
          ...changedWorkers.map((worker) => buildWorkerRequest(worker)),
          ...deletedWorkers.map((worker) => buildWorkerRequest(worker, true)),
        ];
        return workerRequests.length > 0 ? { date: day.date, workerRequests } : null;
      })
      .filter((item): item is { date: string; workerRequests: ReturnType<typeof buildWorkerRequest>[] } => Boolean(item));

    if (payload.length === 0) {
      alert('변경된 데이터가 없습니다.');
      return;
    }
    try {
      await upsertMutation.mutateAsync({ storeId: lastQuery.storeId, payload });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '근무 계획 저장에 실패했습니다.';
      alert(message);
      return;
    }
    const source: StoreScheduleQuery | (Partial<StoreScheduleQuery> & { from?: string; to?: string }) | null =
      lastQuery ?? initialQuery ?? null;
    const params = buildStoreScheduleParams(source);
    router.push(`/employee/schedule/view${toQueryString(params)}`);
  }, [initialQuery, isLoading, lastQuery, pendingDeletes, plans, router, upsertMutation]);

  const renderedPlans = useMemo(() => plans, [plans]);
  const resultCount = useMemo(
    () => plans.reduce((sum, day) => sum + day.workers.length, 0),
    [plans]
  );

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!dragRef.current) return;
      const { dayIndex, workerId, type, slider } = dragRef.current;
      const rect = slider.getBoundingClientRect();
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const nextIndex = Math.round(ratio * 48);

      setPlans((prev) =>
        prev.map((day, index) => {
          if (index !== dayIndex) return day;
          return {
            ...day,
            workers: day.workers.map((worker) => {
              if (worker.id !== workerId) return worker;
              if (!worker.hasWork) return worker;

              if (type === 'work-start') {
                const startIndex = clamp(nextIndex, 0, worker.endIndex - 1);
                if (startIndex !== worker.startIndex) {
                  dirtyWorkersRef.current.add(`${day.date}|${worker.id}`);
                }
                return { ...worker, startIndex };
              }
              if (type === 'work-end') {
                const endIndex = clamp(nextIndex, worker.startIndex + 1, 48);
                if (endIndex !== worker.endIndex) {
                  dirtyWorkersRef.current.add(`${day.date}|${worker.id}`);
                }
                return { ...worker, endIndex };
              }
              if (type === 'break-start') {
                const breakStartIndex = clamp(nextIndex, worker.startIndex, worker.breakEndIndex - 1);
                if (breakStartIndex !== worker.breakStartIndex) {
                  dirtyWorkersRef.current.add(`${day.date}|${worker.id}`);
                }
                return { ...worker, breakStartIndex };
              }
              if (type === 'break-end') {
                const breakEndIndex = clamp(nextIndex, worker.breakStartIndex + 1, worker.endIndex);
                if (breakEndIndex !== worker.breakEndIndex) {
                  dirtyWorkersRef.current.add(`${day.date}|${worker.id}`);
                }
                return { ...worker, breakEndIndex };
              }
              return worker;
            }),
          };
        })
      );
    };

    const handleUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return (
    <>
    {employeeModal ? (
      <EmployeeSearch onClose={() => setEmployeeModal(null)} onApply={handleApplyEmployee} />
    ) : null}
    {tempWorkerModal ? (
      <div className="modal-popup">
        <div className="modal-dialog s">
          <div className="modal-content">
            <div className="modal-header">
              <h2>직원 외 근무자 추가</h2>
              <button className="modal-close" aria-label="닫기" onClick={() => setTempWorkerModal(null)}></button>
            </div>
            <div className="modal-body">
              <table className="default-table">
                <colgroup>
                  <col width="120px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>이름</th>
                    <td>
                      <input
                        className="input-frame"
                        type="text"
                        value={tempWorkerName}
                        onChange={(event) => setTempWorkerName(event.target.value)}
                        placeholder="직원 외 근무자명을 입력하세요"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="pop-btn-content" style={{ marginTop: 16 }}>
                <button className="btn-form gray" onClick={() => setTempWorkerModal(null)}>
                  닫기
                </button>
                <button className="btn-form basic" onClick={handleApplyTempWorker}>
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null}
    <div className="contents-wrap">
      <WorkScheduleSearch
        resultCount={resultCount}
        isLoading={isLoading}
        initialQuery={initialQuery}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <div className="contents-body">
        <div className="content-wrap">
          <div className="store-work-btn">
            <button
              className="btn-form gray"
              onClick={() => {
                if (!confirm('입력한 내용을 저장하지 않았습니다. 점포별 근무 계획표로 이동하시겠습니까?')) {
                  return;
                }
                const source: StoreScheduleQuery | (Partial<StoreScheduleQuery> & { from?: string; to?: string }) | null =
                  lastQuery ?? initialQuery ?? null;
                const params = buildStoreScheduleParams(source);
                router.push(`/employee/schedule/view${toQueryString(params)}`);
              }}
            >
              취소
            </button>
            <button className="btn-form basic" onClick={handleSave} disabled={isLoading}>
              저장
            </button>
          </div>
          {isLoading ? (
            <div className="empty-wrap">
              <div className="empty-data">데이터를 불러오는 중입니다.</div>
            </div>
          ) : renderedPlans.length === 0 ? (
            <div className="empty-wrap">
              <div className="empty-data">조회된 근무 계획표가 없습니다.</div>
            </div>
          ) : (
            <div className="store-work-wrap">
              {renderedPlans.map((day, dayIndex) => (
                <div key={day.date} className="store-work-date-wrap">
                  <div className="store-work-date flx-bx">
                    {day.date} ({day.dayLabel})
                    {day.workers.length === 0 && (
                      <div className="more-btn">
                        <span className="icon-more" id={`more-btn-anchor-work-hours-empty-${dayIndex}`}></span>
                        <Tooltip
                          className="option-list"
                          anchorSelect={`#more-btn-anchor-work-hours-empty-${dayIndex}`}
                          place="right-start"
                          offset={0}
                          openOnClick={true} // 클릭으로 열기
                          clickable={true} // 툴팁 내부 클릭 가능
                          opacity={1}
                        >
                          <button className="option-item" onClick={() => openAddEmployee(dayIndex)}>근무자 추가</button>
                          <button className="option-item" onClick={() => openTempWorker(dayIndex)}>직원 외 근무자 추가</button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  <div className="store-work-data-wrap-list">
                    {day.workers.length === 0 ? (
                      <div className="empty-wrap">
                        <div className="empty-data">근무자가 없습니다.</div>
                      </div>
                    ) : (
                      day.workers.map((worker) => {
                        const workBlockStates = buildWorkBlockStates(worker);
                        const breakBlockStates = buildBreakBlockStates(worker);
                        const badgeColor = CONTRACT_COLOR_MAP[worker.contractType] ?? 'blue';
                        const startPercent = (worker.startIndex / 48) * 100;
                        const endPercent = (worker.endIndex / 48) * 100;
                        const breakStartPercent = (worker.breakStartIndex / 48) * 100;
                        const breakEndPercent = (worker.breakEndIndex / 48) * 100;
                        return (
                          <div key={worker.id} className="store-work-data-wrap">
                            <div className="flx-bx">
                              <div className="work-info">
                                <div className={`work-badge ${badgeColor}`}>{worker.contractType}</div>
                                <div className="staff-name">{worker.name}</div>
                                <div className="store-work-time">
                                  {worker.hasWork
                                    ? `${indexToTime(worker.startIndex)}-${indexToTime(worker.endIndex)}`
                                    : ' - '}
                                  {worker.hasBreak && (
                                    <span>
                                      {' | '}
                                      {indexToTime(worker.breakStartIndex)}-{indexToTime(worker.breakEndIndex)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="auto-right">
                                <div className="total-hours">
                                  {worker.hasWork
                                    ? `${((worker.endIndex - worker.startIndex) / 2).toFixed(1)}h`
                                    : '0H'}
                                </div>
                                <div className="more-btn">
                                  <span className="icon-more" id={`more-btn-worker-${dayIndex}-${worker.id}`}></span>
                                  <Tooltip
                                    className="option-list"
                                    anchorSelect={`#more-btn-worker-${dayIndex}-${worker.id}`}
                                    place="left-start"
                                    offset={0}
                                    openOnClick={true}
                                    clickable={true}
                                    opacity={1}
                                  >
                                    <button className="option-item" onClick={() => openAddEmployee(dayIndex, worker.id)}>
                                      근무자 추가
                                    </button>
                                    <button className="option-item" onClick={() => openTempWorker(dayIndex, worker.id)}>
                                      직원 외 근무자 추가
                                    </button>
                                    <button className="option-item" onClick={() => openReplaceEmployee(dayIndex, worker.id)}>
                                      근무자 교체
                                    </button>
                                    <button className="option-item" onClick={() => handleDeleteWorker(dayIndex, worker.id)}>
                                      근무자 삭제
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                            <div className="staff-work-table">
                              <div className="work-hours-preview" style={{ marginTop: 0, marginBottom: 8 }}>
                                <div
                                  className="work-hours-wrap"
                                  style={{ width: '100%', gap: 16, justifyContent: 'flex-start' }}
                                >
                                  <div className="toggle-wrap">
                                    <span className="toggle-txt">근무 여부</span>
                                    <label className="toggle-btn" htmlFor={`work-toggle-${worker.id}`}>
                                      <input
                                        type="checkbox"
                                        id={`work-toggle-${worker.id}`}
                                        checked={worker.hasWork}
                                        onChange={(event) => {
                                          const nextHasWork = event.target.checked;
                                          setPlans((prev) =>
                                            prev.map((dayItem, dIndex) => {
                                              if (dIndex !== dayIndex) return dayItem;
                                              return {
                                                ...dayItem,
                                                workers: dayItem.workers.map((item) =>
                                                  item.id !== worker.id
                                                    ? item
                                                    : {
                                                      ...item,
                                                      hasWork: nextHasWork,
                                                      hasBreak: nextHasWork ? item.hasBreak : false,
                                                    }
                                                ),
                                              };
                                            })
                                          );
                                          dirtyWorkersRef.current.add(`${day.date}|${worker.id}`);
                                        }}
                                      />
                                      <span className="slider" />
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <div className={`time-slider${worker.hasWork ? '' : ' is-disabled'}`}>
                                <div className={`time-blocks ${badgeColor}`}>
                                  <span
                                    className="time-handle start"
                                    style={{ left: `calc(${startPercent}% - 6px)` }}
                                    onMouseDown={(event) => {
                                      if (!worker.hasWork) return;
                                      const slider = event.currentTarget.closest(
                                        '.time-slider'
                                      ) as HTMLDivElement | null;
                                      if (!slider) return;
                                      dragRef.current = {
                                        dayIndex,
                                        workerId: worker.id,
                                        type: 'work-start',
                                        slider,
                                      };
                                    }}
                                  />
                                  <span
                                    className="time-handle end"
                                    style={{ left: `calc(${endPercent}% - 6px)` }}
                                    onMouseDown={(event) => {
                                      if (!worker.hasWork) return;
                                      const slider = event.currentTarget.closest(
                                        '.time-slider'
                                      ) as HTMLDivElement | null;
                                      if (!slider) return;
                                      dragRef.current = {
                                        dayIndex,
                                        workerId: worker.id,
                                        type: 'work-end',
                                        slider,
                                      };
                                    }}
                                  />
                                  {workBlockStates.map((block, index) => {
                                    const className = 'time-block';
                                    const style =
                                      block.state === 'empty'
                                        ? { backgroundColor: 'transparent' }
                                        : undefined;
                                    return <div key={index} className={className} style={style} />;
                                  })}
                                </div>
                              </div>
                              <div className="time-header">
                                {HOURS.map((hour) => (
                                  <div key={hour} className="time-label">
                                    {String(hour).padStart(2, '0')}
                                  </div>
                                ))}
                              </div>
                              <div className="work-hours-preview" style={{ marginTop: 8, marginBottom: 8 }}>
                                <div
                                  className="work-hours-wrap"
                                  style={{ width: '100%', gap: 16, justifyContent: 'flex-start' }}
                                >
                                  <div className="toggle-wrap">
                                    <span className="toggle-txt">휴게 여부</span>
                                    <label className="toggle-btn" htmlFor={`break-toggle-${worker.id}`}>
                                      <input
                                        type="checkbox"
                                        id={`break-toggle-${worker.id}`}
                                        checked={worker.hasBreak}
                                        onChange={(event) =>
                                          handleBreakToggle(dayIndex, worker.id, event.target.checked)
                                        }
                                        disabled={!worker.hasWork}
                                      />
                                      <span className="slider" />
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`time-slider break-slider${
                                  worker.hasWork && worker.hasBreak ? '' : ' is-disabled'
                                }`}
                              >
                                <div className="time-blocks">
                                  <span
                                    className="time-handle start break"
                                    style={{ left: `calc(${breakStartPercent}% - 6px)` }}
                                    onMouseDown={(event) => {
                                      if (!worker.hasWork || !worker.hasBreak) return;
                                      const slider = event.currentTarget.closest(
                                        '.time-slider'
                                      ) as HTMLDivElement | null;
                                      if (!slider) return;
                                      dragRef.current = {
                                        dayIndex,
                                        workerId: worker.id,
                                        type: 'break-start',
                                        slider,
                                      };
                                    }}
                                  />
                                  <span
                                    className="time-handle end break"
                                    style={{ left: `calc(${breakEndPercent}% - 6px)` }}
                                    onMouseDown={(event) => {
                                      if (!worker.hasWork || !worker.hasBreak) return;
                                      const slider = event.currentTarget.closest(
                                        '.time-slider'
                                      ) as HTMLDivElement | null;
                                      if (!slider) return;
                                      dragRef.current = {
                                        dayIndex,
                                        workerId: worker.id,
                                        type: 'break-end',
                                        slider,
                                      };
                                    }}
                                  />
                                  {breakBlockStates.map((block, index) => {
                                    const className = `time-block${block.state === 'break' ? ' gray' : ''}`;
                                    const style =
                                      block.state === 'empty'
                                        ? { backgroundColor: 'transparent' }
                                        : undefined;
                                    return <div key={index} className={className} style={style} />;
                                  })}
                                </div>
                              </div>
                              <div className="time-header">
                                {HOURS.map((hour) => (
                                  <div key={hour} className="time-label">
                                    {String(hour).padStart(2, '0')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
