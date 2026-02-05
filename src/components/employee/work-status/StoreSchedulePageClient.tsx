'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAlert } from '@/components/common/ui';
import UploadExcel from '@/components/employee/popup/UploadExcel';
import WorkScheduleSearch from '@/components/employee/work-status/WorkScheduleSearch';
import WorkScheduleTable from '@/components/employee/work-status/WorkScheduleTable';
import Location from '@/components/ui/Location';
import {
  storeScheduleKeys,
  useStoreScheduleDownloadExcel,
  useStoreScheduleList,
  useStoreScheduleUploadExcel,
} from '@/hooks/queries';
import { useStoreScheduleViewStore } from '@/stores/store-schedule-store';
import { useQueryClient } from '@tanstack/react-query';
import { buildStoreScheduleParams, toQueryString } from '@/util/store-schedule';
import type { StoreScheduleQuery } from '@/types/work-schedule';

export default function StoreSchedulePageClient() {
  const router = useRouter();
  const { alert } = useAlert();
  const queryClient = useQueryClient();
  const lastQuery = useStoreScheduleViewStore((state) => state.lastQuery);
  const filters = useStoreScheduleViewStore((state) => state.filters);
  const hydrated = useStoreScheduleViewStore((state) => state.hydrated);
  const isUploadOpen = useStoreScheduleViewStore((state) => state.isUploadOpen);
  const setLastQuery = useStoreScheduleViewStore((state) => state.setLastQuery);
  const setFilters = useStoreScheduleViewStore((state) => state.setFilters);
  const setUploadOpen = useStoreScheduleViewStore((state) => state.setUploadOpen);
  const resetFilters = useStoreScheduleViewStore((state) => state.resetFilters);
  const [showStoreError, setShowStoreError] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: Array<{ rowNumber: number; message: string }>;
  } | null>(null);
  const scheduleQuery = useStoreScheduleList(lastQuery, hydrated);
  const uploadMutation = useStoreScheduleUploadExcel();
  const downloadMutation = useStoreScheduleDownloadExcel();
  const schedules = useMemo(() => scheduleQuery.data ?? [], [scheduleQuery.data]);
  const isLoading =
    scheduleQuery.isFetching || uploadMutation.isPending || downloadMutation.isPending;

  const resultCount = useMemo(
    () => schedules.reduce((sum, schedule) => sum + schedule.workerList.length, 0),
    [schedules]
  );
  useEffect(() => {
    if (!scheduleQuery.error) return;
    const showError = async () => {
      await alert(scheduleQuery.error.message);
    };
    showError();
  }, [scheduleQuery.error, alert]);

  const handleSearch = async (query: StoreScheduleQuery) => {
    setLastQuery(query);
    setFilters(query);
    if (query.storeId) {
      setShowStoreError(false);
    }
    await queryClient.invalidateQueries({ queryKey: storeScheduleKeys.list(query) });
  };

  const handleReset = () => {
    setShowStoreError(false);
    resetFilters();
  };

  const handleDownloadExcel = async () => {
    if (!lastQuery?.storeId) {
      setShowStoreError(true);
      return;
    }
    try {
      const trimmedEmployeeName = lastQuery.employeeName?.trim();
      const data = await downloadMutation.mutateAsync({
        params: {
          storeId: lastQuery.storeId,
          startDate: lastQuery.from,
          endDate: lastQuery.to,
          ...(trimmedEmployeeName ? { employeeName: trimmedEmployeeName } : {}),
          ...(lastQuery.dayType ? { dayOfWeek: lastQuery.dayType } : {}),
        }
      });
      const { blob, fileName } = data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : '엑셀 다운로드에 실패했습니다.';
      await alert(message);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await api.get('/api/v1/store-schedule/template', {
        responseType: 'blob',
        headers: {
          'Content-Type': undefined, // GET 요청에서 Content-Type 헤더 제거
        },
      });

      const blob = response.data;
      const contentDisposition = response.headers['content-disposition'];
      let fileName = '근무계획_업로드_샘플.xlsx';

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : '샘플 파일 다운로드에 실패했습니다.';
      await alert(message);
    }
  }

  const handleOpenUploadExcel = () => {
    if (!lastQuery?.storeId) {
      setShowStoreError(true);
      return;
    }
    setUploadResult(null); // 팝업 열 때 이전 결과 초기화
    setUploadOpen(true);
  }

  const handleUploadExcel = async (file: File) => {
    try {
      const result = await uploadMutation.mutateAsync({ storeId: lastQuery?.storeId ?? 0, file });
      setUploadResult(result);

      if (result.success) {
        // 성공 시 데이터 새로고침
        await queryClient.invalidateQueries({ queryKey: storeScheduleKeys.list(lastQuery!) });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '엑셀 업로드에 실패했습니다.';
      setUploadResult({
        success: false,
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [{ rowNumber: 0, message }],
      });
    }
  };

  const handlePlan = () => {
    const params = buildStoreScheduleParams(lastQuery ?? filters);
    router.push(`/employee/schedule/plan${toQueryString(params)}`);
  };

  const handleSelectDate = (date: string, storeId?: number | null) => {
    const params = buildStoreScheduleParams(lastQuery, {
      from: date,
      to: date,
      date,
      storeId: storeId ?? lastQuery?.storeId ?? filters.storeId,
    });
    router.push(`/employee/schedule/plan${toQueryString(params)}`);
  };

  return (
    <div className="data-wrap">
      <Location
        title="매장별 근무 계획표"
        list={['Home', '직원 관리', '근무 현황', '매장별 근무 계획표']}
      />
      <WorkScheduleSearch
        resultCount={resultCount}
        isLoading={isLoading}
        showStoreError={showStoreError}
        onStoreErrorChange={setShowStoreError}
        initialQuery={filters}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <WorkScheduleTable
        schedules={schedules}
        isLoading={isLoading}
        onDownloadExcel={handleDownloadExcel}
        // onOpenUploadExcel={() => setUploadOpen(true)}
        onOpenUploadExcel={handleOpenUploadExcel}
        onPlan={handlePlan}
        onSelectDate={handleSelectDate}
      />
      {isUploadOpen && (
        <UploadExcel
          isUploading={isLoading}
          result={uploadResult}
          onClose={() => {
            setUploadOpen(false);
            setUploadResult(null);
          }}
          onUpload={handleUploadExcel}
          onDownloadSample={handleDownloadSample}
        />
      )}
    </div>
  );
}
