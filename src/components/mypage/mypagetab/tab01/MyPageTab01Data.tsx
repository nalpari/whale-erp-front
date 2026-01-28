import Image from "next/image";

export default function MyPageTab01Data({ setEditMode }: { setEditMode: (editMode: boolean) => void }) {
  return (
    <div className="mypage-data-wrap">
      <div className="mypage-data-info">
        <div className="mypage-img">
          <Image src="/assets/images/ui/avatar01.svg" alt="mypage-img" width={64} height={64} />
        </div>
        <div className="mypage-info">
          <div className="mypage-name">안녕하세요, 김철수님</div>
          <div className="mypage-info-wrap">
            <div className="my-id">
              <span className="id-tit">Master ID</span>
              <span className="id-data">Hc-1234567</span>
            </div>
            <div className="mypage-info-badge">
              <button className="id-copy">ID 복사</button>
              <span className="badge blue">운영</span>
              <span className="badge grey">본점</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mypage-data-table-wrap">
        <table className="mypage-data-table">
          <colgroup>
            <col width="180px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>회사명</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">주식회사 따름인</span>
                  </li>
                  <li className="data-item">
                    <span className="data-text">을지로3가점</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>브랜드명</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">힘이나는커피생활 을지로3가점</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>사업자등록번호</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">105-87-123450</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">서울 중구 삼봉로98, 1층 2호</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>휴대폰번호</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">010-2222-4444</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>이메일</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">abc@abc.co.kr</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>영업분류</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">일반음식점</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>로고등록</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <button className="data-btn">힘이나는커피생활CI.pdf</button>
                  </li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mypage-footer">
        <button className="btn-form basic" onClick={() => setEditMode(true)}>정보 수정</button>
      </div>
    </div>
  )
}