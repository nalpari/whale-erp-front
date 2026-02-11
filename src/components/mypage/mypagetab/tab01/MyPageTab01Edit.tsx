'use client'
import Image from "next/image";
import { Tooltip } from "react-tooltip";

export default function MyPageTab01Edit({ setEditMode }: { setEditMode: (editMode: boolean) => void }) {
  return (
    <div className="mypage-frame-wrap">
      <div className="mypage-frame-tit">
        <h2>사업자정보 수정</h2>
      </div>
      <div className="mypage-frame-content">
        <table className="default-table">
          <colgroup>
            <col width="190px" />
            <col /> 
          </colgroup>
          <tbody>
            <tr>
              <th>아이콘<span className="red">*</span></th>
              <td>
                <div className="select-avatar ">
                  <button className="avatar-btn check">
                    <Image src="/assets/images/ui/avatar01.svg" alt="avatar" width={46} height={46} />
                  </button>
                  <button className="avatar-btn">
                    <Image src="/assets/images/ui/avatar02.svg" alt="avatar" width={46} height={46} />
                  </button>
                  <button className="avatar-btn">
                    <Image src="/assets/images/ui/avatar03.svg" alt="avatar" width={46} height={46} />
                  </button>
                  <button className="avatar-btn">
                    <Image src="/assets/images/ui/avatar04.svg" alt="avatar" width={46} height={46} />
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                대표자명
              </th>
              <td>
                <div className="mx-500">
                  <input type="text" className="input-frame" readOnly defaultValue="김철수"/>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                회사명 <span className="red">*</span>
              </th>
              <td>
                <div className="filed-flx">
                  <div className="mx-500">
                    <input type="text" className="input-frame" />
                  </div>
                  <span className="explain">BMI1234</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                브랜드명
              </th>
              <td>
                <div className="mx-500">
                  <input type="text" className="input-frame" />
                </div>
              </td>
            </tr>
            <tr>
              <th>
                사업자등록번호<span className="red">*</span>
              </th>
              <td>
                <div className="filed-flx">
                  <div className="mx-500">
                    <input type="text" className="input-frame" />
                  </div>
                  <span className="explain">※ 숫자만 허용</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                브랜드명
              </th>
              <td>
                <div className="mx-500">
                  <input type="text" className="input-frame" />
                </div>
              </td>
            </tr>
            <tr>
              <th>
                주소<span className="red">*</span>
              </th>
              <td>
                <div className="filed-btn mb10">
                  <button className="btn-form outline s">주소 찾기</button>
                </div>
                <div className="filed-flx">
                  <div className="block">
                    <input type="text" className="input-frame" disabled placeholder="(우편번호) 도로명/지번"/>
                  </div>
                  <div className="block">
                    <input type="text" className="input-frame" placeholder="상세주소"/>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                휴대폰 번호<span className="red">*</span>
              </th>
              <td>
                <div className="filed-flx">
                  <div className="mx-500">
                    <input type="text" className="input-frame" />
                  </div>
                  <span className="explain">※ 숫자만 허용</span>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                이메일 <span className="red">*</span>
              </th>
              <td>
                <div className="mx-500">
                  <input type="text" className="input-frame" />
                </div>
              </td>
            </tr>
            <tr>
              <th>
                BP 타입<span className="red">*</span>
              </th>
              <td>
                <div className="mx-500">
                  <select name="" id="" className="select-form">
                    <option value="">전체</option>
                  </select>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                LNB 로고<br/>
                (권장 사이즈 00 * 00)
              </th>
              <td>
                <div className="filed-file mb10">
                  <input type="file" className="file-input" id="file-input" />
                  <label htmlFor="file-input" className="btn-form outline s">
                    파일 찾기
                  </label>
                </div>
                <div className="file-bx">
                  <div className="file-guide">Drag & Drop으로 파일을 옮겨주세요.</div>
                  <ul className="file-list">
                    <li className="file-item">
                      <div className="file-item-wrap">
                        <button className="file-name">코튼크림 신메뉴 포스터이미지.jpg</button>
                        <button className="file-delete"></button>
                        <button className="file-preview"></button>
                        <button className="tooltip-btn">
                          <span className="tooltip-icon" id="tooltip-btn-anchor"></span>
                          <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor" opacity={1}>
                            <div>로고 이미지를 등록하시면 로그인 했을 때 로고를 상단(네비게이션 바)에 표시할 수 있습니다.</div>
                          </Tooltip>
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mypage-footer">
        <button className="btn-form gray" onClick={() => setEditMode(false)}>취소</button>
        <button className="btn-form basic">저장</button>
      </div>
    </div>
  )
}