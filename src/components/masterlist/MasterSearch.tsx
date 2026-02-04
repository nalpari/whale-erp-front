'use client'
import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import DatePicker from '../ui/common/DatePicker'

export default function MasterSearch() {
  const [searchOpen, setSearchOpen] = useState(true)
  return (
    <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
      <div className="invite-btn al-r mb10">
        <button className="btn-form basic">가맹점 초대</button>
      </div>
      <div className="search-result-wrap">
        <div className="search-result">
          검색결과 <span>128건</span>
        </div>
        <ul className="search-result-list">
          <li></li>
        </ul>
        <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)}></button>
      </div>
      <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
        <div className="search-filed">
          <table className="default-table">
            <colgroup>
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
              <col width="120px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>본사</th>
                <td>
                  <div className="data-filed">
                    <select name="" id="" className="select-form">
                      <option value="">전체</option>
                    </select>
                  </div>
                </td>
                <th>가맹점</th>
                <td>
                  <div className="data-filed">
                    <select name="" id="" className="select-form">
                      <option value="">전체</option>
                    </select>
                  </div>
                </td>
                <th>대표자명</th>
                <td>
                  <div className="data-filed">
                    <input type="text" className="input-frame" />
                  </div>
                </td>
              </tr>
              <tr>
                <th>운영여부</th>
                <td>
                  <div className="filed-check-flx">
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-all" />
                      <label htmlFor="status-all">전체</label>
                    </div>
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-consulting" />
                      <label htmlFor="status-consulting">상담중</label>
                    </div>
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-active" />
                      <label htmlFor="status-active">운영</label>
                    </div>
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-closed" />
                      <label htmlFor="status-closed">종료</label>
                    </div>
                  </div>
                </td>
                <th>가입 방식</th>
                <td>
                  <div className="filed-check-flx">
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-all" />
                      <label htmlFor="status-all">전체</label>
                    </div>
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-consulting" />
                      <label htmlFor="status-consulting">플랫폼 등록</label>
                    </div>
                    <div className="radio-form-box">
                      <input type="radio" name="status" id="status-active" />
                      <label htmlFor="status-active">직접 가입</label>
                    </div>
                  </div>
                </td>
                <th>임시저장 여부</th>
                <td>
                  <div className="filed-check-flx">
                    <div className="check-form-box">
                      <input type="checkbox" name="tempSave" id="tempSave-all" />
                      <label htmlFor="tempSave-all">전체</label>
                    </div>
                    <div className="check-form-box">
                      <input type="checkbox" name="tempSave" id="tempSave-consulting" />
                      <label htmlFor="tempSave-consulting">임시저장</label>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th>서비스</th>
                <td>
                  <div className="data-filed">
                    <select name="" id="" className="select-form">
                      <option value="">전체</option>
                    </select>
                  </div>
                </td>
                <th>등록일</th>
                <td colSpan={3}>
                  <div className="date-picker-wrap">
                    <DatePicker />
                    <span>~</span>
                    <DatePicker />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="btn-filed">
            <button className="btn-form gray">닫기</button>
            <button className="btn-form gray">초기화</button>
            <button className="btn-form basic">검색</button>
          </div>
        </div>
      </AnimateHeight>
    </div>
  )
}
