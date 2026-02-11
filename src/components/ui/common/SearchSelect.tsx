'use client'

import { useState, useId } from 'react'
import Select, {
  type SingleValue,
  type MultiValue,
  type StylesConfig,
  type GroupBase,
} from 'react-select'

export interface SelectOption {
  value: string
  label: string
}

interface SearchSelectBaseProps {
  /** 선택 옵션 목록 */
  options: SelectOption[]
  /** placeholder 텍스트 */
  placeholder?: string
  /** 비활성화 여부 */
  isDisabled?: boolean
  /** 로딩 상태 */
  isLoading?: boolean
  /** 선택값 초기화 가능 여부 */
  isClearable?: boolean
  /** 검색 가능 여부 */
  isSearchable?: boolean
  /** 검색 결과 없음 메시지 */
  noOptionsMessage?: string
  /** 라벨 (선택) */
  label?: string
  /** 필수 입력 여부 */
  required?: boolean
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean
  /** 추가 클래스명 */
  className?: string
  /** 에러 상태 여부 (빨간 테두리 표시) */
  error?: boolean
}

interface SingleSelectProps extends SearchSelectBaseProps {
  /** 다중 선택 여부 */
  isMulti?: false
  /** 선택된 값 */
  value?: SelectOption | null
  /** 값 변경 핸들러 */
  onChange?: (value: SelectOption | null) => void
}

interface MultiSelectProps extends SearchSelectBaseProps {
  /** 다중 선택 여부 */
  isMulti: true
  /** 선택된 값 */
  value?: SelectOption[]
  /** 값 변경 핸들러 */
  onChange?: (value: SelectOption[]) => void
}

type SearchSelectProps = SingleSelectProps | MultiSelectProps

const getCustomStyles = (hasError: boolean): StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> => ({
  control: (base, state) => ({
    ...base,
    minHeight: '36px',
    borderColor: hasError ? '#dc3545' : state.isFocused ? '#3b82f6' : '#d1d5db',
    boxShadow: hasError
      ? '0 0 0 1px #dc3545'
      : state.isFocused
        ? '0 0 0 1px #3b82f6'
        : 'none',
    '&:hover': {
      borderColor: hasError ? '#dc3545' : state.isFocused ? '#3b82f6' : '#9ca3af',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 8px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '6px',
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: '6px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
        ? '#eff6ff'
        : 'white',
    color: state.isSelected ? 'white' : '#1f2937',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? '#3b82f6' : '#dbeafe',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#eff6ff',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1d4ed8',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#1d4ed8',
    '&:hover': {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
  }),
})

export default function SearchSelect(props: SearchSelectProps) {
  const {
    options,
    placeholder = '선택',
    isDisabled = false,
    isLoading = false,
    isClearable = true,
    isSearchable = true,
    noOptionsMessage = '검색 결과가 없습니다',
    label,
    required = false,
    fullWidth = false,
    className = '',
    error = false,
  } = props

  const instanceId = useId()
  const [internalValue, setInternalValue] = useState<SelectOption | SelectOption[] | null>(
    props.isMulti ? [] : null
  )

  const isControlled = props.value !== undefined
  const currentValue = isControlled ? props.value : internalValue

  const handleChange = (
    newValue: SingleValue<SelectOption> | MultiValue<SelectOption>
  ) => {
    if (props.isMulti) {
      const multiValue = newValue as MultiValue<SelectOption>
      const valueArray = multiValue ? [...multiValue] : []
      if (!isControlled) {
        setInternalValue(valueArray)
      }
      props.onChange?.(valueArray)
    } else {
      const singleValue = newValue as SingleValue<SelectOption>
      if (!isControlled) {
        setInternalValue(singleValue)
      }
      ;(props as SingleSelectProps).onChange?.(singleValue)
    }
  }

  const containerStyle: React.CSSProperties = fullWidth
    ? { width: '100%' }
    : { minWidth: '200px' }

  return (
    <div className={`search-select-wrapper ${className}`} style={containerStyle}>
      {label && (
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor={instanceId}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <Select<SelectOption, boolean>
        instanceId={instanceId}
        inputId={instanceId}
        options={options}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isMulti={props.isMulti}
        noOptionsMessage={() => noOptionsMessage}
        styles={getCustomStyles(error)}
        classNamePrefix="search-select"
      />
    </div>
  )
}
