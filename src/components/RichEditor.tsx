import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Bold, Code, Eye, Hash, Italic, Link2, List, ListOrdered, PenLine } from "lucide-react";
import { type KeyboardEvent, type ReactNode, type TextareaHTMLAttributes, useEffect, useId, useRef, useState } from "react";
import { api } from "../lib/api";
import type { PublicUser } from "../lib/types";
import { RichText } from "./RichText";
import { Avatar } from "./ui/Avatar";

type Format = "bold" | "italic" | "code" | "link" | "ul" | "ol";

const TOOLS: { format: Format; label: string; shortcut?: string; icon: typeof Bold }[] = [
  { format: "bold", label: "Bold", shortcut: "B", icon: Bold },
  { format: "italic", label: "Italic", shortcut: "I", icon: Italic },
  { format: "ul", label: "Bulleted list", icon: List },
  { format: "ol", label: "Numbered list", icon: ListOrdered },
  { format: "link", label: "Link", shortcut: "K", icon: Link2 },
  { format: "code", label: "Code", shortcut: "E", icon: Code },
];

const SHORTCUTS: Record<string, Format> = { b: "bold", i: "italic", k: "link", e: "code" };

/** Applies a Markdown format to the selection and returns the new text and selection. */
function applyFormat(value: string, start: number, end: number, format: Format) {
  const selected = value.slice(start, end);
  const wrap = (before: string, after: string, placeholder: string) => {
    const inner = selected || placeholder;
    const text = value.slice(0, start) + before + inner + after + value.slice(end);
    return { text, start: start + before.length, end: start + before.length + inner.length };
  };
  switch (format) {
    case "bold":
      return wrap("**", "**", "bold text");
    case "italic":
      return wrap("_", "_", "italic text");
    case "code":
      return selected.includes("\n") ? wrap("```\n", "\n```", "code") : wrap("`", "`", "code");
    case "link": {
      const isUrl = /^https?:\/\//.test(selected);
      const label = isUrl ? "link text" : selected || "link text";
      const url = isUrl ? selected : "https://";
      const text = `${value.slice(0, start)}[${label}](${url})${value.slice(end)}`;
      // Select the part the writer most likely needs to type next.
      const urlStart = start + label.length + 3;
      return isUrl ? { text, start: start + 1, end: start + 1 + label.length } : { text, start: urlStart, end: urlStart + url.length };
    }
    case "ul":
    case "ol": {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const block = value.slice(lineStart, end) || "";
      const lines = block.split("\n");
      const next = lines.map((line, i) => `${format === "ul" ? "- " : `${i + 1}. `}${line.replace(/^\s*([-*•]|\d+[.)])\s+/, "")}`).join("\n");
      const text = value.slice(0, lineStart) + next + value.slice(end);
      return { text, start: lineStart + next.length, end: lineStart + next.length };
    }
  }
}

