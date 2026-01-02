"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/editor/Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-zinc-500">에디터 로딩 중...</p>
    </div>
  ),
});

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          문서 에디터
        </h1>
        <Editor />
      </div>
    </div>
  );
}
