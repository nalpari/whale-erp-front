'use client'

import { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { useStoreOptions, useSyncMenuToStores } from '@/hooks/queries'
import { useAlert } from '@/components/common/ui'
import { getErrorMessage } from '@/lib/api'
import type { StoreOption } from '@/types/store'

interface AddStoreMenuPopProps {
  isOpen: boolean
  onClose: () => void
  onSyncSuccess?: () => void
  bpId: number
  checkedMenuIds: number[]
}

export default function AddStoreMenuPop({ isOpen, onClose, onSyncSuccess, bpId, checkedMenuIds }: AddStoreMenuPopProps) {
  const [syncOption, setSyncOption] = useState<'selected' | 'all'>('selected')
  const [operationStatus, setOperationStatus] = useState<'STOPR_001' | 'STOPR_002'>('STOPR_002')
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [isAllStores, setIsAllStores] = useState(false)
  const [addedStores, setAddedStores] = useState<StoreOption[]>([])

  const { data: storeOptions = [] } = useStoreOptions(bpId, null, isOpen)
  const { mutateAsync: syncMenuToStores } = useSyncMenuToStores()
  const { alert, confirm } = useAlert()

  if (!isOpen) return null

  const availableStores = storeOptions.filter(
    (s) => !addedStores.some((added) => added.id === s.id)
  )

  const hasStores = isAllStores ? storeOptions.length > 0 : addedStores.length > 0

  const handleAddStore = () => {
    if (!selectedStoreId) return
    if (selectedStoreId === 'all') {
      setIsAllStores(true)
      setAddedStores([])
      setSelectedStoreId('')
      return
    }
    const store = storeOptions.find((s) => s.id === Number(selectedStoreId))
    if (!store) return
    if (addedStores.some((s) => s.id === store.id)) return
    setAddedStores((prev) => [...prev, store])
    setSelectedStoreId('')
  }

  const handleRemoveAllStores = () => {
    setIsAllStores(false)
  }

  const handleRemoveStore = (storeId: number) => {
    setAddedStores((prev) => prev.filter((s) => s.id !== storeId))
  }

  const handleSync = async () => {
    const confirmed = await confirm('선택한 점포에 메뉴를 동기화하시겠습니까?')
    if (!confirmed) return

    try {
      await syncMenuToStores({
        bpId,
        menuIds: syncOption === 'all' ? null : checkedMenuIds,
        storeIds: isAllStores
          ? storeOptions.map((s) => s.id)
          : addedStores.map((s) => s.id),
        operationStatus,
      })
      await alert('동기화가 완료되었습니다.')
      onSyncSuccess?.()
      handleClose()
    } catch (error) {
      await alert(getErrorMessage(error, '동기화에 실패했습니다.'))
    }
  }

  const handleClose = () => {
    setSyncOption('selected')
    setOperationStatus('STOPR_002')
    setSelectedStoreId('')
    setIsAllStores(false)
    setAddedStores([])
    onClose()
  }

  return (
    <div className="modal-popup" style={{ zIndex: 9000 }}>
      <div className="modal-dialog large">
        <div className="modal-content">
          <div className="modal-header">
            <h2>점포 메뉴 추가</h2>
            <button className="modal-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="pop-guide">
              선택한 마스터용 메뉴 또는 모든 마스터용 메뉴를 점포용 메뉴로 추가할 수 있습니다.
              <br /> 추가를 진행할 점포를 선택해 주세요.
            </div>
            <table className="pop-table">
              <colgroup>
                <col width="120px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>
                    옵션 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="radio-wrap">
                        <button
                          className={`radio-btn${syncOption === 'selected' ? ' act' : ''}`}
                          onClick={() => setSyncOption('selected')}
                        >
                          선택한 메뉴만 추가
                        </button>
                        <button
                          className={`radio-btn${syncOption === 'all' ? ' act' : ''}`}
                          onClick={() => setSyncOption('all')}
                        >
                          모든 마스터 메뉴 추가
                        </button>
                      </div>
                      <button className="tooltip-btn">
                        <span className="tooltip-icon" id="tooltip-btn-anchor-option"></span>
                        <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor-option" opacity={1}>
                          <h4>1. 선택한 메뉴만 추가</h4>
                          <div>리스트에서 선택한 메뉴만 점포용 메뉴에 추가합니다.</div>
                          <h4>2. 모든 마스터 메뉴 추가</h4>
                          <div>
                            리스트에서 선택한 메뉴와 상관없이 사업자가 등록한 모든 마스터용 메뉴를 점포용 메뉴에
                            추가합니다.
                          </div>
                        </Tooltip>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>운영여부 선택</th>
                  <td>
                    <div className="filed-flx">
                      <div className="radio-wrap">
                        <button
                          className={`radio-btn${operationStatus === 'STOPR_001' ? ' act' : ''}`}
                          onClick={() => setOperationStatus('STOPR_001')}
                        >
                          운영
                        </button>
                        <button
                          className={`radio-btn${operationStatus === 'STOPR_002' ? ' act' : ''}`}
                          onClick={() => setOperationStatus('STOPR_002')}
                        >
                          미운영
                        </button>
                      </div>
                      <button className="tooltip-btn">
                        <span className="tooltip-icon" id="tooltip-btn-anchor-operation"></span>
                        <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor-operation" opacity={1}>
                          <div>점포용 메뉴를 생성할 때 생성 후 바로 사용할 수 있는지 여부를 선택합니다.</div>
                          <div>&apos;운영&apos;으로 체크하시면 점포용 메뉴가 생성 후 바로 고객의 APP에 노출됩니다.</div>
                        </Tooltip>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    점포 선택<span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="block">
                        <select
                          className="select-form"
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          disabled={isAllStores}
                        >
                          <option value="">점포를 선택하세요</option>
                          <option value="all">전체 점포</option>
                          {availableStores.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.storeName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button className="btn-form outline s" onClick={handleAddStore}>
                        추가
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <ul className="add-store-list">
              {isAllStores ? (
                <li className="add-store-list-item">
                  <span>전체 점포</span>
                  <button className="file-delete" onClick={handleRemoveAllStores}></button>
                </li>
              ) : (
                addedStores.map((store) => (
                  <li key={store.id} className="add-store-list-item">
                    <span>{store.storeName}</span>
                    <button className="file-delete" onClick={() => handleRemoveStore(store.id)}></button>
                  </li>
                ))
              )}
            </ul>
            <div className="pop-btn-content">
              <button className="btn-form gray" onClick={handleClose}>
                취소
              </button>
              <button className="btn-form basic" onClick={handleSync} disabled={!hasStores}>
                동기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
