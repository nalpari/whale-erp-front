"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import { SlashCommandItem, slashCommands } from "./slash-commands";

export interface SlashCommandRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandList = forwardRef<SlashCommandRef, SlashCommandProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [prevItems, setPrevItems] = useState(items);

    if (items !== prevItems) {
      setPrevItems(items);
      setSelectedIndex(0);
    }

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    return (
      <div className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        {items.length > 0 ? (
          items.map((item, index) => (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-zinc-100 dark:bg-zinc-700"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 text-sm dark:bg-zinc-700">
                {item.icon}
              </span>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </p>
              </div>
            </button>
          ))
        ) : (
          <p className="px-3 py-2 text-sm text-zinc-500">결과 없음</p>
        )}
      </div>
    );
  }
);

SlashCommandList.displayName = "SlashCommandList";

export function getSuggestionItems({ query }: { query: string }) {
  return slashCommands.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
}
