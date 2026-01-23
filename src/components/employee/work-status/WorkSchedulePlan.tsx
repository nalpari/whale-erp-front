'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import WorkScheduleSearch from './WorkScheduleSearch';
import type { DayType, ScheduleResponse, StoreScheduleQuery } from '@/types/work-schedule';
import useStoreSchedule from '@/hooks/useStoreSchedule';
import { Tooltip } from 'react-tooltip';

type WorkerPlan = {
  id: string;
  name: string;
  contractType: string;
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

const indexToTime = (index: number) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

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

const buildPlansFromSchedules = (schedules: ScheduleResponse[]): DayPlan[] =>
  schedules.map((schedule) => {
    const dayLabel = schedule.day ?? '';
    const workers: WorkerPlan[] = schedule.workerList.map((worker, index) => {
      const startIndex = parseTimeToIndex(worker.workStartTime) ?? 0;
      const endIndex = parseTimeToIndex(worker.workEndTime) ?? startIndex;
      const safeEndIndex = endIndex <= startIndex ? clamp(startIndex + 1, 1, 48) : endIndex;
      const breakStartIndex = parseTimeToIndex(worker.breakStartTime) ?? 0;
      const breakEndIndex = parseTimeToIndex(worker.breakEndTime) ?? breakStartIndex;
      const safeBreakStart = clamp(breakStartIndex, startIndex, safeEndIndex - 1);
      const safeBreakEnd = clamp(breakEndIndex, safeBreakStart + 1, safeEndIndex);
      const id = worker.shiftId ?? worker.workerId ?? `worker-${schedule.date}-${index}`;
      return {
        id: String(id),
        name: worker.workerName ?? '직원',
        contractType: worker.contractType ?? '정직원',
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

export default function WorkSchedulePlan() {
  const searchParams = useSearchParams();
  const { getSchedules } = useStoreSchedule();
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultCount, setResultCount] = useState(0);
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
      setIsLoading(true);
      const { data, error } = await getSchedules(query);
      if (error) {
        alert(error);
        setIsLoading(false);
        return;
      }
      const nextPlans = buildPlansFromSchedules(data ?? []);
      setPlans(nextPlans);
      setResultCount(
        data?.reduce((sum, schedule) => sum + schedule.workerList.length, 0) ?? 0
      );
      setIsLoading(false);
    },
    [getSchedules]
  );

  const handleReset = useCallback(() => {
    setPlans([]);
    setResultCount(0);
  }, []);

  const handleBreakToggle = (dayIndex: number, workerId: string, enabled: boolean) => {
    setPlans((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;
        return {
          ...day,
          workers: day.workers.map((worker) => {
            if (worker.id !== workerId) return worker;
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

  const renderedPlans = useMemo(() => plans, [plans]);

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
                return { ...worker, startIndex };
              }
              if (type === 'work-end') {
                const endIndex = clamp(nextIndex, worker.startIndex + 1, 48);
                return { ...worker, endIndex };
              }
              if (type === 'break-start') {
                const breakStartIndex = clamp(nextIndex, worker.startIndex, worker.breakEndIndex - 1);
                return { ...worker, breakStartIndex };
              }
              if (type === 'break-end') {
                const breakEndIndex = clamp(nextIndex, worker.breakStartIndex + 1, worker.endIndex);
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
                          <button className="option-item">근무자 추가</button>
                          <button className="option-item">근무자 삭제</button>
                          <button className="option-item">근무자 교체</button>
                          <button className="option-item">직원 외 근무자 추가</button>
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
          <div className="store-work-btn">
            <button className="btn-form gray">취소</button>
            <button className="btn-form basic">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
