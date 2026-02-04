'use client'

import Link from 'next/link'

const routes = [
  { path: '/storybook/input', name: 'Input', description: '텍스트 입력 컴포넌트', icon: '📝' },
  { path: '/storybook/datepicker', name: 'DatePicker', description: '날짜 선택 컴포넌트', icon: '📅' },
  { path: '/storybook/editor', name: 'Editor', description: '리치 텍스트 에디터', icon: '✏️' },
  { path: '/storybook/upload', name: 'File Upload', description: '파일 업로드 컴포넌트', icon: '📎' },
  { path: '/storybook/image-upload', name: 'Image Upload', description: '이미지 업로드 컴포넌트', icon: '🖼️' },
  { path: '/storybook/postcode', name: 'Postcode', description: '우편번호/주소 검색', icon: '📍' },
  { path: '/storybook/radio', name: 'Radio', description: '버튼형 라디오 그룹', icon: '🔘' },
  { path: '/storybook/search-select', name: 'Search Select', description: '검색 셀렉트 컴포넌트', icon: '🔍' },
]

export default function StorybookIndexPage() {
  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>Storybook Components</h2>
          </div>
          <div className="slidebox-body">
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
              공통 컴포넌트 데모 페이지입니다. 아래 버튼을 클릭하면 해당 컴포넌트의 상세 예제를 확인할 수 있습니다.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {routes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#5e8ce9'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 140, 233, 0.15)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <span style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {route.icon}
                  </span>
                  <span style={{ fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                    {route.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                    {route.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
