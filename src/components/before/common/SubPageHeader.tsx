import Image from 'next/image'
import Link from 'next/link'

interface SubPageHeaderProps {
  smallTitle?: string
  boldTitle: string
  normalTitle: string
  description: string
  showButtons?: boolean
}

export default function SubPageHeader({
  smallTitle = 'Your Vision, Our Expertise',
  boldTitle,
  normalTitle,
  description,
  showButtons = true,
}: SubPageHeaderProps) {
  return (
    <div className="sub-wrap-header">
      <div className="sub-header-icon">
        <Image
          src="/assets/images/before_main/sub_whale.png"
          alt=""
          aria-hidden="true"
          width={228}
          height={126}
        />
      </div>
      <div className="sub-header-s-tit">{smallTitle}</div>
      <div className="sub-header-b-tit">
        <span className="bold">{boldTitle}</span>
        <span>{normalTitle}</span>
      </div>
      <div className="sub-header-desc">{description}</div>
      {showButtons && (
        <div className="sub-header-btn-wrap">
          <Link href="/login?returnUrl=/customer/rate-plan" className="sub-header-btn free">
            무료로 시작하기 <i className="free-btn-arr" />
          </Link>
          <Link href="/introduction" className="sub-header-btn inquiry">
            <i className="inquiry-icon" /> 도입 문의하기
          </Link>
        </div>
      )}
    </div>
  )
}
