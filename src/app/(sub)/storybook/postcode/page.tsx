'use client'

import { useState } from 'react'
import { AddressSearch, type AddressData } from '@/components/common/ui'

/**
 * AddressSearch 컴포넌트 Storybook 페이지
 * - Daum 우편번호 서비스를 이용한 주소 검색 컴포넌트 예제
 */
export default function PostcodeStorybookPage() {
  // 기본 예제용 상태
  const [basicAddress, setBasicAddress] = useState<AddressData>({
    address: '',
    addressDetail: '',
  })

  // 필수 입력 + 에러 예제용 상태
  const [requiredAddress, setRequiredAddress] = useState<AddressData>({
    address: '',
    addressDetail: '',
  })

  // 값이 있는 예제용 상태
  const [filledAddress, setFilledAddress] = useState<AddressData>({
    address: '경기 성남시 분당구 판교역로 166 (백현동, 카카오 판교 아지트)',
    addressDetail: '1층 로비',
    buildingName: '카카오 판교 아지트',
    roadAddress: '경기 성남시 분당구 판교역로 166',
    jibunAddress: '경기 성남시 분당구 백현동 532',
  })

  // 에러 상태 확인
  const hasRequiredError = !requiredAddress.address

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>AddressSearch 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              Daum 우편번호 서비스를 이용한 주소 검색 컴포넌트 예제입니다.
            </p>
            <p className="text-gray-500 text-sm">
              참고:{' '}
              <a
                href="https://postcode.map.daum.net/guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Daum 우편번호 서비스 가이드
              </a>
            </p>
          </div>
        </div>

        {/* 기본 사용법 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>기본 사용법</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  {/* 1. 기본 주소 검색 */}
                  <tr>
                    <th>기본 주소 검색</th>
                    <td>
                      <AddressSearch
                        value={basicAddress}
                        onChange={setBasicAddress}
                      />
                      {basicAddress.address && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <div><strong>기본주소:</strong> {basicAddress.address}</div>
                          <div><strong>상세주소:</strong> {basicAddress.addressDetail || '-'}</div>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 2. 라벨 + 필수 입력 + 에러 상태 */}
                  <tr>
                    <th>필수 입력 + 에러</th>
                    <td>
                      <AddressSearch
                        label="배송지 주소"
                        required
                        value={requiredAddress}
                        onChange={setRequiredAddress}
                        error={hasRequiredError}
                        helpText={hasRequiredError ? '필수 입력 항목입니다.' : undefined}
                      />
                    </td>
                  </tr>

                  {/* 3. 값이 있는 상태 */}
                  <tr>
                    <th>값이 있는 상태</th>
                    <td>
                      <AddressSearch
                        label="회사 주소"
                        value={filledAddress}
                        onChange={setFilledAddress}
                      />
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <div><strong>도로명 주소:</strong> {filledAddress.roadAddress}</div>
                        <div><strong>지번 주소:</strong> {filledAddress.jibunAddress}</div>
                      </div>
                    </td>
                  </tr>

                  {/* 4. 비활성화 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <AddressSearch
                        label="등록된 주소"
                        value={{
                          address: '서울 강남구 테헤란로 152',
                          addressDetail: '강남파이낸스센터 10층',
                        }}
                        onChange={() => { }}
                        disabled
                      />
                    </td>
                  </tr>

                  {/* 5. Placeholder 커스텀 */}
                  <tr>
                    <th>Placeholder 커스텀</th>
                    <td>
                      <AddressSearch
                        label="점포 주소"
                        value={{ address: '', addressDetail: '' }}
                        onChange={() => { }}
                        addressPlaceholder="주소를 검색해주세요"
                        detailPlaceholder="동/호수 입력"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Props 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Props 설명</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="180px" />
                  <col width="200px" />
                  <col width="150px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>타입</th>
                    <th>기본값</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">value</code></td>
                    <td>AddressData</td>
                    <td>필수</td>
                    <td>현재 주소 데이터 (address, addressDetail)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">onChange</code></td>
                    <td>(data: AddressData) =&gt; void</td>
                    <td>필수</td>
                    <td>주소 변경 핸들러</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">label</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>라벨 텍스트</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">required</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>필수 입력 여부 (라벨에 * 표시)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">error</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>에러 상태</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">helpText</code></td>
                    <td>string</td>
                    <td>-</td>
                    <td>에러 메시지 또는 도움말</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">disabled</code></td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">addressPlaceholder</code></td>
                    <td>string</td>
                    <td>주소를 선택하세요</td>
                    <td>기본 주소 placeholder</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">detailPlaceholder</code></td>
                    <td>string</td>
                    <td>상세 주소를 입력하세요</td>
                    <td>상세 주소 placeholder</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AddressData 타입 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>AddressData 타입</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="180px" />
                  <col width="150px" />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>필드</th>
                    <th>타입</th>
                    <th>설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">address</code></td>
                    <td>string</td>
                    <td>기본 주소 (도로명 또는 지번)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">addressDetail</code></td>
                    <td>string</td>
                    <td>상세 주소 (사용자 입력)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">zonecode</code></td>
                    <td>string (optional)</td>
                    <td>우편번호 (내부 저장용)</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">buildingName</code></td>
                    <td>string (optional)</td>
                    <td>건물명</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">roadAddress</code></td>
                    <td>string (optional)</td>
                    <td>도로명 주소</td>
                  </tr>
                  <tr>
                    <td><code className="bg-gray-100 px-1 rounded">jibunAddress</code></td>
                    <td>string (optional)</td>
                    <td>지번 주소</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 사용 예시 코드 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>사용 예시</h2>
          </div>
          <div className="slidebox-body">
            <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-100">
                {`import { useState } from 'react'
import { AddressSearch, type AddressData } from '@/components/common/ui'

export default function MyForm() {
  const [address, setAddress] = useState<AddressData>({
    address: '',
    addressDetail: '',
  })

  const handleSubmit = () => {
    // 전체 주소: address.address + ' ' + address.addressDetail
    console.log('기본주소:', address.address)
    console.log('상세주소:', address.addressDetail)
  }

  return (
    <AddressSearch
      label="배송지 주소"
      required
      value={address}
      onChange={setAddress}
      error={!address.address}
      helpText={!address.address ? '필수 입력 항목입니다.' : undefined}
    />
  )
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
