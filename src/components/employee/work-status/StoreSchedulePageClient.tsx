'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkStatusSearch from '@/components/employee/work-status/WorkStatusSearch';
import WorkScheduleTable from '@/components/employee/work-status/WorkScheduleTable';
import Location from '@/components/ui/Location';
import useStoreSchedule from '@/hooks/useStoreSchedule';
import type { ScheduleResponse, StoreScheduleQuery } from '@/types/work-schedule';

export default function StoreSchedulePageClient() {
  const router = useRouter();
  const { getSchedules, downloadExcel, uploadExcel } = useStoreSchedule();
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<StoreScheduleQuery | null>(null);

  const resultCount = useMemo(
    () => schedules.reduce((sum, schedule) => sum + schedule.workerList.length, 0),
    [schedules]
  );

  const handleSearch = async (query: StoreScheduleQuery) => {
    setIsLoading(true);
    const { data, error } = await getSchedules(query);
    if (error) {
      alert(error);
    } else {
      setSchedules(data ?? []);
      setLastQuery(query);
    }
    setIsLoading(false);
  };

  const handleReset = () => {
    setSchedules([]);
    setLastQuery(null);
  };

  const handleDownloadExcel = async () => {
    if (!lastQuery?.storeId) {
      alert('엑셀 다운로드는 점포 ID를 선택해야 합니다.');
      return;
    }
    const { data, error } = await downloadExcel(lastQuery.storeId, {
      from: lastQuery.from,
      to: lastQuery.to,
    });
    if (error) {
      alert(error);
      return;
    }
    if (!data) return;
    const { blob, fileName } = data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleUploadExcel = async (file: File) => {
    if (!lastQuery?.storeId) {
      alert('엑셀 업로드는 점포 ID를 선택해야 합니다.');
      return;
    }
    setIsLoading(true);
    const { error } = await uploadExcel(lastQuery.storeId, file);
    if (error) {
      alert(error);
      setIsLoading(false);
      return;
    }
    if (lastQuery) {
      const { data } = await getSchedules(lastQuery);
      setSchedules(data ?? []);
    }
    setIsLoading(false);
  };

  const handlePlan = () => {
    router.push('/employee/work-status/establish-schedule');
  };

  const handleSelectDate = (date: string, storeId?: number | null) => {
    const params = new URLSearchParams();
    params.set('date', date);
    if (storeId) {
      params.set('storeId', String(storeId));
    }
    router.push(`/employee/work-status/establish-schedule?${params.toString()}`);
  };

  return (
    <div className="data-wrap">
      <Location
        title="매장별 근무 계획표"
        list={['Home', '직원 관리', '근무 현황', '매장별 근무 계획표']}
      />
      <WorkStatusSearch
        resultCount={resultCount}
        isLoading={isLoading}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <WorkScheduleTable
        schedules={schedules}
        isLoading={isLoading}
        onDownloadExcel={handleDownloadExcel}
        onUploadExcel={handleUploadExcel}
        onPlan={handlePlan}
        onSelectDate={handleSelectDate}
      />
    </div>
  );
}
