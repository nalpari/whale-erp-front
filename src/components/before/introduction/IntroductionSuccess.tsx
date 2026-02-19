export default function IntroductionSuccess({ name }: { name: string }) {
  return (
    <div className="introduction-success-wrap">
      <div className="introduction-success-inner">
        <div className="introduction-name">{name} 님</div>
        <div className="introduction-txt ">도입 문의가 성공적으로 접수되었습니다.</div>
        <div className="introduction-txt mt15">검토 후 입력해 주신 이메일 또는 휴대전화번호로 연락 드리겠습니다.</div>
        <div className="introduction-txt mt15">감사합니다.</div>
      </div>
    </div>
  )
}
