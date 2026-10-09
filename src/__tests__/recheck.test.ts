import { describe, expect, it } from "vitest";
import { lookupAt } from "../components/RichEditor";
import { resolveWsUrl } from "../lib/realtime";
import { formatClock, reminderStep } from "../lib/usage";
import { shiftDay } from "../pages/PromptAnswers";

describe("editor autocomplete", () => {
  it("detects an @mention or #hashtag being typed at the caret", () => {
    expect(lookupAt("hi @Ma", 6)).toEqual({ kind: "user", q: "ma" });
    expect(lookupAt("calm #Rain", 10)).toEqual({ kind: "tag", q: "rain" });
    expect(lookupAt("(#tea", 5)).toEqual({ kind: "tag", q: "tea" });
    // Not inside a word, and not after the caret moved on.
    expect(lookupAt("email@host", 10)).toBeNull();
    expect(lookupAt("a#b", 3)).toBeNull();
    expect(lookupAt("#tea and", 8)).toBeNull();
  });
});

describe("websocket url", () => {
  it("derives /ws from the API url, including on Vercel", () => {
    expect(resolveWsUrl("https://asocial-media-server.vercel.app", undefined)).toBe("wss://asocial-media-server.vercel.app/ws");
    expect(resolveWsUrl("http://localhost:5000", undefined)).toBe("ws://localhost:5000/ws");
  });
  it("lets VITE_WS_URL override, and an empty value turn sockets off", () => {
    expect(resolveWsUrl("http://localhost:5000", "")).toBeNull();
    expect(resolveWsUrl("http://localhost:5000", "  ")).toBeNull();
    expect(resolveWsUrl("http://localhost:5000", "wss://live.example.com/ws")).toBe("wss://live.example.com/ws");
    expect(resolveWsUrl("not a url", undefined)).toBeNull();
  });
});

describe("session time", () => {
  it("formats the session clock compactly", () => {
    expect(formatClock(59)).toBe("0 min");
    expect(formatClock(12 * 60)).toBe("12 min");
    expect(formatClock(65 * 60)).toBe("1:05 h");
  });
  it("counts reminder steps passed", () => {
    expect(reminderStep(10 * 60, null)).toBe(0);
    expect(reminderStep(19 * 60, 20)).toBe(0);
    expect(reminderStep(20 * 60, 20)).toBe(1);
    expect(reminderStep(61 * 60, 20)).toBe(3);
  });
});

describe("prompt navigation", () => {
  it("moves between days, across months and years", () => {
    expect(shiftDay("2026-10-09", -1)).toBe("2026-10-08");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("ably presence watch list", () => {
  const partner = (n: number) => ({ userId: `u${n}`, username: `p${n}`, conversationId: `c${n}`, presence: `asocial:presence:u${n}` });
  it("watches new partners only, most recent first, within the limit", async () => {
    const { partnersToWatch } = await import("../lib/realtime");
    const partners = [partner(1), partner(2), partner(3)];
    expect(partnersToWatch(new Set(["u1"]), partners).map((p) => p.userId)).toEqual(["u2", "u3"]);
    expect(partnersToWatch(new Set(["u9"]), partners, 2).map((p) => p.userId)).toEqual(["u1"]);
    expect(partnersToWatch(new Set(["a", "b"]), partners, 2)).toEqual([]);
  });
});
