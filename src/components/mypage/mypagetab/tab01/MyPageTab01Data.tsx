'use client'
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { useCommonCodeHierarchy } from "@/hooks/queries/use-common-code-queries";
import type { BpDetailResponse } from "@/types/bp";

interface MyPageTab01DataProps {
  bp: BpDetailResponse
  setEditMode: (editMode: boolean) => void
}

/**
 * 사업자정보 조회 화면.
 * - BP 데이터와 auth store의 사용자 정보를 결합하여 표시한다.
 */
export default function MyPageTab01Data({ bp, setEditMode }: MyPageTab01DataProps) {
  const { avatar, name, loginId } = useAuthStore()

  // 공통코드로 bpoprType, bpType 한글명 조회
  const { data: bpoprCodes = [] } = useCommonCodeHierarchy('BPOPR')
  const { data: bpTypeCodes = [] } = useCommonCodeHierarchy('BPTYP')

  const bpoprName = bpoprCodes.find((c) => c.code === bp.bpoprType)?.name ?? bp.bpoprType
  const bpTypeName = bpTypeCodes.find((c) => c.code === bp.bpType)?.name ?? bp.bpType ?? '-'
  const organizationTypeName = bp.organizationType === 'HEAD_OFFICE' ? '본점' : '가맹점'
  const avatarSrc = avatar
    ? `/assets/images/ui/avatar0${avatar}.svg`
    : '/assets/images/ui/avatar01.svg'
  const fullAddress = [bp.address1, bp.address2].filter(Boolean).join(', ')

  const handleCopyId = async () => {
    const idToCopy = bp.masterId ?? loginId
    if (!idToCopy) return
    try {
      await navigator.clipboard.writeText(idToCopy)
    } catch {
      // 클립보드 API 미지원 환경 (HTTP, 권한 거부 등) — 무시
    }
  }

  return (
    <div className="mypage-data-wrap">
      <div className="mypage-data-info">
        <div className="mypage-img">
          <Image src={avatarSrc} alt="mypage-img" width={64} height={64} />
        </div>
        <div className="mypage-info">
          <div className="mypage-name">안녕하세요, {name ?? '-'}님</div>
          <div className="mypage-info-wrap">
            <div className="my-id">
              <span className="id-tit">Master ID</span>
              <span className="id-data">{bp.masterId ?? loginId ?? '-'}</span>
            </div>
            <div className="mypage-info-badge">
              <button className="id-copy" onClick={handleCopyId}>ID 복사</button>
              <span className="badge blue">{bpoprName}</span>
              <span className="badge grey">{organizationTypeName}</span>
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
                    <span className="data-text">{bp.companyName}</span>
                  </li>
                  {bp.franchiseStoreName && (
                    <li className="data-item">
                      <span className="data-text">{bp.franchiseStoreName}</span>
                    </li>
                  )}
                </ul>
              </td>
            </tr>
            <tr>
              <th>브랜드명</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">{bp.brandName || '-'}</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>사업자등록번호</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">{formatBusinessNumber(bp.businessRegistrationNumber)}</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">{fullAddress || '-'}</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>휴대폰번호</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">{formatPhoneNumber(bp.representativeMobilePhone) || '-'}</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>이메일</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">{bp.representativeEmail || '-'}</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>영업분류</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    <span className="data-text">{bpTypeName}</span>
                  </li>
                </ul>
              </td>
            </tr>
            <tr>
              <th>로고등록</th>
              <td>
                <ul className="data-list">
                  <li className="data-item">
                    {bp.lnbLogoExpandFile?.publicUrl ? (
                      <button
                        className="data-btn"
                        onClick={() => window.open(bp.lnbLogoExpandFile!.publicUrl, '_blank')}
                      >
                        {bp.lnbLogoExpandFile.originalFileName}
                      </button>
                    ) : (
                      <span className="data-text">-</span>
                    )}
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

/** 사업자등록번호 포맷 (1234567890 -> 123-45-67890) */
function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }
  return value
}

/** 휴대폰번호 포맷 (01012345678 -> 010-1234-5678) */
function formatPhoneNumber(value: string | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return value
}
