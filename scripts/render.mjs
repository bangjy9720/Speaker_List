import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const SPREADSHEET_ID = "1vx8GieHULsCZdPFP9p-5fH4Kex5pzYZJdL9SwWa8Cqs";

export const LISTS = {
  "active.svg": { title: "액티브 스피커", gid: "0" },
  "small-active.svg": { title: "액티브 스피커 · 소형", gid: "1357053470" },
  "bookshelf.svg": { title: "패시브 스피커 · 북쉘프", gid: "57397418" },
  "floorstanding.svg": { title: "패시브 스피커 · 톨보이", gid: "2131659748" },
  "amp.svg": { title: "앰프", gid: "1689402700" },
};

const VISIBLE_COLUMNS = [0, 1, 2, 3, 4];
const FONT_SIZE = 17;
const FONT_WEIGHT = 700;
const NORMAL_FONT_WEIGHT = 400;
const EMPHASIZED_COLUMNS = new Set([0, 1, 4]);
const HEADER_HEIGHT = 58;
const TITLE_HEIGHT = 66;
// 제목의 왼쪽 여백(px). 숫자를 키우면 제목이 오른쪽으로 이동합니다.
export const TITLE_X = 14;
const DEFAULT_REFRESH_MODE = "12h";

export function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

export function displayUnits(value) {
  let units = 0;
  for (const char of value) {
    units += /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af]/u.test(char) ? 2 : 1;
  }
  return units;
}

function activeRows(rows) {
  const output = [];
  for (const source of rows) {
    const sourceRow = Array.from({ length: 8 }, (_, index) => source[index] ?? "");
    const isEmpty = sourceRow.every((cell) => !String(cell).trim());
    if (isEmpty && output.length > 1) break;
    if (!isEmpty) output.push(VISIBLE_COLUMNS.map((index) => sourceRow[index]));
  }
  return output;
}

export function refreshSlot(date = new Date(), mode = process.env.REFRESH_MODE ?? DEFAULT_REFRESH_MODE) {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const shifted = new Date(date.getTime() + kstOffsetMs);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  const two = (value) => String(value).padStart(2, "0");
  const actualLabel = `${year}-${two(month + 1)}-${two(day)} ${two(hour)}:${two(minute)} KST`;

  // 테스트용 분 단위 모드입니다. GitHub Actions 예약 실행 자체는 최소 5분 간격입니다.
  if (mode === "minute") {
    return {
      key: `${year}${two(month + 1)}${two(day)}-${two(hour)}${two(minute)}`,
      label: actualLabel,
    };
  }

  if (mode !== "12h") {
    throw new Error(`지원하지 않는 REFRESH_MODE: ${mode}`);
  }

  const slotHour = hour < 12 ? 0 : 12;
  return {
    key: `${year}${two(month + 1)}${two(day)}-${two(slotHour)}`,
    label: actualLabel,
  };
}

function normalizedLines(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .slice(0, 2)
    .map((line) => line.replace(/\s+/g, " ").trim());
}

export function autoFitWidths(tableRows, fontSize = FONT_SIZE) {
  return VISIBLE_COLUMNS.map((_, column) => {
    let longest = 0;
    for (const row of tableRows) {
      for (const line of normalizedLines(row[column])) {
        longest = Math.max(longest, displayUnits(line));
      }
    }
    return Math.max(60, Math.ceil(longest * fontSize * 0.54 + 16));
  });
}

