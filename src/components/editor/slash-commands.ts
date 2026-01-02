import { Editor } from "@tiptap/core";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor) => void;
}

export const slashCommands: SlashCommandItem[] = [
  {
    title: "텍스트",
    description: "일반 문단",
    icon: "📝",
    command: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    title: "제목 1",
    description: "큰 제목",
    icon: "H1",
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "제목 2",
    description: "중간 제목",
    icon: "H2",
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "제목 3",
    description: "작은 제목",
    icon: "H3",
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "불릿 리스트",
    description: "순서 없는 목록",
    icon: "•",
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: "번호 리스트",
    description: "순서 있는 목록",
    icon: "1.",
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: "인용문",
    description: "인용 블록",
    icon: "❝",
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    title: "코드 블록",
    description: "코드 작성",
    icon: "</>",
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: "구분선",
    description: "수평 구분선",
    icon: "—",
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
];
