import assert from "node:assert/strict";
import test from "node:test";

import { extractPriceCheckedDate, parseCsv, refreshSlot, renderIndex, renderSvg, TITLE_X } from "../scripts/render.mjs";

test("CSV parser handles quotes and line breaks", () => {
  assert.deepEqual(parseCsv('a,"b,b"\r\n1,2\r\n'), [["a", "b,b"], ["1", "2"]]);
});

test("12-hour mode keeps slot keys but labels the actual execution minute", () => {
  assert.deepEqual(refreshSlot(new Date("2026-08-03T15:07:42.000Z"), "12h"), {
    key: "20260804-00",
    label: "2026-08-04 00:07 KST",
  });
  assert.deepEqual(refreshSlot(new Date("2026-08-04T03:34:11.000Z"), "12h"), {
    key: "20260804-12",
    label: "2026-08-04 12:34 KST",
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

test("price check date comes from the sheet footer note", () => {
  const rows = [
    ["브랜드", "이름"],
    ["Brand", "Model"],
    [],
    ["· 해당 열의 가격은 현 시점 국내 온라인 최저가입니다. [2026-08-03]  * 네이버 스마트스토어 기준"],
  ];
  assert.equal(extractPriceCheckedDate(rows), "2026-08-03");
});

test("missing price check date is rejected instead of using render time", () => {
  assert.throws(
    () => extractPriceCheckedDate([["해당 열의 가격은 현 시점 국내 온라인 최저가입니다."]]),
    /가격 확인일을 찾을 수 없습니다/,
  );
});

test("SVG auto-fits without ellipsis and emphasizes only selected columns", () => {
  const rows = [
    ["브랜드", "이름", "크기", "설명", "현재 가격", "역대가", "링크", "비고"],
    ["Brand", "A very long speaker model", "123", "측정 정보", "1,234,567원", "", "", "판매 중"],
    [],
    ["· 해당 열의 가격은 현 시점 국내 온라인 최저가입니다. [2026-08-03]  * 네이버 스마트스토어 기준"],
  ];
  const svg = renderSvg({ title: "테스트" }, rows, "2026-08-04 00:00 KST");
  assert.equal(svg.includes("…"), false);
  assert.match(svg, /\.emphasis \{ font-weight: 700; \}/);
  assert.match(svg, /\.head \{ font-weight: 800; \}/);
  assert.match(svg, new RegExp(`<text class="title" x="${TITLE_X}"`));
  assert.match(svg, /가격 확인일 · 2026-08-03/);
  assert.match(svg, /2026-08-04 00:00 KST/);
  assert.equal(svg.includes("Google Sheets 연동 · 2026-08-04 00:00 KST 기준"), false);
  assert.ok(svg.indexOf("Google Sheets 연동 시각") > svg.indexOf("가격은 참고용이며"));
  assert.equal(svg.includes("판매 중"), false);
});

test("index includes all five image routes", () => {
  const html = renderIndex("2026-08-04 00:00 KST");
  for (const name of ["active.svg", "small-active.svg", "bookshelf.svg", "floorstanding.svg", "amp.svg"]) {
    assert.match(html, new RegExp(name.replace(".", "\\.")));
  }
});
