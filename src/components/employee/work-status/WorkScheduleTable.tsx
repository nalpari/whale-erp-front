'use client';

import { useMemo, useRef, type ChangeEvent } from 'react';
import type { ScheduleResponse, WorkerResponse } from '@/types/work-schedule';

type WorkScheduleTableProps = {
  schedules: ScheduleResponse[];
  isLoading: boolean;
  onDownloadExcel: () => void;
  onUploadExcel: (file: File) => void;
  onPlan: () => void;
  onSelectDate: (date: string, storeId?: number | null) => void;
};

type TimeBlock = {
  hour: number;
  minute: 0 | 30;
  startMinute: number;
};

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

const parseTimeToMinutes = (value?: string | null) => {
  if (!value) return null;
  const parts = value.split(':');
  const hour = Number(parts[0] ?? 0);
  const minute = Number(parts[1] ?? 0);
  return hour * 60 + minute;
};

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return '-';
  return `${start.slice(0, 5)}-${end.slice(0, 5)}`;
};

const formatDateLabel = (date: string, day?: string) => {
  const normalized = date.replace(/-/g, '.');
  return day ? `${normalized} (${day})` : normalized;
};

const calculateTotalHours = (worker: WorkerResponse) => {
  if (!worker.hasWork) return '-';
  const start = parseTimeToMinutes(worker.workStartTime);
  const end = parseTimeToMinutes(worker.workEndTime);
  if (start == null || end == null || end <= start) return '-';
  let minutes = end - start;
  if (worker.hasBreak) {
    const breakStart = parseTimeToMinutes(worker.breakStartTime);
    const breakEnd = parseTimeToMinutes(worker.breakEndTime);
    if (breakStart != null && breakEnd != null && breakEnd > breakStart) {
      minutes -= Math.min(minutes, breakEnd - breakStart);
    }
  }
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
};

const buildTimeAxis = (workers: WorkerResponse[]) => {
  const times = workers
    .map((worker) => ({
      start: parseTimeToMinutes(worker.workStartTime),
      end: parseTimeToMinutes(worker.workEndTime),
    }))
    .filter((item) => item.start != null && item.end != null && item.end > item.start);

  let minMinute = 9 * 60;
  let maxMinute = 18 * 60;
  if (times.length > 0) {
    minMinute = Math.min(...times.map((item) => item.start ?? minMinute));
    maxMinute = Math.max(...times.map((item) => item.end ?? maxMinute));
  }
  const startHour = Math.max(0, Math.floor(minMinute / 60));
  const endHour = Math.min(24, Math.ceil(maxMinute / 60));
  const hours = Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i);
  const timeBlocks: TimeBlock[] = hours.flatMap((hour) => [
    { hour, minute: 0, startMinute: hour * 60 },
    { hour, minute: 30, startMinute: hour * 60 + 30 },
  ]);

  return { hours, timeBlocks };
};

const buildBlockStates = (worker: WorkerResponse, blocks: TimeBlock[]) => {
  const start = parseTimeToMinutes(worker.workStartTime);
  const end = parseTimeToMinutes(worker.workEndTime);
  const breakStart = parseTimeToMinutes(worker.breakStartTime);
  const breakEnd = parseTimeToMinutes(worker.breakEndTime);

  return blocks.map((block) => {
    const blockEnd = block.startMinute + 30;
    const isWorking =
      worker.hasWork &&
      start != null &&
      end != null &&
      block.startMinute < end &&
      blockEnd > start;
    if (!isWorking) {
      return { state: 'empty' as const };
    }
    const isBreak =
      worker.hasBreak &&
      breakStart != null &&
      breakEnd != null &&
      block.startMinute < breakEnd &&
      blockEnd > breakStart;
    return { state: isBreak ? ('break' as const) : ('work' as const) };
  });
};

