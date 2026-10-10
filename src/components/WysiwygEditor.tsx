// The WYSIWYG editor (Tiptap). Loaded lazily by RichEditor, so its ~100 kB only arrive when someone writes.
// Formatting shows as you type; the text is stored as the same Markdown subset as before (lib/markdown.ts).
import { useQuery } from "@tanstack/react-query";
import { Extension } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import clsx from "clsx";
import { Bold, Check, Code, Hash, Italic, Link2, List, ListOrdered, SquareCode, Unlink, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { api } from "../lib/api";
import { docToMarkdown, markdownToDoc, type Node } from "../lib/markdown";
import type { PublicUser } from "../lib/types";
import type { RichEditorProps } from "./RichEditor";
import { Avatar } from "./ui/Avatar";

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const MENTION_OR_TAG = /(^|[^\w@/.&#])(@[a-zA-Z0-9_]{3,24}|#[a-zA-Z0-9_]*[a-zA-Z][a-zA-Z0-9_]*)(?![\w@])/g;

type Kind = "user" | "tag";
type Option = { kind: "user"; user: PublicUser } | { kind: "tag"; tag: string; posts: number };
interface Lookup {
  kind: Kind;
  query: string;
  command: (option: { text: string }) => void;
}

const serialize = (editor: Editor) => docToMarkdown(editor.getJSON() as Node);

/** Highlights @mentions and #hashtags while typing (they stay plain text in storage). */
const Highlights = Extension.create({
  name: "mentionHighlights",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("mentionHighlights"),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || node.marks.some((m) => m.type.name === "code")) return;
              for (const m of node.text!.matchAll(MENTION_OR_TAG)) {
                const from = pos + m.index! + m[1]!.length;
                decorations.push(Decoration.inline(from, from + m[2]!.length, { class: "text-accent font-medium" }));
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export default function WysiwygEditor({
  value,
  onChange,
  onSubmit,
  submitOnEnter,
  toolbar = false,
  toolbarEnd,
  label,
  className,
  wrapperClassName,
  placeholder,
  rows = 1,
  maxLength,
  autoFocus,
  id,
  onFocus,
  onBlur,
}: RichEditorProps) {
  const listId = useId();
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [active, setActive] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  // Values we've sent up that the parent may not have rendered yet. A value prop that isn't one of
  // these is an outside change (sent, cancelled, reset) and replaces the content.
  const lastEmitted = useRef(value);
  const pending = useRef<string[]>([]);
  // Callbacks and state read inside Tiptap plugins, which are created once.
  const live = useRef({ onChange, onSubmit, submitOnEnter, maxLength, onFocus, onBlur, lookup, options: [] as Option[], active: 0, pick: (_o: Option) => {}, openLink: () => {} });

  const suggestions = useQuery({
    queryKey: ["lookup", lookup?.kind, lookup?.query.toLowerCase()],
    queryFn: async (): Promise<Option[]> => {
      if (lookup?.kind === "tag") {
        if (!/^[a-zA-Z0-9_]{1,50}$/.test(lookup.query)) return [];
        const res = await api<{ items: { tag: string; posts: number }[] }>("/tags/lookup", { query: { q: lookup.query } }).catch(() => ({ items: [] }));
        return res.items.map((t) => ({ kind: "tag" as const, ...t }));
      }
      if (!/^[a-zA-Z0-9_]{0,24}$/.test(lookup?.query ?? "")) return [];
      const res = await api<{ items: PublicUser[] }>("/users/lookup", { query: { q: lookup?.query ?? "" } });
      return res.items.map((user) => ({ kind: "user" as const, user }));
    },
    enabled: !!lookup && (lookup.kind === "user" || lookup.query.length > 0),
    staleTime: 60_000,
  });
  const options = lookup ? (suggestions.data ?? []) : [];
  const open = options.length > 0;
  const pick = (option: Option) => {
    lookup?.command({ text: option.kind === "user" ? `@${option.user.username} ` : `#${option.tag} ` });
    setLookup(null);
  };
  live.current = { ...live.current, onChange, onSubmit, submitOnEnter, maxLength, onFocus, onBlur, lookup, options, active: Math.min(active, Math.max(0, options.length - 1)), pick, openLink: () => openLinkEditor() };

  // Options for the @ and # suggestion plugins (the editor is added when the plugins are created).
  const suggestionOptions = (kind: Kind, char: string) => ({
      char,
      pluginKey: new PluginKey(`suggest-${kind}`),
      allowedPrefixes: [" ", "(", "\u00a0"],
      command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: unknown }) => {
        editor.chain().focus().insertContentAt(range, (props as { text: string }).text).run();
      },
      items: () => [],
      render: () => ({
        onStart: (props: SuggestionProps) => {
          setActive(0);
          setLookup({ kind, query: props.query, command: props.command });
        },
        onUpdate: (props: SuggestionProps) => setLookup({ kind, query: props.query, command: props.command }),
        onExit: () => setLookup(null),
        onKeyDown: ({ event }: SuggestionKeyDownProps) => {
          const { options, lookup } = live.current;
          if (!lookup) return false;
          if (event.key === "Escape") {
            setLookup(null);
            return true;
          }
          if (!options.length) return false;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            setActive((i) => (i + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length);
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            live.current.pick(options[live.current.active]!);
            return true;
          }
          return false;
        },
      }),
    });

  const editor = useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    autofocus: autoFocus ? "end" : false,
    content: markdownToDoc(value),
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        trailingNode: false,
        codeBlock: { HTMLAttributes: { class: "rich-pre" } },
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: true,
          isAllowedUri: (url) => SAFE_URL.test(url),
          HTMLAttributes: { rel: "noopener noreferrer nofollow ugc", target: null },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      Highlights,
      Extension.create({
        name: "aSocialKeys",
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": () => {
              live.current.onSubmit?.();
              return true;
            },
            Enter: () => {
              if (!live.current.submitOnEnter || live.current.lookup) return false;
              live.current.onSubmit?.();
              return true;
            },
            "Mod-k": () => {
              live.current.openLink();
              return true;
            },
          };
        },
        addProseMirrorPlugins() {
          return [
            Suggestion({ ...suggestionOptions("user", "@"), editor: this.editor }),
            Suggestion({ ...suggestionOptions("tag", "#"), editor: this.editor }),
            // The character limit applies to the stored text.
            new Plugin({
              key: new PluginKey("maxLength"),
              filterTransaction: (tr, state) => {
                const max = live.current.maxLength;
                if (!max || !tr.docChanged) return true;
                const next = docToMarkdown(tr.doc.toJSON() as Node).length;
                return next <= max || next <= docToMarkdown(state.doc.toJSON() as Node).length;
              },
            }),
          ];
        },
      }),
    ],
    editorProps: {
      // Pasting past the character limit keeps what fits (like a textarea's maxlength).
      handlePaste: (view, event) => {
        const max = live.current.maxLength;
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (!max || !text) return false;
        const current = docToMarkdown(view.state.doc.toJSON() as Node).length;
        const selected = view.state.doc.textBetween(view.state.selection.from, view.state.selection.to, "\n").length;
        const room = max - current + selected;
        if (text.length <= room) return false;
        if (room > 0) view.dispatch(view.state.tr.insertText(text.slice(0, room)));
        return true;
      },
      attributes: {
        ...(id ? { id } : {}),
        role: "combobox",
        "aria-label": label,
        "aria-multiline": "true",
        "aria-autocomplete": "list",
        "aria-expanded": "false",
        class: clsx("rich-editor", className),
        style: `min-height: ${Math.max(1, rows) * 1.65}em`,
      },
    },
    onUpdate: ({ editor }) => {
      const md = serialize(editor);
      if (md === lastEmitted.current) return;
      lastEmitted.current = md;
      pending.current.push(md);
      if (pending.current.length > 50) pending.current.shift();
      live.current.onChange(md);
    },
    onFocus: () => live.current.onFocus?.(),
    onBlur: () => {
      setTimeout(() => setLookup(null), 150);
      live.current.onBlur?.();
    },
  });

  // The view (and its DOM) exists once EditorContent has mounted the editor.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!editor) return;
    const onMount = () => setMounted(true);
    const onUnmount = () => setMounted(false);
    try {
      if (editor.view.dom.isConnected) setMounted(true);
    } catch {
      // not mounted yet
    }
    editor.on("mount", onMount);
    editor.on("unmount", onUnmount);
    return () => {
      editor.off("mount", onMount);
      editor.off("unmount", onUnmount);
    };
  }, [editor]);

  // Outside changes (sent, cancelled, reset) replace the content.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) {
      pending.current = [];
      return;
    }
    if (pending.current.includes(value)) return; // the parent is catching up
    pending.current = [];
    lastEmitted.current = value;
    editor.commands.setContent(markdownToDoc(value), { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor || !mounted) return;
    const dom = editor.view.dom;
    dom.setAttribute("aria-expanded", String(open));
    if (open) {
      dom.setAttribute("aria-controls", listId);
      dom.setAttribute("aria-activedescendant", `${listId}-${live.current.active}`);
    } else {
      dom.removeAttribute("aria-controls");
      dom.removeAttribute("aria-activedescendant");
    }
  }, [editor, mounted, open, active, listId]);

  useEffect(() => {
    if (editor && mounted && placeholder !== undefined) editor.view.dom.setAttribute("aria-placeholder", placeholder);
  }, [editor, mounted, placeholder]);

  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            code: editor.isActive("code"),
            codeBlock: editor.isActive("codeBlock"),
            ul: editor.isActive("bulletList"),
            ol: editor.isActive("orderedList"),
            link: editor.isActive("link"),
          }
        : null,
  });

  function openLinkEditor() {
    if (!editor) return;
    setHref((editor.getAttributes("link").href as string | undefined) ?? "https://");
    setLinkOpen(true);
  }
  const applyLink = () => {
    if (!editor) return;
    const url = href.trim();
    if (!SAFE_URL.test(url) || url === "https://") return;
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain.insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    } else {
      chain.extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
  };

  if (!editor) return null;
  // Toolbar buttons don't take focus (mousedown is prevented), so only refocus when needed:
  // a delayed focus() would otherwise restore an old selection after the next keystroke.
  const chain = () => (editor.isFocused ? editor.chain() : editor.chain().focus());
  const tools = [
    { key: "bold", label: "Bold", shortcut: "B", icon: Bold, run: () => chain().toggleBold().run(), on: state?.bold },
    { key: "italic", label: "Italic", shortcut: "I", icon: Italic, run: () => chain().toggleItalic().run(), on: state?.italic },
    { key: "ul", label: "Bulleted list", icon: List, run: () => chain().toggleBulletList().run(), on: state?.ul },
    { key: "ol", label: "Numbered list", icon: ListOrdered, run: () => chain().toggleOrderedList().run(), on: state?.ol },
    { key: "link", label: "Link", shortcut: "K", icon: Link2, run: openLinkEditor, on: state?.link },
    { key: "code", label: "Code", shortcut: "E", icon: Code, run: () => chain().toggleCode().run(), on: state?.code },
    { key: "codeBlock", label: "Code block", icon: SquareCode, run: () => chain().toggleCodeBlock().run(), on: state?.codeBlock },
  ];

  return (
    <div className={clsx("relative", wrapperClassName)}>
      <EditorContent editor={editor} />
      {open ? (
        <ul id={listId} role="listbox" aria-label={lookup?.kind === "tag" ? "Hashtags" : "People to mention"} className="card absolute left-0 z-30 mt-1 w-64 max-w-full animate-rise overflow-hidden p-1">
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
      {linkOpen ? (
        <div className="mt-1 flex items-center gap-1.5" role="group" aria-label="Link">
          <input
            autoFocus
            type="url"
            inputMode="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setLinkOpen(false);
                editor.commands.focus();
              }
            }}
            aria-label="Link address"
            placeholder="https://"
            className="field h-8 min-w-0 flex-1 py-1 text-sm"
          />
          <button type="button" onClick={applyLink} aria-label="Apply link" className="rounded-lg p-1.5 text-accent hover:bg-surface-2">
            <Check className="size-4" />
          </button>
          {state?.link ? (
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                setLinkOpen(false);
              }}
              aria-label="Remove link"
              className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            >
              <Unlink className="size-4" />
            </button>
          ) : null}
          <button type="button" onClick={() => (setLinkOpen(false), editor.commands.focus())} aria-label="Cancel link" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {toolbar ? (
        <div role="toolbar" aria-label="Formatting" className="mt-1 flex flex-wrap items-center gap-0.5">
          {tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={tool.run}
              title={tool.shortcut ? `${tool.label} (Ctrl/⌘+${tool.shortcut})` : tool.label}
              aria-label={tool.label}
              aria-pressed={!!tool.on}
              className={clsx(
                "rounded-lg p-1.5 transition-colors hover:bg-surface-2 hover:text-ink",
                tool.on ? "bg-accent-soft text-accent-strong" : "text-muted",
              )}
            >
              <tool.icon className="size-4" />
            </button>
          ))}
          {toolbarEnd}
        </div>
      ) : null}
    </div>
  );
}
