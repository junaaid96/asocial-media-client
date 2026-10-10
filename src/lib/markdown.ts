// Converts between the Markdown subset aSocial stores (see RichText.tsx and the server's richtext.ts)
// and the editor's document (ProseMirror JSON). Storage stays plain Markdown, so every post written
// before the WYSIWYG editor renders exactly as it did, and the server sanitizer applies unchanged.
//
// Supported: **bold**, _italic_ / *italic*, `code`, ```code blocks```, "- " and "1. " lists,
// [links](https://…), line breaks and paragraphs. @mentions, #hashtags and bare URLs are plain text.
import { INLINE, parseBlocks } from "../components/RichText";

export interface Mark {
  type: "bold" | "italic" | "code" | "link";
  attrs?: { href: string };
}
export interface Node {
  type: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: Node[];
}

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

// ---------- Markdown → document ----------

function inlineNodes(text: string, marks: Mark[] = []): Node[] {
  const out: Node[] = [];
  const push = (t: string, m: Mark[]) => {
    if (!t) return;
    // Line breaks inside a paragraph become hard breaks.
    t.split("\n").forEach((part, i) => {
      if (i > 0) out.push({ type: "hardBreak" });
      if (part) out.push(m.length ? { type: "text", text: part, marks: m } : { type: "text", text: part });
    });
  };
  let last = 0;
  for (const match of text.matchAll(new RegExp(INLINE.source, "g"))) {
    const g = match.groups!;
    const start = match.index!;
    const token = match[0];
    push(text.slice(last, start), marks);
    if (g.code && !marks.some((m) => m.type === "code")) {
      push(token.slice(1, -1), [...marks, { type: "code" }]);
    } else if (g.link) {
      const close = token.indexOf("](");
      const href = token.slice(close + 2, -1);
      const label = token.slice(1, close);
      out.push(...inlineNodes(label, SAFE_URL.test(href) ? [...marks, { type: "link", attrs: { href } }] : marks));
    } else if (g.bold) {
      out.push(...inlineNodes(token.slice(2, -2), [...marks, { type: "bold" }]));
    } else if (g.italic) {
      out.push(...inlineNodes(token.slice(1, -1), [...marks, { type: "italic" }]));
    } else {
      push(token, marks); // url, mention, hashtag: plain text
    }
    last = start + token.length;
  }
  push(text.slice(last), marks);
  return out;
}

/** Joins neighbouring text nodes that carry the same marks (as ProseMirror would). */
function merge(nodes: Node[]): Node[] {
  const out: Node[] = [];
  for (const node of nodes) {
    const prev = out.at(-1);
    if (prev?.type === "text" && node.type === "text" && JSON.stringify(prev.marks ?? []) === JSON.stringify(node.marks ?? [])) {
      out[out.length - 1] = { ...prev, text: prev.text! + node.text! };
    } else out.push(node);
  }
  return out;
}

const paragraph = (text: string): Node => {
  const content = merge(inlineNodes(text));
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
};

export function markdownToDoc(markdown: string): Node {
  const content: Node[] = [];
  for (const block of parseBlocks(markdown ?? "")) {
    if (block.type === "p") content.push(paragraph(block.lines.join("\n")));
    else if (block.type === "code") content.push({ type: "codeBlock", content: block.text ? [{ type: "text", text: block.text }] : undefined });
    else {
      const items = block.items.map((item) => ({ type: "listItem", content: [paragraph(item)] }));
      content.push(block.type === "ul" ? { type: "bulletList", content: items } : { type: "orderedList", attrs: { start: block.start }, content: items });
    }
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// ---------- document → Markdown ----------

const ORDER: Mark["type"][] = ["link", "bold", "italic", "code"];
const WORD = /[\p{L}\p{N}_]/u;

const markOf = (node: Node, type: Mark["type"]) => node.marks?.find((m) => m.type === type);
const sameRun = (a: Node, b: Node, type: Mark["type"]) => {
  const ma = markOf(a, type);
  const mb = markOf(b, type);
  if (!ma || !mb) return !ma && !mb;
  return type !== "link" || ma.attrs?.href === mb.attrs?.href;
};
const rawText = (nodes: Node[], breaks: string) => nodes.map((n) => (n.type === "hardBreak" ? breaks : (n.text ?? ""))).join("");

/** Wraps text in delimiters, keeping edge whitespace outside so the markers always render. */
function wrap(inner: string, open: string, close = open) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)!;
  if (!m[2]) return inner;
  return `${m[1]}${open}${m[2]}${close}${m[3]}`;
}

function serializeInline(nodes: Node[], breaks: string, level = 0): string {
  if (level >= ORDER.length) return rawText(nodes, breaks);
  const type = ORDER[level]!;
  // Split into runs that share this mark (and, for links, the same href).
  const runs: Node[][] = [];
  for (const node of nodes) {
    const run = runs.at(-1);
    if (run && sameRun(run[0]!, node, type) && node.type !== "hardBreak" && run[0]!.type !== "hardBreak") run.push(node);
    else runs.push([node]);
  }
  let out = "";
  runs.forEach((run, i) => {
    const mark = run[0]!.type === "text" ? markOf(run[0]!, type) : undefined;
    if (!mark) {
      out += serializeInline(run, breaks, level + 1);
      return;
    }
    const inner = serializeInline(run, breaks, level + 1);
    if (type === "code") {
      const text = rawText(run, " ");
      out += text.includes("`") ? text : wrap(text, "`");
    } else if (type === "bold") {
      out += wrap(inner, "**");
    } else if (type === "italic") {
      // "_" only where it can't be mistaken for snake_case; inside a word use "*".
      const before = out.at(-1) ?? "";
      const after = runs[i + 1] ? rawText(runs[i + 1]!, breaks).charAt(0) : "";
      const intraword = WORD.test(before) || WORD.test(after) || inner.includes("_");
      out += wrap(inner, intraword ? "*" : "_");
    } else {
      const href = mark.attrs?.href ?? "";
      out += SAFE_URL.test(href) && !/[\]\n]/.test(inner) && inner.trim() ? `[${inner}](${href.replace(/\s/g, "%20")})` : inner;
    }
  });
  return out;
}

function serializeBlock(node: Node, out: string[]) {
  switch (node.type) {
    case "paragraph":
      out.push(serializeInline(node.content ?? [], "\n"));
      break;
    case "codeBlock":
      out.push("```\n" + rawText(node.content ?? [], "\n") + "\n```");
      break;
    case "bulletList":
    case "orderedList": {
      // The stored format has flat lists: nested items are flattened, and an item is one line.
      const lines: string[] = [];
      let n = Number(node.attrs?.start ?? 1) || 1;
      const walk = (list: Node) => {
        for (const item of list.content ?? []) {
          for (const child of item.content ?? []) {
            if (child.type === "bulletList" || child.type === "orderedList") walk(child);
            else {
              const text = child.type === "paragraph" ? serializeInline(child.content ?? [], " ") : rawText(child.content ?? [], " ");
              lines.push(`${node.type === "bulletList" ? "- " : `${n++}. `}${text}`);
            }
          }
        }
      };
      walk(node);
      out.push(lines.join("\n"));
      break;
    }
    default:
      if (node.content) node.content.forEach((child) => serializeBlock(child, out));
  }
}

export function docToMarkdown(doc: Node): string {
  const out: string[] = [];
  for (const node of doc.content ?? []) serializeBlock(node, out);
  // Empty paragraphs are just spacing while typing; the stored text keeps at most one blank line.
  return out
    .filter((block) => block.trim())
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