const MENTION_AT_CARET = /(^|[\s(])@([a-zA-Z0-9_]{1,24})$/;
const TAG_AT_CARET = /(^|[\s(])#([a-zA-Z0-9_]{1,50})$/;

type Lookup = { kind: "user" | "tag"; q: string };
type Suggestion = { kind: "user"; user: PublicUser } | { kind: "tag"; tag: string; posts: number };

/** What's being typed at the caret: an @mention or a #hashtag (exported for tests). */
export function lookupAt(text: string, caret: number): Lookup | null {
  const before = text.slice(0, caret);
  const mention = MENTION_AT_CARET.exec(before);
  if (mention) return { kind: "user", q: mention[2]!.toLowerCase() };
  const tag = TAG_AT_CARET.exec(before);
  return tag ? { kind: "tag", q: tag[2]!.toLowerCase() } : null;
}

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Ctrl/Cmd+Enter */
  onSubmit?: () => void;
  toolbar?: boolean;
  toolbarEnd?: ReactNode;
  /** Adds a Write/Preview toggle to the toolbar. */
  preview?: boolean;
  label: string;
  wrapperClassName?: string;
}

/** A textarea with Markdown formatting (toolbar and shortcuts), @mention and #hashtag autocomplete, and an optional preview. */
export function RichEditor({ value, onChange, onSubmit, toolbar = false, toolbarEnd, preview = false, label, className, wrapperClassName, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const listId = useId();
  const previewId = useId();
  const [query, setQuery] = useState<Lookup | null>(null);
  const [active, setActive] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const pendingSelection = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (pendingSelection.current && ref.current) {
      ref.current.setSelectionRange(...pendingSelection.current);
      pendingSelection.current = null;
    }
  }, [value]);

  const suggestions = useQuery({
    queryKey: ["lookup", query?.kind, query?.q],
    queryFn: async (): Promise<Suggestion[]> => {
      if (query?.kind === "tag") {
        const res = await api<{ items: { tag: string; posts: number }[] }>("/tags/lookup", { query: { q: query.q } }).catch(() => ({ items: [] }));
        return res.items.map((t) => ({ kind: "tag", ...t }));
      }
      const res = await api<{ items: PublicUser[] }>("/users/lookup", { query: { q: query?.q ?? "" } });
      return res.items.map((user) => ({ kind: "user", user }));
    },
    enabled: !!query,
    staleTime: 60_000,
  });
  const options = query ? (suggestions.data ?? []) : [];
  const open = options.length > 0 && !previewing;

  const detectMention = (text: string, caret: number) => {
    setQuery(lookupAt(text, caret));
    setActive(0);
  };

  const format = (kind: Format) => {
    const el = ref.current;
    if (!el) return;
    const next = applyFormat(value, el.selectionStart, el.selectionEnd, kind);
    pendingSelection.current = [next.start, next.end];
    onChange(next.text);
    el.focus();
  };

  const pick = (option: Suggestion) => {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before =
      option.kind === "user"
        ? value.slice(0, caret).replace(/@([a-zA-Z0-9_]{1,24})$/, `@${option.user.username} `)
        : value.slice(0, caret).replace(/#([a-zA-Z0-9_]{1,50})$/, `#${option.tag} `);
    pendingSelection.current = [before.length, before.length];
    onChange(before + value.slice(caret).replace(/^\s/, ""));
    setQuery(null);
    el.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pick(options[active]!);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setQuery(null);
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    const shortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey ? SHORTCUTS[e.key.toLowerCase()] : undefined;
    if (shortcut) {
      e.preventDefault();
      format(shortcut);
    }
    props.onKeyDown?.(e);
  };

  return (
    <div className={clsx("relative", wrapperClassName)}>
      {previewing ? (
        <div
          id={previewId}
          role="region"
          aria-label={`${label} preview`}
          className={clsx(className, "min-h-[4.5rem] overflow-auto")}
        >
          {value.trim() ? <RichText text={value} /> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      ) : null}
      <textarea
        hidden={previewing}
        {...props}
        ref={ref}
        value={value}
        aria-label={label}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          detectMention(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={onKeyDown}
        onClick={(e) => detectMention(value, e.currentTarget.selectionStart)}
        onBlur={(e) => {
          // Let a click on a suggestion land first.
          setTimeout(() => setQuery(null), 150);
          props.onBlur?.(e);
        }}
        className={className}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={query?.kind === "tag" ? "Hashtags" : "People to mention"}
          className="card absolute left-0 z-30 mt-1 w-64 max-w-full animate-rise overflow-hidden p-1"
        >
          {options.map((option, i) => (
            <li
              key={option.kind === "user" ? option.user.username : option.tag}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              onMouseEnter={() => setActive(i)}
              className={clsx("flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2", i === active && "bg-surface-2")}
            >
              {option.kind === "user" ? (
                <>
                  <Avatar user={option.user} size="xs" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{option.user.displayName}</span>
                    <span className="block truncate text-xs text-muted">@{option.user.username}</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-accent-strong" aria-hidden>
                    <Hash className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">#{option.tag}</span>
                    <span className="block truncate text-xs text-muted">
                      {option.posts} public {option.posts === 1 ? "post" : "posts"}
                    </span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {toolbar ? (
        <div role="toolbar" aria-label="Formatting" className="mt-1 flex flex-wrap items-center gap-0.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.format}
              type="button"
              disabled={previewing}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format(tool.format)}
              title={tool.shortcut ? `${tool.label} (Ctrl/⌘+${tool.shortcut})` : tool.label}
              aria-label={tool.label}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <tool.icon className="size-4" />
            </button>
          ))}
          {preview ? (
            <button
              type="button"
              aria-pressed={previewing}
              aria-controls={previewing ? previewId : undefined}
              onClick={() => {
                setPreviewing((p) => !p);
                setQuery(null);
                if (previewing) setTimeout(() => ref.current?.focus(), 0);
              }}
              title={previewing ? "Back to writing" : "Preview how it will look"}
              className={clsx(
                "ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                previewing ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              {previewing ? <PenLine className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
              {previewing ? "Write" : "Preview"}
            </button>
          ) : null}
          {toolbarEnd}
        </div>
      ) : null}
    </div>
  );
}
