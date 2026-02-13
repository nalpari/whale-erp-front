export default function PersonalinformationConset({
  setPersonalinformationConset,
}: {
  setPersonalinformationConset: (conset: boolean) => void
}) {
  return (
    <div className="personalinformation-wrap">
      <div className="personalinformation-inner">
        <div className="personalinformation-tit">개인정보 수집 및 이용 동의</div>
        <div className="personalinformation-content">
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-top">
              <span>㈜인터플러그는 서비스 도입 문의 및 상담을 위해 개인정보를 수집·이용합니다.</span>
              <span>수집한 개인정보는 아래에 명시한 목적 외의 용도로는 이용되지 않습니다.</span>
            </div>
          </div>
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-tit">1. 수집하는 개인정보 항목</div>
            <div className="personalinformation-content-item-desc">
              <span>이름 / 휴대전화번호 /이메일 주소</span>
            </div>
          </div>
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-tit">2. 개인정보 수집·이용 목적</div>
            <div className="personalinformation-content-item-desc">
              <span>귀하의 개인정보는 서비스 제공 및 이용에 관한 상담 업무 처리를 위해 이용됩니다.</span>
              <span>- 서비스 도입 문의 접수 및 상담 응대</span>
              <span>- 견적 안내 및 관련 안내사항 전달</span>
            </div>
          </div>
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-tit">3. 개인정보 보유 및 이용기간</div>
            <div className="personalinformation-content-item-desc">
              <span>문의 처리 완료 후 6개월간 보관 후 지체 없이 파기됩니다.</span>
              <span>단, 관련 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</span>
            </div>
          </div>
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-tit">4. 개인정보 보호 책임자 및 문의처</div>
            <div className="personalinformation-content-item-desc">
              <span>
                <b>㈜인터플러그</b>는 개인정보 보호책임자를 지정하고 있으며, 문의처는 아래와 같습니다.
              </span>
            </div>
            <ul className="personalinformation-content-item-list">
              <li className="personalinformation-content-item-list-item">- 개인정보 보호책임자 : 이 현 호</li>
              <li className="personalinformation-content-item-list-item">- 소속: ㈜인터플러그</li>
              <li className="personalinformation-content-item-list-item">- 전화: 010-0000-0000</li>
              <li className="personalinformation-content-item-list-item">- 이메일: 0000@interplug.co.kr</li>
            </ul>
          </div>
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-tit">5. 개인정보 수집·이용 동의 거부 및 철회</div>
            <div className="personalinformation-content-item-desc">
              <span>귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.</span>
              <span>다만, 동의를 거부할 경우 서비스 도입 문의 접수 및 상담이 제한될 수 있습니다.</span>
              <span>동의 철회를 원하실 경우, 개인정보 보호책임자에게 전화 또는 이메일로 연락 주시면</span>
              <span>지체 없이 개인정보 삭제 등 필요한 조치를 취하겠습니다.</span>
            </div>
          </div>
          <div className="personalinformation-content-item">
            <div className="personalinformation-content-item-desc">
              <span>본인은 위 내용을 충분히 이해하였으며, 개인정보 수집·이용에 동의합니다.</span>
            </div>
          </div>
        </div>
        <div className="personalinformation-btn-wrap">
          <button className="introduction-btn" onClick={() => setPersonalinformationConset(false)}>
            돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
