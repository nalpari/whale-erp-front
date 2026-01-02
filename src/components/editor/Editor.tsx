"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension, Editor as TiptapEditor } from "@tiptap/core";
import Suggestion, { SuggestionProps } from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { useEffect, useState } from "react";

import { common, createLowlight } from "lowlight";

import {
  SlashCommandList,
  SlashCommandRef,
  getSuggestionItems,
} from "./SlashCommand";
import { SlashCommandItem } from "./slash-commands";

const lowlight = createLowlight(common);

const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: TiptapEditor;
          range: { from: number; to: number };
          props: SlashCommandItem;
        }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: getSuggestionItems,
        render: () => {
          let component: ReactRenderer<SlashCommandRef> | null = null;
          let popup: TippyInstance | null = null;

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              const tippyInstances = tippy("body", {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });

              popup = tippyInstances[0] ?? null;
            },

            onUpdate(props: SuggestionProps) {
              component?.updateProps(props);

              if (!props.clientRect || !popup) return;

              popup.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }

              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit() {
              popup?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

export default function Editor() {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-zinc-300 p-2 dark:border-zinc-600",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border border-zinc-300 p-2 bg-zinc-100 font-semibold dark:border-zinc-600 dark:bg-zinc-700",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "rounded-lg bg-zinc-900 p-4 font-mono text-sm text-zinc-100 overflow-x-auto",
        },
      }),
      Placeholder.configure({
        placeholder: "'/'를 입력하여 명령어를 사용하세요...",
      }),
      SlashCommand,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none min-h-[500px] focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="min-h-[500px] text-zinc-400">에디터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <EditorContent editor={editor} />
    </div>
  );
}
