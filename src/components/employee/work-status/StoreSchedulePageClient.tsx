'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkScheduleSearch from '@/components/employee/work-status/WorkScheduleSearch';
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
  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    schedules.forEach((schedule) => {
      schedule.workerList.forEach((worker) => {
        if (!worker.workerName) return;
        if (!worker.hasWork) return;
        if (!map.has(worker.workerName)) {
          map.set(worker.workerName, worker.workerName);
        }
      });
    });
    return Array.from(map.values()).map((name) => ({ label: name, value: name }));
  }, [schedules]);

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
    const params = new URLSearchParams();
    if (lastQuery?.officeId) params.set('officeId', String(lastQuery.officeId));
    if (lastQuery?.franchiseId) params.set('franchiseId', String(lastQuery.franchiseId));
    if (lastQuery?.storeId) params.set('storeId', String(lastQuery.storeId));
    if (lastQuery?.employeeName) params.set('employeeName', lastQuery.employeeName);
    if (lastQuery?.dayType) params.set('dayType', lastQuery.dayType);
    if (lastQuery?.from) params.set('from', lastQuery.from);
    if (lastQuery?.to) params.set('to', lastQuery.to);
    const queryString = params.toString();
    router.push(`/employee/schedule/plan${queryString ? `?${queryString}` : ''}`);
  };

  const handleSelectDate = (date: string, storeId?: number | null) => {
    const params = new URLSearchParams();
    if (lastQuery?.officeId) params.set('officeId', String(lastQuery.officeId));
    if (lastQuery?.franchiseId) params.set('franchiseId', String(lastQuery.franchiseId));
    if (lastQuery?.storeId) params.set('storeId', String(lastQuery.storeId));
    if (lastQuery?.employeeName) params.set('employeeName', lastQuery.employeeName);
    if (lastQuery?.dayType) params.set('dayType', lastQuery.dayType);
    if (lastQuery?.from) params.set('from', lastQuery.from);
    if (lastQuery?.to) params.set('to', lastQuery.to);
    params.set('date', date);
    if (storeId) {
      params.set('storeId', String(storeId));
    }
    router.push(`/employee/schedule/plan?${params.toString()}`);
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
        employeeOptions={employeeOptions}
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
