'use client';

import { useMemo } from 'react';
import type { WorkerResponse, ScheduleResponse } from '@/types/work-schedule';
import WorkHoursTimePicker from '@/components/store/manage/WorkHoursTimePicker';

type WorkScheduleTableProps = {
  schedules: ScheduleResponse[];
  isLoading: boolean;
  isDownloading?: boolean;
  onDownloadExcel: () => void;
  onOpenUploadExcel: () => void;
  onPlan: () => void;
  onSelectDate: (date: string, storeId?: number | null) => void;
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

const formatDateLabel = (date: string, day?: string) => {
  const normalized = date.replace(/-/g, '.');
  return day ? `${normalized} (${day})` : normalized;
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
  isDownloading,
  onDownloadExcel,
  onOpenUploadExcel,
  onPlan,
  onSelectDate,
}: WorkScheduleTableProps) {
  const sortedSchedules = useMemo(
    () => [...schedules].sort((a, b) => a.date.localeCompare(b.date)),
    [schedules]
  );

  return (
    <div className="contents-wrap">
      <div className="contents-body">
        <div className="content-wrap">
          <div className="store-work-btn">
            <button className="btn-form outline s" onClick={onDownloadExcel} disabled={isLoading || isDownloading}>
              엑셀 파일 다운로드
            </button>
            <button className="btn-form outline s" onClick={onOpenUploadExcel} disabled={isLoading}>
              엑셀 파일 업로드
            </button>
            <button className="btn-form basic" onClick={onPlan} disabled={isLoading}>
              계획 수립
            </button>
          </div>
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
                      {sortedWorkers.length === 0 ? (
                        <div className="empty-wrap">
                          <div className="empty-data">근무자가 없습니다.</div>
                        </div>
                      ) : (
                        sortedWorkers.map((worker, idx) => {
                          const badgeColor = CONTRACT_COLOR_MAP[worker.contractType] ?? 'blue';
                          return (
                            <div
                              key={`${schedule.date}-${worker.workerName}-${worker.shiftId ?? idx}`}
                              className="store-work-data-wrap"
                            >
                              <div className="flx-bx" style={{ marginBottom: 10 }}>
                                <div className="work-info">
                                  <div className={`work-badge ${badgeColor}`}>{worker.contractType}</div>
                                  <div className="staff-name">{worker.workerName}</div>
                                </div>
                              </div>
                              {worker.hasWork ? (
                                <WorkHoursTimePicker
                                  idPrefix={`view-${schedule.date}-${worker.shiftId ?? idx}`}
                                  toggleLabel={['근무', '휴게']}
                                  openTime={worker.workStartTime ?? null}
                                  closeTime={worker.workEndTime ?? null}
                                  breakStartTime={worker.breakStartTime ?? null}
                                  breakEndTime={worker.breakEndTime ?? null}
                                  isOperating={worker.hasWork}
                                  breakTimeEnabled={worker.hasBreak}
                                  readOnly
                                />
                              ) : (
                                <div style={{ padding: '8px 16px', color: '#999' }}>근무 없음</div>
                              )}
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
        </div>
      </div>
    </div>
  );
}
