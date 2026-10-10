import { describe, expect, it } from "vitest";
import { docToMarkdown, markdownToDoc, type Node } from "../lib/markdown";

const t = (text: string, ...marks: Node["marks"] & object[]): Node => (marks.length ? { type: "text", text, marks } : { type: "text", text });
const p = (...content: Node[]): Node => ({ type: "paragraph", content });
const doc = (...content: Node[]): Node => ({ type: "doc", content });
const bold = { type: "bold" as const };
const italic = { type: "italic" as const };
const code = { type: "code" as const };
const link = (href: string) => ({ type: "link" as const, attrs: { href } });

describe("markdown → editor document", () => {
  it("parses marks, links, line breaks and keeps mentions/hashtags/urls as text", () => {
    expect(markdownToDoc("**Hi** _there_ `x` [site](https://a.b) @maya #tea https://x.y/a_b\nnext")).toEqual(
      doc(
        p(
          t("Hi", bold),
          t(" "),
          t("there", italic),
          t(" "),
          t("x", code),
          t(" "),
          t("site", link("https://a.b")),
          t(" @maya #tea https://x.y/a_b"),
          { type: "hardBreak" },
          t("next"),
        ),
      ),
    );
  });

  it("parses nested marks, lists and code blocks", () => {
    expect(markdownToDoc("**a _b_**\n\n- one\n- **two**\n\n3. three\n\n```\nlet a = 1;\n  b();\n```")).toEqual(
      doc(
        p(t("a ", bold), t("b", bold, italic)),
        { type: "bulletList", content: [{ type: "listItem", content: [p(t("one"))] }, { type: "listItem", content: [p(t("two", bold))] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(t("three"))] }] },
        { type: "codeBlock", content: [t("let a = 1;\n  b();")] },
      ),
    );
  });

  it("drops unsafe link targets but keeps the label", () => {
    expect(markdownToDoc("[x](javascript:alert(1))")).toEqual(doc(p(t("x"))));
  });

  it("leaves snake_case, emoji and Bangla alone", () => {
    const text = "snake_case_name 👨‍👩‍👧 আমি বাংলায় লিখি র‍্যাব";
    expect(markdownToDoc(text)).toEqual(doc(p(t(text))));
  });
});

describe("editor document → markdown", () => {
  it("serializes marks, keeping edge spaces outside the markers", () => {
    expect(docToMarkdown(doc(p(t("make "), t("word ", bold), t("bold"))))).toBe("make **word** bold");
    expect(docToMarkdown(doc(p(t("a "), t("b", bold, italic), t(" c"))))).toBe("a **_b_** c");
  });

  it("uses * for italic inside a word and _ elsewhere", () => {
    expect(docToMarkdown(doc(p(t("un"), t("believ", italic), t("able"))))).toBe("un*believ*able");
    expect(docToMarkdown(doc(p(t("so "), t("calm", italic), t("."))))).toBe("so _calm_.");
    expect(docToMarkdown(doc(p(t("snake_case", italic))))).toBe("*snake_case*");
  });

  it("serializes links, code, line breaks, paragraphs, lists and code blocks", () => {
    const d = doc(
      p(t("see "), t("this", link("https://a.b/c")), t(" and "), t("x()", code), { type: "hardBreak" }, t("next")),
      p(),
      p(),
      { type: "bulletList", content: [{ type: "listItem", content: [p(t("one"))] }, { type: "listItem", content: [p(t("two", bold)), { type: "bulletList", content: [{ type: "listItem", content: [p(t("nested"))] }] }] }] },
      { type: "orderedList", attrs: { start: 1 }, content: [{ type: "listItem", content: [p(t("a"))] }, { type: "listItem", content: [p(t("b"))] }] },
      { type: "codeBlock", content: [t("  keep\n  indent")] },
    );
    expect(docToMarkdown(d)).toBe("see [this](https://a.b/c) and `x()`\nnext\n\n- one\n- **two**\n- nested\n\n1. a\n2. b\n\n```\n  keep\n  indent\n```");
  });

  it("round-trips stored markdown unchanged", () => {
    for (const md of [
      "**Bold**, _italic_, `code` and [a link](https://example.com).",
      "Line one\nline two\n\nNew paragraph with @maya and #calm",
      "- one\n- two\n\n1. first\n2. second",
      "```\nconst a = b < c;\n```",
      "un*believ*able and **bold _italic_**",
      "👨‍👩‍👧 আমি বাংলায় লিখি, snake_case and List<String>",
    ]) {
      expect(docToMarkdown(markdownToDoc(md))).toBe(md);
    }
  });
});
