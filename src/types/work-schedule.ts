// 요일 정의
export type DayType =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'
  | 'WEEKDAY';


// 매장별 근무 계획표 조회 쿼리
export type StoreScheduleQuery = {
  officeId: number;
  franchiseId?: number;
  storeId?: number;
  employeeName?: string;
  dayType?: DayType;
  from: string;
  to: string;
};

// 직원별 근무 계획표 요청
export type WorkerRequest = {
  shiftId?: number | null;
  workerId?: number | null;
  tempWorkerName?: string | null;
  hasWork: boolean;
  workStartTime?: string | null;
  workEndTime?: string | null;
  hasBreak: boolean;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  isDeleted?: boolean;
};

// 직원별 근무 계획표 요청
export type ScheduleRequest = {
  date: string;
  workerRequests: WorkerRequest[];
};

// 직원별 근무 계획표 응답
export type WorkerResponse = {
  shiftId?: number | null;
  workerId?: number | null;
  workerName: string;
  contractType: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  hasWork: boolean;
  hasBreak: boolean;
  isDeleted: boolean;
};

// 매장별 근무 계획표 응답
export type ScheduleResponse = {
  storeId?: number | null;
  storeName?: string | null;
  scheduleId?: number | null;
  date: string;
  day: string;
  workerList: WorkerResponse[];
};

// 매장별 근무 계획표 요약
export type ScheduleSummary = {
  id: number;
  date: string;
};

// 엑셀 다운로드 결과
export type ExcelDownloadResult = {
  blob: Blob;
  fileName: string;
};

// 엑셀 업로드 오류 행
export type ExcelRowError = {
  rowNumber: number;
  message: string;
};

// 엑셀 검증 결과 (검증만 수행, 저장하지 않음)
export type ExcelValidationResult = {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  schedules: ScheduleRequest[] | null;
  errors: ExcelRowError[];
};
