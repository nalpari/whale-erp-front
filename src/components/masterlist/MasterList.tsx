'use client'
import { Tooltip } from 'react-tooltip'
import AgGrid from '../ui/AgGrid'
import Pagination from '../ui/Pagination'

export default function MasterList() {
  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          <button className="btn-form outline">등록</button>
          <button className="btn-form basic">등록</button>
          <button className="btn-form gray">등록</button>
          <button className="tooltip-btn">
            <span className="tooltip-icon" id="tooltip-btn-anchor"></span>
            <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor">
              <div>브랜드명 설명브랜드명 </div>
              <div>설명브랜드명 설명브랜드명 설명브랜드명 설명</div>
            </Tooltip>
          </button>
        </div>
        <div className="data-header-right">
          <button className="btn-form basic">등록</button>
          <div className="data-count-select">
            <select name="" id="" className="select-form">
              <option value="">10</option>
              <option value="">20</option>
              <option value="">30</option>
              <option value="">40</option>
              <option value="">50</option>
            </select>
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        <AgGrid />
        <Pagination />
      </div>
    </div>
  )
}
