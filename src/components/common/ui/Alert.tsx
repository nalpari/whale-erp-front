'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

/** Alert 타입 */
export type AlertType = 'alert' | 'confirm'

/** Alert 옵션 */
export interface AlertOptions {
  /** 메시지 내용 */
  message: string
  /** 제목 (선택적) */
  title?: string
  /** 확인 버튼 텍스트 */
  confirmText?: string
  /** 취소 버튼 텍스트 (confirm 타입만 해당) */
  cancelText?: string
}

/** Alert 상태 */
interface AlertState extends AlertOptions {
  type: AlertType
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

/** Alert Context 타입 */
interface AlertContextType {
  /** alert 함수 - window.alert 대체 */
  alert: (message: string, options?: Partial<Omit<AlertOptions, 'message'>>) => Promise<void>
  /** confirm 함수 - window.confirm 대체 */
  confirm: (message: string, options?: Partial<Omit<AlertOptions, 'message'>>) => Promise<boolean>
}

const AlertContext = createContext<AlertContextType | null>(null)

/**
 * Alert Provider 컴포넌트
 * - 앱 최상위에 배치하여 전역 alert/confirm 기능 제공
 */
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    type: 'alert',
    isOpen: false,
    message: '',
    title: undefined,
    confirmText: '확인',
    cancelText: '취소',
    resolve: null,
  })

  // resolve 함수를 ref로 관리하여 useCallback 의존성 문제 해결
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const alert = useCallback((message: string, options?: Partial<Omit<AlertOptions, 'message'>>): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve()
      setAlertState({
        type: 'alert',
        isOpen: true,
        message,
        title: options?.title,
        confirmText: options?.confirmText ?? '확인',
        cancelText: '취소',
        resolve: null,
      })
    })
  }, [])

  const confirm = useCallback((message: string, options?: Partial<Omit<AlertOptions, 'message'>>): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setAlertState({
        type: 'confirm',
        isOpen: true,
        message,
        title: options?.title,
        confirmText: options?.confirmText ?? '확인',
        cancelText: options?.cancelText ?? '취소',
        resolve: null,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true)
    resolveRef.current = null
    setAlertState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false)
    resolveRef.current = null
    setAlertState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      {alertState.isOpen && (
        <AlertModal
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          cancelText={alertState.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </AlertContext.Provider>
  )
}

/**
 * Alert 훅
 * - AlertProvider 내부에서만 사용 가능
 */
export function useAlert(): AlertContextType {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider')
  }
  return context
}

/** Alert Modal Props */
interface AlertModalProps {
  type: AlertType
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Alert Modal 컴포넌트
 * - pub 프로젝트의 Alert 스타일 참조
 */
function AlertModal({
  type,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
}: AlertModalProps) {
  return (
    <div className="modal-popup">
      <div className="modal-dialog small">
        <div className="modal-content">
          <div className="modal-body">
            <div className="pop-frame">
              {title && (
                <div className="alert-title font-semibold text-lg mb-2">{title}</div>
              )}
              <div className="alert-txt">
                <span>{message}</span>
              </div>
            </div>
            <div className="pop-btn-content">
              {type === 'confirm' && (
                <button className="btn-form gray" onClick={onCancel}>
                  {cancelText}
                </button>
              )}
              <button className="btn-form basic" onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertModal
