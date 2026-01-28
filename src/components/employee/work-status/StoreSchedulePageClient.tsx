'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const queryClient = useQueryClient();
  const lastQuery = useStoreScheduleViewStore((state) => state.lastQuery);
  const filters = useStoreScheduleViewStore((state) => state.filters);
  const hydrated = useStoreScheduleViewStore((state) => state.hydrated);
  const isUploadOpen = useStoreScheduleViewStore((state) => state.isUploadOpen);
  const setLastQuery = useStoreScheduleViewStore((state) => state.setLastQuery);
  const setFilters = useStoreScheduleViewStore((state) => state.setFilters);
  const setUploadOpen = useStoreScheduleViewStore((state) => state.setUploadOpen);
  const resetFilters = useStoreScheduleViewStore((state) => state.resetFilters);
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
    alert(scheduleQuery.error.message);
  }, [scheduleQuery.error]);

  const handleSearch = async (query: StoreScheduleQuery) => {
    setLastQuery(query);
    setFilters(query);
    await queryClient.invalidateQueries({ queryKey: storeScheduleKeys.list(query) });
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleDownloadExcel = async () => {
    if (!lastQuery?.storeId) {
      alert('엑셀 다운로드는 점포 ID를 선택해야 합니다.');
      return;
    }
    try {
      const data = await downloadMutation.mutateAsync({
        storeId: lastQuery.storeId,
        params: { from: lastQuery.from, to: lastQuery.to },
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
      alert(message);
    }
  };

  const handleUploadExcel = async (file: File) => {
    if (!lastQuery?.storeId) {
      alert('엑셀 업로드는 점포 ID를 선택해야 합니다.');
      return;
    }
    try {
      await uploadMutation.mutateAsync({ storeId: lastQuery.storeId, file });
    } catch (error) {
      const message = error instanceof Error ? error.message : '엑셀 업로드에 실패했습니다.';
      alert(message);
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
        initialQuery={filters}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <WorkScheduleTable
        schedules={schedules}
        isLoading={isLoading}
        onDownloadExcel={handleDownloadExcel}
        onOpenUploadExcel={() => setUploadOpen(true)}
        onPlan={handlePlan}
        onSelectDate={handleSelectDate}
      />
      {isUploadOpen && (
        <UploadExcel
          isUploading={isLoading}
          result={null}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUploadExcel}
        />
      )}
    </div>
  );
}
