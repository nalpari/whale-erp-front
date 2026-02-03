'use client'

import { useState, useCallback } from 'react'
import { ImageUpload, type ImageItem } from '@/components/common/ui'

/**
 * ImageUpload 컴포넌트 Storybook 페이지
 * - 이미지 업로드 컴포넌트 예제
 * - 드래그&드랍으로 순서 변경 가능
 */
export default function ImageUploadStorybookPage() {
  // 기본 예제용 상태
  const [basicImages, setBasicImages] = useState<ImageItem[]>([])

  // 다중 이미지 예제용 상태
  const [multipleImages, setMultipleImages] = useState<ImageItem[]>([])

  // 순서 변경 가능한 예제용 상태
  const [reorderableImages, setReorderableImages] = useState<ImageItem[]>([])

  // 에러 상태 예제용
  const [requiredImages, setRequiredImages] = useState<ImageItem[]>([])

  // 값이 있는 예제용 상태
  const [filledImages, setFilledImages] = useState<ImageItem[]>([
    { id: 1, name: '매장 외관.jpg', url: 'https://via.placeholder.com/200x200?text=Image+1' },
    { id: 2, name: '매장 내부.jpg', url: 'https://via.placeholder.com/200x200?text=Image+2' },
  ])

  // 이미지 추가 핸들러
  const handleAddImages = useCallback(
    (
      newFiles: File[],
      currentImages: ImageItem[],
      setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>
    ) => {
      const imageItems: ImageItem[] = newFiles.map((file) => ({
        name: file.name,
        file,
        type: file.type,
        size: file.size,
      }))
      setImages([...currentImages, ...imageItems])
    },
    []
  )

  // 이미지 삭제 핸들러
  const handleRemoveImage = useCallback(
    (
      index: number,
      currentImages: ImageItem[],
      setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>
    ) => {
      setImages(currentImages.filter((_, i) => i !== index))
    },
    []
  )

  // 이미지 순서 변경 핸들러
  const handleReorderImages = useCallback(
    (
      newOrder: ImageItem[],
      setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>
    ) => {
      setImages(newOrder)
    },
    []
  )

  // 이미지 클릭 핸들러
  const handleImageClick = useCallback((image: ImageItem, index: number) => {
    if (image.file) {
      // 새 이미지인 경우 다운로드
      const url = URL.createObjectURL(image.file)
      const a = document.createElement('a')
      a.href = url
      a.download = image.name
      a.click()
      URL.revokeObjectURL(url)
    } else if (image.url) {
      // 기존 이미지인 경우 새 창에서 열기
      window.open(image.url, '_blank', 'noopener,noreferrer')
    } else {
      alert(`이미지 클릭: ${image.name}`)
    }
  }, [])

  return (
    <div className="data-wrap">
      <div className="master-detail-data">
        {/* 페이지 헤더 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>ImageUpload 컴포넌트</h2>
          </div>
          <div className="slidebox-body">
            <p className="text-gray-600 mb-4">
              이미지 업로드 공통 컴포넌트 예제입니다. 박스를 클릭하거나 이미지를 드래그하세요.
              <br />
              이미지 썸네일을 드래그하여 순서를 변경할 수 있습니다.
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
                  {/* 1. 기본 이미지 업로드 (단일) */}
                  <tr>
                    <th>단일 이미지 업로드</th>
                    <td>
                      <ImageUpload
                        images={basicImages}
                        onAdd={(files) => handleAddImages(files, basicImages, setBasicImages)}
                        onRemove={(index) => handleRemoveImage(index, basicImages, setBasicImages)}
                        onImageClick={handleImageClick}
                      />
                    </td>
                  </tr>

                  {/* 2. 다중 이미지 업로드 */}
                  <tr>
                    <th>다중 이미지 업로드</th>
                    <td>
                      <ImageUpload
                        label="매장 이미지"
                        images={multipleImages}
                        onAdd={(files) => handleAddImages(files, multipleImages, setMultipleImages)}
                        onRemove={(index) => handleRemoveImage(index, multipleImages, setMultipleImages)}
                        onImageClick={handleImageClick}
                        multiple
                      />
                      {multipleImages.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          총 {multipleImages.length}개 이미지
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 3. 순서 변경 가능한 이미지 업로드 */}
                  <tr>
                    <th>순서 변경 가능 (드래그&드랍)</th>
                    <td>
                      <ImageUpload
                        label="상품 이미지 (순서 변경 가능)"
                        images={reorderableImages}
                        onAdd={(files) =>
                          handleAddImages(files, reorderableImages, setReorderableImages)
                        }
                        onRemove={(index) =>
                          handleRemoveImage(index, reorderableImages, setReorderableImages)
                        }
                        onReorder={(newOrder) =>
                          handleReorderImages(newOrder, setReorderableImages)
                        }
                        onImageClick={handleImageClick}
                        multiple
                        guideText="이미지를 드래그하여 순서를 변경할 수 있습니다."
                      />
                      {reorderableImages.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          총 {reorderableImages.length}개 이미지 (썸네일을 드래그하여 순서 변경)
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 4. 필수 입력 + 에러 상태 */}
                  <tr>
                    <th>필수 입력 + 에러</th>
                    <td>
                      <ImageUpload
                        label="대표 이미지"
                        required
                        images={requiredImages}
                        onAdd={(files) =>
                          handleAddImages(files, requiredImages, setRequiredImages)
                        }
                        onRemove={(index) =>
                          handleRemoveImage(index, requiredImages, setRequiredImages)
                        }
                        onImageClick={handleImageClick}
                        error={requiredImages.length === 0}
                        helpText={requiredImages.length === 0 ? '필수 입력 항목입니다.' : undefined}
                      />
                    </td>
                  </tr>

                  {/* 5. 값이 있는 상태 */}
                  <tr>
                    <th>값이 있는 상태</th>
                    <td>
                      <ImageUpload
                        label="업로드된 이미지"
                        images={filledImages}
                        onAdd={(files) => handleAddImages(files, filledImages, setFilledImages)}
                        onRemove={(index) => handleRemoveImage(index, filledImages, setFilledImages)}
                        onImageClick={handleImageClick}
                        multiple
                      />
                    </td>
                  </tr>

                  {/* 6. 비활성화 */}
                  <tr>
                    <th>비활성화 (disabled)</th>
                    <td>
                      <ImageUpload
                        label="읽기 전용"
                        images={[
                          { id: 1, name: '매장 외관.jpg', url: 'https://via.placeholder.com/200x200?text=Image+1' },
                          { id: 2, name: '매장 내부.jpg', url: 'https://via.placeholder.com/200x200?text=Image+2' },
                        ]}
                        onAdd={() => { }}
                        onRemove={() => { }}
                        disabled
                      />
                    </td>
                  </tr>

                  {/* 7. 커스텀 안내 문구 */}
                  <tr>
                    <th>커스텀 안내 문구</th>
                    <td>
                      <ImageUpload
                        images={[]}
                        onAdd={() => { }}
                        onRemove={() => { }}
                        guideText="이미지를 여기에 끌어다 놓거나 클릭하여 선택하세요."
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
                  <col width="160px" />
                  <col width="200px" />
                  <col width="180px" />
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
                    <td>
                      <code className="bg-gray-100 px-1 rounded">images</code>
                    </td>
                    <td>ImageItem[]</td>
                    <td>필수</td>
                    <td>현재 이미지 목록</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onAdd</code>
                    </td>
                    <td>(files: File[]) =&gt; void</td>
                    <td>필수</td>
                    <td>이미지 추가 핸들러</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onRemove</code>
                    </td>
                    <td>(index: number) =&gt; void</td>
                    <td>필수</td>
                    <td>이미지 삭제 핸들러</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onReorder</code>
                    </td>
                    <td>(newOrder: ImageItem[]) =&gt; void</td>
                    <td>-</td>
                    <td>이미지 순서 변경 핸들러 (드래그&드랍 활성화)</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">onImageClick</code>
                    </td>
                    <td>(image, index) =&gt; void</td>
                    <td>-</td>
                    <td>이미지 클릭 핸들러</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">label</code>
                    </td>
                    <td>string</td>
                    <td>-</td>
                    <td>라벨 텍스트</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">required</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>필수 입력 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">error</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>에러 상태</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">helpText</code>
                    </td>
                    <td>string</td>
                    <td>-</td>
                    <td>에러/도움말 메시지</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">multiple</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>다중 이미지 허용</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">disabled</code>
                    </td>
                    <td>boolean</td>
                    <td>false</td>
                    <td>비활성화 여부</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">accept</code>
                    </td>
                    <td>string</td>
                    <td>image/*</td>
                    <td>허용 이미지 타입</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">guideText</code>
                    </td>
                    <td>string</td>
                    <td>Drag & Drop으로...</td>
                    <td>안내 문구</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ImageItem 타입 설명 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>ImageItem 타입</h2>
          </div>
          <div className="slidebox-body">
            <div className="slide-table-wrap">
              <table className="default-table">
                <colgroup>
                  <col width="160px" />
                  <col width="180px" />
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
                    <td>
                      <code className="bg-gray-100 px-1 rounded">id</code>
                    </td>
                    <td>string | number (optional)</td>
                    <td>이미지 고유 ID (기존 이미지용, 드래그&드랍에 필요)</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">name</code>
                    </td>
                    <td>string</td>
                    <td>파일명</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">file</code>
                    </td>
                    <td>File (optional)</td>
                    <td>파일 객체 (새로 추가된 이미지)</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">url</code>
                    </td>
                    <td>string (optional)</td>
                    <td>이미지 URL (미리보기용, 기존 이미지 또는 blob URL)</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">type</code>
                    </td>
                    <td>string (optional)</td>
                    <td>파일 MIME 타입</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="bg-gray-100 px-1 rounded">size</code>
                    </td>
                    <td>number (optional)</td>
                    <td>파일 크기 (bytes)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>사용 예시</h2>
          </div>
          <div className="slidebox-body">
            <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-100">
                {`import { useState } from 'react'
import { ImageUpload, type ImageItem } from '@/components/common/ui'

export default function MyForm() {
  const [images, setImages] = useState<ImageItem[]>([])

  const handleAdd = (newFiles: File[]) => {
    const items = newFiles.map((file) => ({
      name: file.name,
      file,
      type: file.type,
    }))
    setImages([...images, ...items])
  }

  const handleRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleReorder = (newOrder: ImageItem[]) => {
    setImages(newOrder)
  }

  return (
    <ImageUpload
      label="매장 이미지"
      required
      images={images}
      onAdd={handleAdd}
      onRemove={handleRemove}
      onReorder={handleReorder}
      multiple
      error={images.length === 0}
      helpText={images.length === 0 ? '필수 입력 항목입니다.' : undefined}
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
