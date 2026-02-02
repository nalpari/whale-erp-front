import AnimateHeight from 'react-animate-height'
import { WorkHoursTable } from '@/components/store/manage/WorkHoursTable'
import type { OperatingDayType, OperatingFormState, StoreFormState, WeekdayKey } from '@/types/store'

// 점포 운영시간 섹션 UI 전용 props
interface StoreDetailOperatingHoursProps {
  isOpen: boolean
  formState: StoreFormState
  weekdayKeys: WeekdayKey[]
  toWeekdayLabel: (day: WeekdayKey) => string
  onToggleOpen: () => void
  onOperatingChange: (dayType: OperatingDayType, next: Partial<OperatingFormState>) => void
  onWeekdayToggle: (day: WeekdayKey) => void
  onHoliday: () => void
}

// 평일/토/일 운영/휴게 시간 입력 섹션
export const StoreDetailOperatingHours = ({
  isOpen,
  formState,
  weekdayKeys,
  toWeekdayLabel,
  onToggleOpen,
  onOperatingChange,
  onWeekdayToggle,
  onHoliday,
}: StoreDetailOperatingHoursProps) => (
  <div className={`slidebox-wrap ${isOpen ? '' : 'close'}`} style={{ marginTop: '12px' }}>
    <div className="slidebox-header">
      <h2>점포 운영시간 정보</h2>
      <div className="slidebox-btn-wrap">
        <button className="slidebox-btn arr" onClick={onToggleOpen}>
          <i className="arr-icon"></i>
        </button>
      </div>
    </div>
    <AnimateHeight duration={300} height={isOpen ? 'auto' : 0}>
      <div className="slidebox-body">
        <table className="default-table">
          <colgroup>
            <col width="160px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>평일 오픈 시간</th>
              <td>
                <WorkHoursTable
                  idPrefix="weekday"
                  openTime={formState.operating.WEEKDAY.openTime}
                  closeTime={formState.operating.WEEKDAY.closeTime}
                  breakStartTime={formState.operating.WEEKDAY.breakStartTime}
                  breakEndTime={formState.operating.WEEKDAY.breakEndTime}
                  isOperating={formState.operating.WEEKDAY.isOperating}
                  breakTimeEnabled={formState.operating.WEEKDAY.breakTimeEnabled}
                  onChange={(next) => onOperatingChange('WEEKDAY', next)}
                />

                <div className="filed-flx g8" style={{ marginTop: '10px' }}>
                  {weekdayKeys.map((day) => (
                    <button
                      key={day}
                      className={`day-btn ${formState.weekDaySelections[day] ? 'act' : ''}`}
                      type="button"
                      onClick={() => onWeekdayToggle(day)}
                    >
                      {toWeekdayLabel(day)}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
            <tr>
              <th>토요일 오픈 시간</th>
              <td>
                <WorkHoursTable
                  idPrefix="saturday"
                  openTime={formState.operating.SATURDAY.openTime}
                  closeTime={formState.operating.SATURDAY.closeTime}
                  breakStartTime={formState.operating.SATURDAY.breakStartTime}
                  breakEndTime={formState.operating.SATURDAY.breakEndTime}
                  isOperating={formState.operating.SATURDAY.isOperating}
                  breakTimeEnabled={formState.operating.SATURDAY.breakTimeEnabled}
                  onChange={(next) => onOperatingChange('SATURDAY', next)}
                />
              </td>
            </tr>
            <tr>
              <th>일요일 오픈 시간</th>
              <td>
                <WorkHoursTable
                  idPrefix="sunday"
                  openTime={formState.operating.SUNDAY.openTime}
                  closeTime={formState.operating.SUNDAY.closeTime}
                  breakStartTime={formState.operating.SUNDAY.breakStartTime}
                  breakEndTime={formState.operating.SUNDAY.breakEndTime}
                  isOperating={formState.operating.SUNDAY.isOperating}
                  breakTimeEnabled={formState.operating.SUNDAY.breakTimeEnabled}
                  onChange={(next) => onOperatingChange('SUNDAY', next)}
                />
              </td>
            </tr>
            <tr>
              <th>정기 휴일</th>
              <td>
                <div className="filed-flx g8">
                  <button className="btn-form outline" type="button" onClick={onHoliday}>
                    휴일관리로 이동
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AnimateHeight>
  </div>
)
