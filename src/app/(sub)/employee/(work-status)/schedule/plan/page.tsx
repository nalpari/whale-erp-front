import WorkSchedulePlan from '@/components/employee/work-status/WorkSchedulePlan';
import Location from '@/components/ui/Location';

export default function StoreSchedulePlanPage() {
  return (
    <div className="data-wrap">
      <Location
        title="매장별 근무 계획 수립"
        list={['Home', '직원 관리', '근무 현황', '매장별 근무 계획 수립']}
      />
      <WorkSchedulePlan />
    </div>
  );
}
