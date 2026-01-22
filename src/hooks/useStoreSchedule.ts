'use client';

import { useCallback } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import type { ApiResponse } from '@/lib/schemas/api';
import type {
  ExcelDownloadResult,
  ScheduleRequest,
  ScheduleResponse,
  ScheduleSummary,
  StoreScheduleQuery,
} from '@/types/work-schedule';

type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (message && typeof message === 'string') {
      return message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

// 엑셀 다운로드 파일명 추출
const getFileNameFromDisposition = (value?: string): string | null => {
  if (!value) return null;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const basicMatch = value.match(/filename="?([^\";]+)"?/i);
  return basicMatch?.[1] ?? null;
};

// 매장별 근무 계획표 API
export default function useStoreSchedule() {
  const getSchedules = useCallback(async (params: StoreScheduleQuery): Promise<ApiResult<ScheduleResponse[]>> => {
    try {
      const response = await api.get<ApiResponse<ScheduleResponse[]>>(
        '/api/v1/store-schedule',
        { params }
      );
      return { data: response.data.data ?? [], error: null };
    } catch (error) {
      return { data: [], error: getErrorMessage(error, '근무 계획 조회에 실패했습니다.') };
    }
  }, []);

  const upsertSchedules = useCallback(
    async (storeId: number, payload: ScheduleRequest[]): Promise<ApiResult<ScheduleSummary[]>> => {
      try {
        const response = await api.post<ApiResponse<ScheduleSummary[]>>(
          `/api/v1/store-schedule/${storeId}`,
          payload
        );
        return { data: response.data.data ?? [], error: null };
      } catch (error) {
        return { data: null, error: getErrorMessage(error, '근무 계획 저장에 실패했습니다.') };
      }
    },
    []
  );

  const deleteSchedule = useCallback(async (storeId: number, date: string): Promise<ApiResult<null>> => {
    try {
      await api.delete(`/api/v1/store-schedule/${storeId}/${date}`);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error, '근무 계획 삭제에 실패했습니다.') };
    }
  }, []);

  const deleteScheduleWorker = useCallback(
    async (
      storeId: number,
      date: string,
      params: { memberId?: number; tempWorkerName?: string }
    ): Promise<ApiResult<null>> => {
      if (!params.memberId && !params.tempWorkerName) {
        return { data: null, error: 'memberId 또는 tempWorkerName 중 하나는 필수입니다.' };
      }
      try {
        await api.delete(`/api/v1/store-schedule/employee/${storeId}/${date}`, { params });
        return { data: null, error: null };
      } catch (error) {
        return { data: null, error: getErrorMessage(error, '근무자 삭제에 실패했습니다.') };
      }
    },
    []
  );

  const downloadExcel = useCallback(
    async (storeId: number, params: { from: string; to: string }): Promise<ApiResult<ExcelDownloadResult>> => {
      try {
        const response = await api.get(
          `/api/v1/store-schedule/excel-download/${storeId}`,
          {
            params,
            responseType: 'blob',
          }
        );
        const contentDisposition = response.headers['content-disposition'];
        const fileName = getFileNameFromDisposition(contentDisposition) ?? 'store-schedule.xlsx';
        return { data: { blob: response.data, fileName }, error: null };
      } catch (error) {
        return { data: null, error: getErrorMessage(error, '엑셀 다운로드에 실패했습니다.') };
      }
    },
    []
  );

  const uploadExcel = useCallback(
    async (storeId: number, file: File): Promise<ApiResult<ScheduleSummary[]>> => {
      const formData = new FormData();
      formData.append('excel', file);
      try {
        const response = await api.post<ApiResponse<ScheduleSummary[]>>(
          `/api/v1/store-schedule/excel/${storeId}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return { data: response.data.data ?? [], error: null };
      } catch (error) {
        return { data: null, error: getErrorMessage(error, '엑셀 업로드에 실패했습니다.') };
      }
    },
    []
  );

  return {
    getSchedules,
    upsertSchedules,
    deleteSchedule,
    deleteScheduleWorker,
    downloadExcel,
    uploadExcel,
  };
}
