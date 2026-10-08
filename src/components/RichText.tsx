import clsx from "clsx";
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";

// Renders the small Markdown subset aSocial stores (see the server's richtext.ts) into React
// elements. No HTML string is ever injected, and links are limited to http(s)/mailto.

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

function safeHref(url: string): string | null {
  if (!SAFE_URL.test(url)) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

const INLINE = new RegExp(
  [
    /(?<code>`[^`\n]+`)/.source,
    /(?<link>\[[^\]\n]{1,200}\]\((?:[^()\s]|\([^()\s]*\)){1,2048}\))/.source,
    /(?<bold>\*\*(?=\S)[\s\S]+?(?<=\S)\*\*|__(?=\S)[\s\S]+?(?<=\S)__)/.source,
    /(?<italic>(?<![\w*])\*(?=[^\s*])[^*\n]+?(?<=\S)\*(?![\w*])|(?<![\w_])_(?=[^\s_])[^_\n]+?(?<=\S)_(?![\w_]))/.source,
    /(?<url>https?:\/\/[^\s<>]+[^\s<>.,:;"')\]!?])/.source,
    /(?<mention>(?<![\w@/.])@[a-zA-Z0-9_]{3,24}(?![\w@]))/.source,
    /(?<tag>(?<![\w&#/])#[a-zA-Z0-9_]{0,49}[a-zA-Z][a-zA-Z0-9_]{0,49}(?!\w))/.source,
  ].join("|"),
  "g",
);

const linkClass = "font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent";

function inline(text: string, key: string, plainLinks = false): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(INLINE)) {
    const groups = match.groups!;
    const start = match.index!;
    if (start > last) out.push(text.slice(last, start));
    const k = `${key}-${i++}`;
    const token = match[0];
    if (groups.code) {
      out.push(
        <code key={k} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.88em] text-ink-soft ring-1 ring-line">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (groups.link) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = safeHref(token.slice(close + 2, -1));
      out.push(
        href && !plainLinks ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className={linkClass}>
            {inline(label, k, true)}
          </a>
        ) : (
          <Fragment key={k}>{inline(label, k, plainLinks)}</Fragment>
        ),
      );
    } else if (groups.bold) {
      out.push(
        <strong key={k} className="font-semibold">
          {inline(token.slice(2, -2), k, plainLinks)}
        </strong>,
      );
    } else if (groups.italic) {
      out.push(<em key={k}>{inline(token.slice(1, -1), k, plainLinks)}</em>);
    } else if (groups.url) {
      const href = safeHref(token);
      out.push(
        href && !plainLinks ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className={clsx(linkClass, "break-all")}>
            {token.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          token
        ),
      );
    } else if (groups.mention) {
      const name = token.slice(1).toLowerCase();
      out.push(
        plainLinks ? (
          token
        ) : (
          <Link key={k} to={`/u/${name}`} className="font-medium text-accent hover:underline">
            {token}
          </Link>
        ),
      );
    } else if (groups.tag) {
      out.push(
        plainLinks ? (
          token
        ) : (
          <Link key={k} to={`/tag/${token.slice(1).toLowerCase()}`} className="font-medium text-accent hover:underline">
            {token}
          </Link>
        ),
      );
    }
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[]; start: number }
  | { type: "code"; text: string };

const BULLET = /^\s{0,3}[-*•]\s+(.*)$/;
const NUMBERED = /^\s{0,3}(\d{1,3})[.)]\s+(.*)$/;

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trimStart().startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith("```")) body.push(lines[i++]!);
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    const prev = blocks.at(-1);
    if (bullet) {
      if (prev?.type === "ul") prev.items.push(bullet[1]!);
      else blocks.push({ type: "ul", items: [bullet[1]!] });
    } else if (numbered) {
      if (prev?.type === "ol") prev.items.push(numbered[2]!);
      else blocks.push({ type: "ol", items: [numbered[2]!], start: Number(numbered[1]) });
    } else if (!line.trim()) {
      blocks.push({ type: "p", lines: [] });
    } else if (prev?.type === "p" && prev.lines.length) {
      prev.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => b.type !== "p" || b.lines.length);
}

export function RichText({ text, className, compact }: { text: string; className?: string; compact?: boolean }) {
  const blocks = parseBlocks(text);
  return (
    <div className={clsx("break-words", compact ? "space-y-1.5" : "space-y-3", className)}>
      {blocks.map((block, b) => {
        const key = `b${b}`;
        if (block.type === "code") {
          return (
            <pre key={key} className="overflow-x-auto rounded-xl bg-surface-2 p-3 font-mono text-[13px] leading-relaxed text-ink-soft ring-1 ring-line">
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const Tag = block.type;
          return (
            <Tag
              key={key}
              start={block.type === "ol" ? block.start : undefined}
              className={clsx("space-y-1 pl-5", block.type === "ul" ? "list-disc" : "list-decimal", "marker:text-muted")}
            >
              {block.items.map((item, i) => (
                <li key={i}>{inline(item, `${key}-${i}`)}</li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={key} className="whitespace-pre-wrap">
            {inline(block.lines.join("\n"), key)}
          </p>
        );
      })}
    </div>
  );
}

/** Plain-text preview for lists and notifications. */
export function plainText(text: string): string {
  return text
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/(^|\s)[_*](\S[^_*\n]*\S|\S)[_*](?=\s|$|[.,!?])/g, "$1$2")
    .replace(/^\s*([-*•]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
