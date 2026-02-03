'use client'

import {
  useCallback,
  useId,
  useRef,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { useEditor, EditorContent, ReactRenderer, type Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion'
import './Editor.css'

/**
 * 슬래시 명령어 아이템 타입
 */
export interface SlashCommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: TiptapEditor) => void
}

/**
 * 기본 슬래시 명령어 목록
 */
const defaultSlashCommands: SlashCommandItem[] = [
  {
    title: '제목 1',
    description: '큰 제목을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4v3h5.5v12h3V7H19V4H5z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: '제목 2',
    description: '중간 제목을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4v3h5.5v12h3V7H19V4H5z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: '제목 3',
    description: '작은 제목을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4v3h5.5v12h3V7H19V4H5z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: '글머리 기호 목록',
    description: '글머리 기호 목록을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: '번호 매기기 목록',
    description: '번호 목록을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: '인용구',
    description: '인용구 블록을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: '코드 블록',
    description: '코드 블록을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: '가로줄',
    description: '구분선을 추가합니다',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 11h16v2H4z" />
      </svg>
    ),
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

/**
 * 슬래시 명령어 메뉴 Props
 */
interface SlashCommandMenuProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
  editor: TiptapEditor
}

/**
 * 슬래시 명령어 메뉴 Ref
 */
interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

/**
 * 슬래시 명령어 메뉴 컴포넌트
 */
const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    const upHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
    }, [items.length])

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + 1) % items.length)
    }, [items.length])

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex)
    }, [selectItem, selectedIndex])

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }
        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }
        if (event.key === 'Enter') {
          enterHandler()
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="slash-command-menu">
          <div className="slash-command-empty">결과 없음</div>
        </div>
      )
    }

    return (
      <div className="slash-command-menu">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="slash-command-icon">{item.icon}</div>
            <div className="slash-command-content">
              <div className="slash-command-title">{item.title}</div>
              <div className="slash-command-description">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

SlashCommandMenu.displayName = 'SlashCommandMenu'

/**
 * 슬래시 명령어 확장 생성
 */
function createSlashCommandExtension(
  commands: SlashCommandItem[] = defaultSlashCommands
): Extension {
  return Extension.create({
    name: 'slashCommand',

    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({
            editor,
            range,
            props,
          }: {
            editor: TiptapEditor
            range: { from: number; to: number }
            props: SlashCommandItem
          }) => {
            editor.chain().focus().deleteRange(range).run()
            props.command(editor)
          },
        } as Partial<SuggestionOptions<SlashCommandItem>>,
      }
    },

    addProseMirrorPlugins() {
      return [
        Suggestion<SlashCommandItem>({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => {
            return commands.filter(
              (item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
            )
          },
          render: () => {
            let component: ReactRenderer<SlashCommandMenuRef, SlashCommandMenuProps> | null = null
            let popup: HTMLElement | null = null

            return {
              onStart: (props: SuggestionProps<SlashCommandItem>) => {
                component = new ReactRenderer(SlashCommandMenu, {
                  props: {
                    ...props,
                    command: (item: SlashCommandItem) => {
                      props.command(item)
                    },
                  },
                  editor: props.editor,
                })

                popup = document.createElement('div')
                popup.className = 'slash-command-popup'
                document.body.appendChild(popup)
                popup.appendChild(component.element)

                const updatePosition = () => {
                  if (!popup || !props.clientRect) return
                  const rect = props.clientRect()
                  if (!rect) return
                  popup.style.left = `${rect.left + window.scrollX}px`
                  popup.style.top = `${rect.bottom + window.scrollY + 8}px`
                }

                updatePosition()
              },

              onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
                component?.updateProps({
                  ...props,
                  command: (item: SlashCommandItem) => {
                    props.command(item)
                  },
                })

                if (popup && props.clientRect) {
                  const rect = props.clientRect()
                  if (rect) {
                    popup.style.left = `${rect.left + window.scrollX}px`
                    popup.style.top = `${rect.bottom + window.scrollY + 8}px`
                  }
                }
              },

              onKeyDown: (props: { event: KeyboardEvent }) => {
                if (props.event.key === 'Escape') {
                  popup?.remove()
                  component?.destroy()
                  return true
                }
                return component?.ref?.onKeyDown(props) ?? false
              },

              onExit: () => {
                popup?.remove()
                component?.destroy()
              },
            }
          },
        }),
      ]
    },
  })
}

/**
 * Editor 컴포넌트 Props 타입
 */