const sortWorkersByRule = (workers: WorkerResponse[]) =>
  [...workers].sort((a, b) => {
    const startA = parseTimeToMinutes(a.workStartTime) ?? 0;
    const startB = parseTimeToMinutes(b.workStartTime) ?? 0;
    if (startA !== startB) return startA - startB;
    const orderA = CONTRACT_ORDER[a.contractType ?? ''] ?? 99;
    const orderB = CONTRACT_ORDER[b.contractType ?? ''] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.workerName ?? '').localeCompare(b.workerName ?? '');
  });

export default function WorkScheduleTable({
  schedules,
  isLoading,
  onDownloadExcel,
  onUploadExcel,
  onPlan,
  onSelectDate,
}: WorkScheduleTableProps) {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const sortedSchedules = useMemo(
    () => [...schedules].sort((a, b) => a.date.localeCompare(b.date)),
    [schedules]
  );

  const handleUploadClick = () => {
    uploadRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onUploadExcel(file);
    event.target.value = '';
  };

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        <div className="content-wrap">
          {isLoading ? (
            <div className="empty-wrap">
              <div className="empty-data">데이터를 불러오는 중입니다.</div>
            </div>
          ) : sortedSchedules.length === 0 ? (
            <div className="empty-wrap">
              <div className="empty-data">조회된 근무 계획표가 없습니다.</div>
            </div>
          ) : (
            <div className="store-work-wrap">
              {sortedSchedules.map((schedule) => {
                const sortedWorkers = sortWorkersByRule(schedule.workerList);
                const { hours, timeBlocks } = buildTimeAxis(sortedWorkers);
                return (
                  <div key={`${schedule.date}-${schedule.storeId ?? 'store'}`} className="store-work-date-wrap">
                    <button
                      type="button"
                      className="store-work-date"
                      onClick={() => onSelectDate(schedule.date, schedule.storeId)}
                    >
                      {formatDateLabel(schedule.date, schedule.day)}
                    </button>
                    <div className="store-work-data-wrap-list">
                      {schedule.workerList.length === 0 ? (
                        <div className="empty-wrap">
                          <div className="empty-data">근무자가 없습니다.</div>
                        </div>
                      ) : (
                        sortedWorkers.map((worker) => {
                          const badgeColor = CONTRACT_COLOR_MAP[worker.contractType] ?? 'blue';
                          const blockStates = buildBlockStates(worker, timeBlocks);
                          return (
                            <div
                              key={`${schedule.date}-${worker.workerName}-${worker.shiftId ?? 'temp'}`}
                              className="store-work-data-wrap"
                            >
                              <div className="flx-bx">
                                <div className="work-info">
                                  <div className={`work-badge ${badgeColor}`}>{worker.contractType}</div>
                                  <div className="staff-name">{worker.workerName}</div>
                                  <div className="store-work-time">
                                    {formatTimeRange(worker.workStartTime, worker.workEndTime)}
                                  </div>
                                </div>
                                <div className="auto-right">
                                  <div className="total-hours">{calculateTotalHours(worker)}</div>
                                </div>
                              </div>
                              <div className="staff-work-table">
                                <div className={`time-blocks ${badgeColor}`}>
                                  {blockStates.map((block, index) => {
                                    const className = `time-block${block.state === 'break' ? ' gray' : ''}`;
                                    const style =
                                      block.state === 'empty'
                                        ? { backgroundColor: 'transparent' }
                                        : undefined;
                                    return <div key={index} className={className} style={style} />;
                                  })}
                                </div>
                                <div className="time-header">
                                  {hours.map((hour) => (
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
                );
              })}
            </div>
          )}
          <div className="store-work-btn">
            <button className="btn-form outline s" onClick={onDownloadExcel} disabled={isLoading}>
              엑셀 파일 다운로드
            </button>
            <button className="btn-form outline s" onClick={handleUploadClick} disabled={isLoading}>
              엑셀 파일 업로드
            </button>
            <button className="btn-form basic" onClick={onPlan} disabled={isLoading}>
              계획 수립
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
