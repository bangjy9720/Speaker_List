import assert from "node:assert/strict";
import test from "node:test";

import { parseCsv, refreshSlot, renderIndex, renderSvg, TITLE_X } from "../scripts/render.mjs";

test("CSV parser handles quotes and line breaks", () => {
  assert.deepEqual(parseCsv('a,"b,b"\r\n1,2\r\n'), [["a", "b,b"], ["1", "2"]]);
});

test("refresh slots use 00:00 and 12:00 KST", () => {
  assert.deepEqual(refreshSlot(new Date("2026-08-03T15:00:00.000Z"), "12h"), {
    key: "20260804-00",
    label: "2026-08-04 00:00 KST",
  });
  assert.deepEqual(refreshSlot(new Date("2026-08-04T03:00:00.000Z"), "12h"), {
    key: "20260804-12",
    label: "2026-08-04 12:00 KST",
  });
});

test("minute mode uses the current KST minute", () => {
  assert.deepEqual(refreshSlot(new Date("2026-08-04T03:07:42.000Z"), "minute"), {
    key: "20260804-1207",
    label: "2026-08-04 12:07 KST",
  });
});

test("unknown refresh modes are rejected", () => {
  assert.throws(() => refreshSlot(new Date(), "hour"), /지원하지 않는 REFRESH_MODE/);
});

test("SVG auto-fits without ellipsis and emphasizes only selected columns", () => {
  const rows = [
    ["브랜드", "이름", "크기", "설명", "현재 가격", "역대가", "링크", "비고"],
    ["Brand", "A very long speaker model", "123", "측정 정보", "1,234,567원", "", "", "판매 중"],
  ];
  const svg = renderSvg({ title: "테스트" }, rows, "2026-08-04 00:00 KST");
  assert.equal(svg.includes("…"), false);
  assert.match(svg, /\.emphasis \{ font-weight: 700; \}/);
  assert.match(svg, /\.head \{ font-weight: 800; \}/);
  assert.match(svg, new RegExp(`<text class="title" x="${TITLE_X}"`));
  assert.match(svg, /2026-08-04 00:00 KST/);
  assert.equal(svg.includes("판매 중"), false);
});

test("index includes all five image routes", () => {
  const html = renderIndex("2026-08-04 00:00 KST");
  for (const name of ["active.svg", "small-active.svg", "bookshelf.svg", "floorstanding.svg", "amp.svg"]) {
    assert.match(html, new RegExp(name.replace(".", "\\.")));
  }
});