export interface EditorProps {
  /** 라벨 텍스트 */
  label?: string
  /** 필수 입력 여부 */
  required?: boolean
  /** 에러 상태 여부 */
  error?: boolean
  /** 에러 메시지 또는 도움말 텍스트 */
  helpText?: string
  /** placeholder 텍스트 */
  placeholder?: string
  /** 에디터 내용 (HTML 문자열) */
  value?: string
  /** 내용 변경 핸들러 */
  onChange?: (html: string) => void
  /** 비활성화 여부 */
  disabled?: boolean
  /** 읽기 전용 여부 */
  readOnly?: boolean
  /** 최소 높이 (px) */
  minHeight?: number
  /** 최대 높이 (px) */
  maxHeight?: number
  /** 이미지 업로드 핸들러 - File을 받아서 URL을 반환 */
  onImageUpload?: (file: File) => Promise<string>
  /** 이미지 최대 크기 (bytes) */
  maxImageSize?: number
  /** 허용 이미지 타입 */
  acceptImageTypes?: string[]
  /** 툴바 표시 여부 */
  showToolbar?: boolean
  /** 슬래시 명령어 활성화 여부 */
  enableSlashCommands?: boolean
  /** 커스텀 슬래시 명령어 목록 */
  slashCommands?: SlashCommandItem[]
  /** 컨테이너 추가 클래스 */
  className?: string
}

/**
 * 툴바 버튼 Props
 */
interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

/**
 * 툴바 버튼 컴포넌트
 */