function textCell(value, x, y, width, height, options = {}) {
  const fontSize = options.fontSize ?? FONT_SIZE;
  const lines = normalizedLines(value);
  const lineHeight = fontSize + 3;
  const firstY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.34;
  const tspans = lines
    .map((line, index) => `<tspan x="${x + width / 2}" y="${firstY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<text class="${options.className ?? "cell"}" font-size="${fontSize}" text-anchor="middle">${tspans}</text>`;
}

export function renderSvg(config, rows, timestamp) {
  const tableRows = activeRows(rows);
  if (tableRows.length < 2) throw new Error("표 데이터가 비어 있습니다.");

  const widths = autoFitWidths(tableRows, FONT_SIZE);
  const rowHeight = Math.max(42, 2 * (FONT_SIZE + 3) + 2);
  const footerHeight = Math.max(36, FONT_SIZE + 19);
  const canvasWidth = widths.reduce((sum, value) => sum + value, 0) + 2;
  const height = TITLE_HEIGHT + HEADER_HEIGHT + (tableRows.length - 1) * rowHeight + footerHeight + 2;
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${height}" viewBox="0 0 ${canvasWidth} ${height}">
  <style>
    text { font-family: "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif; fill: #171717; }
    .title { font-size: ${FONT_SIZE + 10}px; font-weight: 900; }
    .sub { font-size: ${FONT_SIZE - 2}px; font-weight: ${NORMAL_FONT_WEIGHT}; fill: #555; }
    .head { font-weight: 800; }
    .cell { font-weight: ${NORMAL_FONT_WEIGHT}; }
    .emphasis { font-weight: ${FONT_WEIGHT}; }
    .foot { font-size: ${FONT_SIZE - 3}px; font-weight: ${NORMAL_FONT_WEIGHT}; fill: #555; }
  </style>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text class="title" x="${TITLE_X}" y="36">${escapeXml(config.title)}</text>
  <text class="sub" x="${canvasWidth - 1}" y="36" text-anchor="end">Google Sheets 연동 · ${escapeXml(timestamp)} 기준</text>`;

  let y = TITLE_HEIGHT;
  let x = 1;
  for (let column = 0; column < VISIBLE_COLUMNS.length; column += 1) {
    const width = widths[column];
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${HEADER_HEIGHT}" fill="#e8eaed" stroke="#5f6368"/>`;
    svg += textCell(tableRows[0][column], x, y, width, HEADER_HEIGHT, { className: "head" });
    x += width;
  }

  y += HEADER_HEIGHT;
  for (let rowIndex = 1; rowIndex < tableRows.length; rowIndex += 1) {
    x = 1;
    for (let column = 0; column < VISIBLE_COLUMNS.length; column += 1) {
      const width = widths[column];
      const fill = column === 4 ? "#fff2cc" : rowIndex % 2 ? "#ffffff" : "#f8f9fa";
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${rowHeight}" fill="${fill}" stroke="#9aa0a6"/>`;
      svg += textCell(tableRows[rowIndex][column], x, y, width, rowHeight, {
        className: EMPHASIZED_COLUMNS.has(column) ? "emphasis" : "cell",
      });
      x += width;
    }
    y += rowHeight;
  }

  svg += `<rect x="1" y="${y}" width="${canvasWidth - 2}" height="${footerHeight}" fill="#f1f3f4" stroke="#9aa0a6"/>
  <text class="foot" x="14" y="${y + Math.round(footerHeight / 2 + (FONT_SIZE - 3) * 0.34)}">가격은 참고용이며 최종 결제 전 구매자가 판매·재고·조건을 직접 확인해야 합니다.</text>
</svg>`;
  return svg;
}

async function fetchRows(config, slot) {
  const source = new URL(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export`);
  source.searchParams.set("format", "csv");
  source.searchParams.set("gid", config.gid);
  source.searchParams.set("range", "A1:H100");
  source.searchParams.set("_", slot.key);
  const response = await fetch(source, {
    redirect: "follow",
    headers: { "user-agent": "speaker-list-image-renderer/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google Sheets 응답 ${response.status}`);
  const text = await response.text();
  if (/<!doctype html|<html/i.test(text.slice(0, 300))) {
    throw new Error("원본 시트의 공개 CSV를 받지 못했습니다.");
  }
  return parseCsv(text);
}

export function renderIndex(timestamp) {
  const cards = Object.entries(LISTS)
    .map(([file, config]) => `<section><h2>${escapeXml(config.title)}</h2><img src="./${file}" alt="${escapeXml(config.title)} 추천목록"></section>`)
    .join("\n      ");
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>스피커 추천목록 이미지</title>
    <style>
      body { margin: 0; background: #f4f5f7; color: #171717; font-family: system-ui, sans-serif; }
      main { width: min(1480px, calc(100% - 24px)); margin: 28px auto 60px; }
      p { color: #555; }
      section { margin-top: 28px; padding: 14px; border: 1px solid #d9dce1; border-radius: 12px; background: white; overflow-x: auto; }
      h2 { margin: 4px 0 12px; font-size: 18px; }
      img { display: block; width: 100%; min-width: 900px; height: auto; }
    </style>
  </head>
  <body><main>
    <h1>스피커 추천목록 이미지</h1>
    <p>${escapeXml(timestamp)} 기준 · 매일 00:00와 12:00 KST에 자동 생성</p>
      ${cards}
  </main></body>
</html>`;
}

export async function main(now = new Date()) {
  const outputDir = fileURLToPath(new URL("../docs/", import.meta.url));
  const slot = refreshSlot(now);
  await mkdir(outputDir, { recursive: true });

  for (const [file, config] of Object.entries(LISTS)) {
    const rows = await fetchRows(config, slot);
    await writeFile(new URL(`../docs/${file}`, import.meta.url), renderSvg(config, rows, slot.label));
  }
  await writeFile(new URL("../docs/index.html", import.meta.url), renderIndex(slot.label));
  await writeFile(new URL("../docs/.nojekyll", import.meta.url), "");
  await writeFile(new URL("../docs/status.json", import.meta.url), `${JSON.stringify({ updated_at: slot.label, source: SPREADSHEET_ID }, null, 2)}\n`);
  console.log(`Rendered ${Object.keys(LISTS).length} images for ${slot.label}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
