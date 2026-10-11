import { describe, expect, it } from "vitest";
import { clockTime, dayDiff, dayLabel, sameGroup, shortAgo, stampLabel } from "../lib/format";
import { onlineContacts } from "../lib/online";
import type { Conversation } from "../lib/types";

const at = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi);
const iso = (d: Date) => d.toISOString();
const now = at(2026, 10, 11, 15, 0);

describe("chat timestamps", () => {
  it("labels days as Today, Yesterday or a dated label", () => {
    expect(dayLabel(iso(at(2026, 10, 11, 0, 5)), now, "en-US")).toBe("Today");
    expect(dayLabel(iso(at(2026, 10, 10, 23, 59)), now, "en-US")).toBe("Yesterday");
    expect(dayLabel(iso(at(2026, 10, 9, 9)), now, "en-US")).toBe("Oct 9, 2026");
    expect(dayDiff(at(2026, 12, 31, 23), at(2027, 1, 1, 1))).toBe(1);
  });

  it("formats clock times in the reader's locale", () => {
    expect(clockTime(iso(at(2026, 10, 11, 15, 42)), "en-US")).toBe("3:42 PM");
    expect(clockTime(iso(at(2026, 10, 11, 15, 42)), "en-GB")).toBe("15:42");
    expect(stampLabel(iso(at(2026, 10, 11, 9, 5)), now, "en-US")).toBe("9:05 AM");
    expect(stampLabel(iso(at(2026, 10, 10, 9, 5)), now, "en-US")).toBe("Yesterday, 9:05 AM");
  });

  it("gives compact conversation-list times", () => {
    expect(shortAgo(iso(at(2026, 10, 11, 14, 59)), now, "en-US")).toBe("1m");
    expect(shortAgo(iso(now), now, "en-US")).toBe("now");
    expect(shortAgo(iso(at(2026, 10, 11, 12, 0)), now, "en-US")).toBe("3h");
    expect(shortAgo(iso(at(2026, 10, 10, 20)), now, "en-US")).toBe("Yesterday");
    expect(shortAgo(iso(at(2026, 10, 7)), now, "en-US")).toBe("Wed");
    expect(shortAgo(iso(at(2026, 9, 1)), now, "en-US")).toBe("Sep 1");
    expect(shortAgo(iso(at(2025, 9, 1)), now, "en-US")).toBe("Sep 1, 2025");
  });

  it("groups messages from one sender within five minutes on the same day", () => {
    const m = (sender: string, d: Date) => ({ sender, createdAt: iso(d) });
    expect(sameGroup(m("a", at(2026, 10, 11, 10, 0)), m("a", at(2026, 10, 11, 10, 4)))).toBe(true);
    expect(sameGroup(m("a", at(2026, 10, 11, 10, 0)), m("a", at(2026, 10, 11, 10, 6)))).toBe(false);
    expect(sameGroup(m("a", at(2026, 10, 11, 10, 0)), m("b", at(2026, 10, 11, 10, 1)))).toBe(false);
    expect(sameGroup(m("a", at(2026, 10, 10, 23, 58)), m("a", at(2026, 10, 11, 0, 1)))).toBe(false);
  });
});

describe("online contacts", () => {
  const conv = (id: string, username: string, online: boolean, canMessage = true) =>
    ({ id, other: { username, displayName: username, online, lastSeenAt: null }, lastMessage: null, unread: 0, canMessage, updatedAt: "" }) as unknown as Conversation;

  it("counts only people the user can message, preferring live presence", () => {
    const list = [conv("1", "maya", true), conv("2", "ravi", false), conv("3", "blocked", true, false), conv("4", "tia", true)];
    expect(onlineContacts(list, {}).map((c) => c.other.username)).toEqual(["maya", "tia"]);
    const live = { ravi: { online: true, lastSeenAt: null }, tia: { online: false, lastSeenAt: "x" } };
    expect(onlineContacts(list, live).map((c) => c.other.username)).toEqual(["maya", "ravi"]);
  });
});
