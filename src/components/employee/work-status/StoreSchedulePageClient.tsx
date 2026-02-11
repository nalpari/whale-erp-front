'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAlert } from '@/components/common/ui';
import UploadExcel from '@/components/employee/popup/UploadExcel';
import WorkScheduleSearch from '@/components/employee/work-status/WorkScheduleSearch';
import WorkScheduleTable from '@/components/employee/work-status/WorkScheduleTable';
import Location from '@/components/ui/Location';
import {
  storeScheduleKeys,
  useStoreScheduleDownloadExcel,
  useStoreScheduleDownloadTemplate,
  useStoreScheduleList,
  useStoreScheduleValidateExcel,
  useStoreScheduleUpsert,
} from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { buildStoreScheduleParams, toQueryString } from '@/util/store-schedule';
import type { DayType, ExcelValidationResult, StoreScheduleQuery } from '@/types/work-schedule';

const parseNumberParam = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function StoreSchedulePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alert } = useAlert();
  const queryClient = useQueryClient();

  // URL 파라미터에서 초기 검색 조건 파싱
  const initialQuery = useMemo(() => ({
    officeId: parseNumberParam(searchParams.get('officeId')),
    franchiseId: parseNumberParam(searchParams.get('franchiseId')),
    storeId: parseNumberParam(searchParams.get('storeId')),
    employeeName: searchParams.get('employeeName') ?? '',
    dayType: (searchParams.get('dayType') as DayType | '') ?? '',
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  }), [searchParams]);

  // 로컬 상태 (sessionStorage 저장 없음)
  const [lastQuery, setLastQuery] = useState<StoreScheduleQuery | null>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [showStoreError, setShowStoreError] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);

  const scheduleQuery = useStoreScheduleList(lastQuery, lastQuery !== null);
  const validateMutation = useStoreScheduleValidateExcel();
  const upsertMutation = useStoreScheduleUpsert();
  const downloadMutation = useStoreScheduleDownloadExcel();
  const templateMutation = useStoreScheduleDownloadTemplate();
  const schedules = useMemo(() => scheduleQuery.data ?? [], [scheduleQuery.data]);
  const isLoading = scheduleQuery.isFetching;

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
    if (query.storeId) {
      setShowStoreError(false);
    }
    await queryClient.invalidateQueries({ queryKey: storeScheduleKeys.list(query) });
  };

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지 (lastQuery 변경 안 함)
  const handleReset = () => {
    setShowStoreError(false);
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
      const { blob, fileName } = await templateMutation.mutateAsync();
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
    setValidationResult(null);
    setUploadOpen(true);
  }

  // 1단계: 엑셀 검증
  const handleValidateExcel = async (file: File) => {
    try {
      const result = await validateMutation.mutateAsync({ storeId: lastQuery?.storeId ?? 0, file });
      setValidationResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '엑셀 검증에 실패했습니다.';
      setValidationResult({
        valid: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        schedules: null,
        errors: [{ rowNumber: 0, message }],
      });
    }
  };

  // 2단계: 검증 성공 데이터 저장
  const handleSaveValidated = async () => {
    if (!validationResult?.schedules || !lastQuery?.storeId) return;

    try {
      await upsertMutation.mutateAsync({
        storeId: lastQuery.storeId,
        payload: validationResult.schedules,
        replaceMode: true,
      });
      await alert('저장되었습니다.');
      setUploadOpen(false);
      setValidationResult(null);
      await queryClient.invalidateQueries({ queryKey: storeScheduleKeys.list(lastQuery) });
    } catch (error) {
      const message = error instanceof Error ? error.message : '저장에 실패했습니다.';
      await alert(message);
    }
  };

  const handlePlan = () => {
    const params = buildStoreScheduleParams(lastQuery);
    router.push(`/employee/schedule/plan${toQueryString(params)}`);
  };

  const handleSelectDate = (date: string, storeId?: number | null) => {
    const params = buildStoreScheduleParams(lastQuery, {
      from: date,
      to: date,
      date,
      storeId: storeId ?? lastQuery?.storeId,
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
        initialQuery={initialQuery}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <WorkScheduleTable
        schedules={schedules}
        isLoading={isLoading}
        isDownloading={downloadMutation.isPending || templateMutation.isPending}
        onDownloadExcel={handleDownloadExcel}
        onOpenUploadExcel={handleOpenUploadExcel}
        onPlan={handlePlan}
        onSelectDate={handleSelectDate}
      />
      {isUploadOpen && (
        <UploadExcel
          isUploading={validateMutation.isPending}
          isSaving={upsertMutation.isPending}
          result={validationResult}
          onClose={() => {
            setUploadOpen(false);
            setValidationResult(null);
          }}
          onUpload={handleValidateExcel}
          onSave={handleSaveValidated}
          onDownloadSample={handleDownloadSample}
        />
      )}
    </div>
  );
}