function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`editor-toolbar-btn ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  )
}

/**
 * 툴바 구분선
 */
function ToolbarDivider() {
  return <div className="editor-toolbar-divider" />
}

/**
 * 에디터 툴바 컴포넌트
 */
function EditorToolbar({
  editor,
  onImageUpload,
  maxImageSize,
  acceptImageTypes,
  disabled,
}: {
  editor: TiptapEditor | null
  onImageUpload?: (file: File) => Promise<string>
  maxImageSize?: number
  acceptImageTypes?: string[]
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0 || !editor) return

      const file = files[0]

      // 파일 크기 체크
      if (maxImageSize && file.size > maxImageSize) {
        alert(`이미지 크기는 ${Math.round(maxImageSize / 1024 / 1024)}MB 이하여야 합니다.`)
        return
      }

      // 파일 타입 체크
      if (acceptImageTypes && !acceptImageTypes.includes(file.type)) {
        alert('지원하지 않는 이미지 형식입니다.')
        return
      }

      try {
        let imageUrl: string

        if (onImageUpload) {
          // 외부 업로드 핸들러 사용
          imageUrl = await onImageUpload(file)
        } else {
          // 기본: Base64로 변환
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        }

        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run()
      } catch {
        alert('이미지 업로드에 실패했습니다.')
      }

      // input 초기화
      e.target.value = ''
    },
    [editor, onImageUpload, maxImageSize, acceptImageTypes]
  )

  if (!editor) return null

  return (
    <div className={`editor-toolbar ${disabled ? 'disabled' : ''}`}>
      {/* 텍스트 스타일 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={disabled}
        title="굵게 (Ctrl+B)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={disabled}
        title="기울임 (Ctrl+I)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        disabled={disabled}
        title="취소선"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        disabled={disabled}
        title="인라인 코드"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* 제목 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        disabled={disabled}
        title="제목 1"
      >
        <span className="editor-toolbar-text">H1</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        disabled={disabled}
        title="제목 2"
      >
        <span className="editor-toolbar-text">H2</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        disabled={disabled}
        title="제목 3"
      >
        <span className="editor-toolbar-text">H3</span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* 리스트 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={disabled}
        title="글머리 기호 목록"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={disabled}
        title="번호 매기기 목록"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* 블록 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        disabled={disabled}
        title="인용구"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        disabled={disabled}
        title="코드 블록"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V7h16l.002 12H4z" />
          <path d="m9.293 9.293-3 3a.999.999 0 0 0 0 1.414l3 3 1.414-1.414L8.414 13l2.293-2.293-1.414-1.414zm5.414 0-1.414 1.414L15.586 13l-2.293 2.293 1.414 1.414 3-3a.999.999 0 0 0 0-1.414l-3-3z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
        title="가로줄"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 11h16v2H4z" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* 이미지 */}
      <ToolbarButton onClick={handleImageClick} disabled={disabled} title="이미지 삽입">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptImageTypes?.join(',') || 'image/*'}
        onChange={handleImageSelect}
        style={{ display: 'none' }}
      />

      <ToolbarDivider />

      {/* 실행 취소/다시 실행 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="실행 취소 (Ctrl+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="다시 실행 (Ctrl+Y)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
        </svg>
      </ToolbarButton>
    </div>
  )
}

/**
 * Tiptap 기반 에디터 컴포넌트
 * - 기본 텍스트 편집 (굵게, 기울임, 취소선, 코드)
 * - 제목 (H1-H3), 목록, 인용구, 코드 블록
 * - 이미지 삽입 (버튼 클릭, 드래그&드롭, 붙여넣기)
 * - 슬래시 명령어 (/ 입력 시 명령어 팔레트 표시)
 */
function Editor({
  label,
  required = false,
  error = false,
  helpText,
  placeholder = '내용을 입력하세요...',
  value = '',
  onChange,
  disabled = false,
  readOnly = false,
  minHeight = 200,
  maxHeight,
  onImageUpload,
  maxImageSize = 10 * 1024 * 1024, // 10MB
  acceptImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  showToolbar = true,
  enableSlashCommands = true,
  slashCommands,
  className = '',
}: EditorProps) {
  const inputId = useId()

  const extensions = useMemo(() => {
    const exts = [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: enableSlashCommands
          ? `${placeholder} (/ 로 명령어 사용)`
          : placeholder,
      }),
    ]

    if (enableSlashCommands && !disabled && !readOnly) {
      exts.push(createSlashCommandExtension(slashCommands))
    }

    return exts
  }, [placeholder, enableSlashCommands, slashCommands, disabled, readOnly])

  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled && !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'editor-content-area',
        style: `min-height: ${minHeight}px; ${maxHeight ? `max-height: ${maxHeight}px;` : ''}`,
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || disabled || readOnly) return false

        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const file = files[0]
        if (!file.type.startsWith('image/')) return false

        // 파일 크기 체크
        if (maxImageSize && file.size > maxImageSize) {
          alert(`이미지 크기는 ${Math.round(maxImageSize / 1024 / 1024)}MB 이하여야 합니다.`)
          return true
        }

        // 파일 타입 체크
        if (acceptImageTypes && !acceptImageTypes.includes(file.type)) {
          alert('지원하지 않는 이미지 형식입니다.')
          return true
        }

        event.preventDefault()

        const uploadImage = async () => {
          try {
            let imageUrl: string

            if (onImageUpload) {
              imageUrl = await onImageUpload(file)
            } else {
              imageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
              })
            }

            const { schema } = view.state
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
            const node = schema.nodes.image.create({ src: imageUrl, alt: file.name })
            const transaction = view.state.tr.insert(coordinates?.pos ?? 0, node)
            view.dispatch(transaction)
          } catch {
            alert('이미지 업로드에 실패했습니다.')
          }
        }

        uploadImage()
        return true
      },
      handlePaste: (view, event) => {
        if (disabled || readOnly) return false

        const files = event.clipboardData?.files
        if (!files || files.length === 0) return false

        const file = files[0]
        if (!file.type.startsWith('image/')) return false

        // 파일 크기 체크
        if (maxImageSize && file.size > maxImageSize) {
          alert(`이미지 크기는 ${Math.round(maxImageSize / 1024 / 1024)}MB 이하여야 합니다.`)
          return true
        }

        // 파일 타입 체크
        if (acceptImageTypes && !acceptImageTypes.includes(file.type)) {
          alert('지원하지 않는 이미지 형식입니다.')
          return true
        }

        event.preventDefault()

        const uploadImage = async () => {
          try {
            let imageUrl: string

            if (onImageUpload) {
              imageUrl = await onImageUpload(file)
            } else {
              imageUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
              })
            }

            const { schema } = view.state
            const node = schema.nodes.image.create({ src: imageUrl, alt: file.name })
            const transaction = view.state.tr.replaceSelectionWith(node)
            view.dispatch(transaction)
          } catch {
            alert('이미지 업로드에 실패했습니다.')
          }
        }

        uploadImage()
        return true
      },
    },
  })

  const wrapperClass = [
    'editor-wrapper',
    error ? 'editor-error' : '',
    disabled ? 'editor-disabled' : '',
    readOnly ? 'editor-readonly' : '',
    !showToolbar ? 'editor-no-toolbar' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="editor-container">
      {/* 라벨 영역 */}
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 mb-1 text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="red">*</span>}
        </label>
      )}

      {/* 에디터 영역 */}
      <div className={wrapperClass}>
        {showToolbar && (
          <EditorToolbar
            editor={editor}
            onImageUpload={onImageUpload}
            maxImageSize={maxImageSize}
            acceptImageTypes={acceptImageTypes}
            disabled={disabled || readOnly}
          />
        )}
        <EditorContent editor={editor} />
      </div>

      {/* 에러/도움말 메시지 */}
      {helpText && (
        <div
          id={`${inputId}-help`}
          className={`${error ? 'warning-txt' : 'form-helper'} mt5`}
          role={error ? 'alert' : undefined}
        >
          {error && '* '}
          {helpText}
        </div>
      )}
    </div>
  )
}

export default Editor
