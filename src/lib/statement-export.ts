export type StatementKind = "inflow" | "outflow" | "processing";

export type StatementExportRow = {
  at: string;
  title: string;
  party: string;
  method: string;
  ref: string;
  kind: StatementKind;
  amount: number;
  balance: number;
  status: string;
};

export type StatementExport = {
  periodLabel: string;
  generatedAt: string;
  statementNo: string;
  opening: number;
  closing: number;
  inflow: number;
  outflow: number;
  processing: number;
  rows: StatementExportRow[];
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const RED = "0.882 0.114 0.180";
const INK = "0.09 0.09 0.09";
const MUTED = "0.42 0.42 0.42";
const LINE = "0.86 0.86 0.86";
const WASH = "0.965 0.965 0.965";
const GREEN = "0.016 0.471 0.341";
const CRIMSON = "0.725 0.110 0.110";
const WHITE = "1 1 1";

const COL = {
  date: MARGIN,
  particular: 108,
  method: 292,
  debit: 352,
  credit: 430,
  balance: PAGE_W - MARGIN,
};

const HELV_W = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
  556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
  260, 334, 584,
];

function latin(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function pdfEscape(value: string) {
  return latin(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function widthOf(text: string, size: number, bold = false) {
  let w = 0;
  for (const ch of latin(text)) {
    const code = ch.charCodeAt(0);
    w += code >= 32 && code <= 126 ? HELV_W[code - 32]! : 500;
  }
  return (w * size) / 1000 * (bold ? 1.06 : 1);
}

function fit(text: string, max: number, size: number, bold = false) {
  const clean = latin(text);
  if (widthOf(clean, size, bold) <= max) return clean;
  let next = clean;
  while (next.length && widthOf(`${next}...`, size, bold) > max) next = next.slice(0, -1);
  return `${next}...`;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.round(amount * 100) / 100);
}

function moneyLabel(amount: number) {
  return `BDT ${money(amount)}`;
}

function dayLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function n(value: number) {
  return value.toFixed(2);
}

function rect(x: number, y: number, w: number, h: number, fill?: string, stroke?: string, sw = 0.6) {
  const ops: string[] = [];
  if (fill) ops.push(`${fill} rg`);
  if (stroke) ops.push(`${stroke} RG ${sw} w`);
  ops.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re`);
  ops.push(fill && stroke ? "B" : fill ? "f" : "S");
  return ops.join("\n");
}

function line(x1: number, y1: number, x2: number, y2: number, color = LINE, sw = 0.5) {
  return `${color} RG ${sw} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`;
}

function text(x: number, y: number, value: string, size: number, opts?: { bold?: boolean; color?: string }) {
  const font = opts?.bold ? "F2" : "F1";
  const color = opts?.color ?? INK;
  return `${color} rg\nBT /${font} ${size} Tf ${n(x)} ${n(y)} Td (${pdfEscape(value)}) Tj ET`;
}

function textRight(xRight: number, y: number, value: string, size: number, opts?: { bold?: boolean; color?: string }) {
  const w = widthOf(value, size, opts?.bold);
  return text(xRight - w, y, value, size, opts);
}

function headerBlock(model: StatementExport, page: number, pages: number) {
  const ops: string[] = [];
  const top = PAGE_H - 28;
  ops.push(rect(0, PAGE_H - 8, PAGE_W, 8, RED));
  ops.push(rect(MARGIN, top - 18, 16, 16, RED));
  ops.push(text(MARGIN + 4.6, top - 14, "i", 12, { bold: true, color: WHITE }));
  ops.push(text(MARGIN + 22, top - 14, "iCash Exchange", 14, { bold: true }));
  ops.push(textRight(PAGE_W - MARGIN, top - 6, "CONFIDENTIAL", 7, { bold: true, color: RED }));
  ops.push(textRight(PAGE_W - MARGIN, top - 18, "Reseller desk | Asia/Dhaka", 8, { color: MUTED }));
  ops.push(line(MARGIN, top - 28, PAGE_W - MARGIN, top - 28, RED, 1.6));
  ops.push(text(MARGIN, top - 48, "STATEMENT OF ACCOUNT", 16, { bold: true }));
  ops.push(text(MARGIN, top - 62, "Computer-generated ledger of deposits, iCash debits and payouts.", 8, { color: MUTED }));
  ops.push(textRight(PAGE_W - MARGIN, top - 48, model.statementNo, 9, { bold: true }));
  ops.push(textRight(PAGE_W - MARGIN, top - 62, `Page ${page} of ${pages}`, 8, { color: MUTED }));

  const boxY = top - 118;
  const boxW = (PAGE_W - MARGIN * 2 - 16) / 3;
  const boxes = [
    { label: "Account", value: "iCash Exchange desk" },
    { label: "Statement period", value: model.periodLabel },
    { label: "Generated", value: model.generatedAt },
  ];
  boxes.forEach((box, i) => {
    const x = MARGIN + i * (boxW + 8);
    ops.push(rect(x, boxY, boxW, 38, WHITE, LINE));
    ops.push(text(x + 8, boxY + 24, box.label.toUpperCase(), 6.5, { bold: true, color: MUTED }));
    ops.push(text(x + 8, boxY + 10, fit(box.value, boxW - 16, 9, true), 9, { bold: true }));
  });

  const kpiY = top - 168;
  const kpiW = (PAGE_W - MARGIN * 2 - 18) / 4;
  const kpis = [
    { label: "Opening balance", value: moneyLabel(model.opening), color: INK },
    { label: "Total credit", value: moneyLabel(model.inflow), color: GREEN },
    { label: "Total debit", value: moneyLabel(model.outflow), color: CRIMSON },
    { label: "Closing balance", value: moneyLabel(model.closing), color: INK },
  ];
  kpis.forEach((kpi, i) => {
    const x = MARGIN + i * (kpiW + 6);
    ops.push(rect(x, kpiY, kpiW, 42, i === 3 ? "0.996 0.961 0.961" : WASH, i === 3 ? RED : LINE, i === 3 ? 1.1 : 0.6));
    ops.push(text(x + 7, kpiY + 28, kpi.label.toUpperCase(), 6, { bold: true, color: MUTED }));
    ops.push(text(x + 7, kpiY + 12, fit(kpi.value, kpiW - 12, 10, true), 10, { bold: true, color: kpi.color }));
  });

  return { ops, tableTop: kpiY - 14 };
}

function compactHeader(model: StatementExport, page: number, pages: number) {
  const ops: string[] = [];
  const top = PAGE_H - 28;
  ops.push(rect(0, PAGE_H - 8, PAGE_W, 8, RED));
  ops.push(text(MARGIN, top - 10, "iCash Exchange  ·  Statement of account", 10, { bold: true }));
  ops.push(textRight(PAGE_W - MARGIN, top - 10, `Page ${page} of ${pages}`, 8, { color: MUTED }));
  ops.push(line(MARGIN, top - 18, PAGE_W - MARGIN, top - 18, RED, 1.2));
  ops.push(text(MARGIN, top - 32, model.periodLabel, 8, { color: MUTED }));
  ops.push(textRight(PAGE_W - MARGIN, top - 32, `Closing ${moneyLabel(model.closing)}`, 8, { bold: true }));
  return { ops, tableTop: top - 46 };
}

function tableHead(y: number) {
  const h = 18;
  const ops = [
    rect(MARGIN, y - h + 4, PAGE_W - MARGIN * 2, h, INK),
    text(COL.date + 6, y - 8, "DATE", 7, { bold: true, color: WHITE }),
    text(COL.particular, y - 8, "PARTICULARS", 7, { bold: true, color: WHITE }),
    text(COL.method, y - 8, "METHOD", 7, { bold: true, color: WHITE }),
    textRight(COL.debit + 62, y - 8, "DEBIT", 7, { bold: true, color: WHITE }),
    textRight(COL.credit + 62, y - 8, "CREDIT", 7, { bold: true, color: WHITE }),
    textRight(COL.balance, y - 8, "BALANCE", 7, { bold: true, color: WHITE }),
  ];
  return { ops, nextY: y - h - 2 };
}

function tableRow(y: number, row: StatementExportRow, zebra: boolean) {
  const h = 28;
  const ops: string[] = [];
  if (zebra) ops.push(rect(MARGIN, y - h + 4, PAGE_W - MARGIN * 2, h, WASH));
  ops.push(line(MARGIN, y - h + 4, PAGE_W - MARGIN, y - h + 4, LINE, 0.4));
  ops.push(text(COL.date + 6, y - 8, dayLabel(row.at), 8, { bold: true }));
  ops.push(text(COL.date + 6, y - 19, timeLabel(row.at), 7, { color: MUTED }));
  ops.push(text(COL.particular, y - 8, fit(row.title, 176, 8, true), 8, { bold: true }));
  ops.push(text(COL.particular, y - 19, fit(`${row.party} | ${row.ref}`, 176, 7), 7, { color: MUTED }));
  ops.push(text(COL.method, y - 12, fit(row.method, 56, 7.5), 7.5));
  if (row.kind === "outflow") {
    ops.push(textRight(COL.debit + 62, y - 12, money(row.amount), 8, { bold: true, color: CRIMSON }));
  } else if (row.kind === "inflow") {
    ops.push(textRight(COL.credit + 62, y - 12, money(row.amount), 8, { bold: true, color: GREEN }));
  } else {
    ops.push(textRight(COL.credit + 62, y - 12, "Pending", 8, { color: MUTED }));
  }
  ops.push(
    textRight(COL.balance, y - 12, row.kind === "processing" ? "—" : money(row.balance), 8, {
      bold: true,
    }),
  );
  return { ops, nextY: y - h };
}

function openingRow(y: number, opening: number) {
  const h = 22;
  const ops = [
    rect(MARGIN, y - h + 4, PAGE_W - MARGIN * 2, h, "0.96 0.96 0.97"),
    text(COL.date + 6, y - 10, "Opening balance brought forward", 8, { bold: true, color: MUTED }),
    textRight(COL.balance, y - 10, money(opening), 8, { bold: true }),
  ];
  return { ops, nextY: y - h };
}

function closingRow(y: number, closing: number) {
  const h = 24;
  const ops = [
    rect(MARGIN, y - h + 4, PAGE_W - MARGIN * 2, h, "0.07 0.07 0.07"),
    text(COL.date + 6, y - 11, "Closing balance carried forward", 8, { bold: true, color: WHITE }),
    textRight(COL.balance, y - 11, money(closing), 9, { bold: true, color: WHITE }),
  ];
  return { ops, nextY: y - h };
}

function footer(page: number, pages: number) {
  return [
    line(MARGIN, 28, PAGE_W - MARGIN, 28, RED, 1),
    text(MARGIN, 16, "This is a computer-generated statement and does not require a signature.", 7, { color: MUTED }),
    textRight(PAGE_W - MARGIN, 16, `iCash Exchange  ·  ${page}/${pages}`, 7, { color: MUTED }),
  ];
}

function paginate(model: StatementExport) {
  const firstHeader = 210;
  const contHeader = 78;
  const rowH = 28;
  const foot = 40;
  const headH = 20;
  const extraFirst = 22;
  const extraLast = 24;
  const firstRoom = PAGE_H - MARGIN - firstHeader - headH - extraFirst - foot;
  const contRoom = PAGE_H - MARGIN - contHeader - headH - extraLast - foot;
  const firstCount = Math.max(1, Math.floor(firstRoom / rowH));
  const firstWithClose = Math.max(0, Math.floor((firstRoom - extraLast) / rowH));
  const contCount = Math.max(1, Math.floor(contRoom / rowH));

  if (model.rows.length === 0) return [model.rows];
  if (model.rows.length <= firstWithClose) return [model.rows];

  const pages: StatementExportRow[][] = [];
  const rest = model.rows.slice();
  pages.push(rest.splice(0, firstCount));
  while (rest.length > contCount) pages.push(rest.splice(0, contCount));
  if (rest.length) pages.push(rest);
  return pages;
}

function assemblePdf(pageStreams: string[], title: string) {
  const nPages = pageStreams.length;
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageStreams.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] /Count ${nPages} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  pageStreams.forEach((stream, i) => {
    const bytes = new TextEncoder().encode(stream).length;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${6 + i * 2} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`,
    );
    objects.push(`<< /Length ${bytes} >>\nstream\n${stream}\nendstream`);
  });
  objects.push(`<< /Title (${pdfEscape(title)}) /Author (iCash Exchange) /Producer (iCash Exchange) /Creator (iCash Exchange) >>`);

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = [0];
  let cursor = 0;
  const push = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    cursor += bytes.length;
  };

  push("%PDF-1.4\n");
  objects.forEach((body, i) => {
    offsets.push(cursor);
    push(`${i + 1} 0 obj\n${body}\nendobj\n`);
  });
  const xrefAt = cursor;
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let i = 1; i <= objects.length; i++) {
    xref.push(`${String(offsets[i]).padStart(10, "0")} 00000 n `);
  }
  push(`${xref.join("\n")}\n`);
  push(
    `trailer << /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xrefAt}\n%%EOF`,
  );

  const out = new Uint8Array(cursor);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

export function buildStatementPdf(model: StatementExport) {
  const groups = paginate(model);
  const pages = groups.length;
  const streams = groups.map((rows, index) => {
    const page = index + 1;
    const ops: string[] = [];
    const head = index === 0 ? headerBlock(model, page, pages) : compactHeader(model, page, pages);
    ops.push(...head.ops);
    const table = tableHead(head.tableTop);
    ops.push(...table.ops);
    let y = table.nextY;
    if (index === 0) {
      const open = openingRow(y, model.opening);
      ops.push(...open.ops);
      y = open.nextY;
    }
    if (rows.length === 0) {
      ops.push(text(MARGIN + 6, y - 18, "No movements posted in this period.", 9, { color: MUTED }));
      y -= 28;
    } else {
      rows.forEach((row, i) => {
        const drawn = tableRow(y, row, i % 2 === 1);
        ops.push(...drawn.ops);
        y = drawn.nextY;
      });
    }
    if (index === pages - 1) {
      const close = closingRow(y, model.closing);
      ops.push(...close.ops);
    }
    ops.push(...footer(page, pages));
    return ops.join("\n");
  });
  return assemblePdf(streams, `iCash Exchange statement ${model.periodLabel}`);
}

export function downloadStatementPdf(filename: string, model: StatementExport) {
  const bytes = buildStatementPdf(model);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printStatement(model: StatementExport) {
  const html = renderStatementHtml(model, true);
  const popup = window.open("", "_blank", "noopener,noreferrer,width=920,height=1200");
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    return;
  }
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(renderStatementHtml(model, false));
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 800);
}

export function renderStatementHtml(model: StatementExport, autoPrint = false) {
  const rows = model.rows
    .map((row) => {
      const debit = row.kind === "outflow" ? money(row.amount) : "";
      const credit = row.kind === "inflow" ? money(row.amount) : "";
      const pending = row.kind === "processing" ? "Pending" : "";
      const balance = row.kind === "processing" ? "—" : money(row.balance);
      return `<tr>
        <td><strong>${escapeHtml(dayLabel(row.at))}</strong><div class="sub">${escapeHtml(timeLabel(row.at))}</div></td>
        <td><strong>${escapeHtml(row.title)}</strong><div class="sub">${escapeHtml(`${row.party} · ${row.ref}`)}</div></td>
        <td>${escapeHtml(row.method)}</td>
        <td class="num debit">${debit}</td>
        <td class="num ${pending ? "pending" : "credit"}">${credit || pending}</td>
        <td class="num">${balance}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>iCash Exchange statement</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #171717; font-family: "Segoe UI", Helvetica, Arial, sans-serif; background: #d9d9d9; }
    .sheet { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; box-shadow: 0 18px 50px rgba(0,0,0,.18); }
    .bar { height: 7px; background: #e11d2e; }
    .wrap { padding: 18px 18px 16px; }
    .mast { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; border-bottom: 2.5px solid #e11d2e; padding-bottom: 12px; }
    .brand-row { display: flex; align-items: center; gap: 8px; }
    .mark { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; background: #e11d2e; color: #fff; font-weight: 800; }
    .brand { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; }
    .right { text-align: right; white-space: nowrap; font-size: 11px; color: #555; line-height: 1.45; }
    .eyebrow { color: #e11d2e; font-size: 9px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
    h1 { margin: 12px 0 3px; font-size: 18px; letter-spacing: 0.04em; }
    .lead { margin: 0 0 12px; color: #6b6b6b; font-size: 11px; }
    .meta, .kpis { display: grid; gap: 7px; margin-bottom: 12px; }
    .meta { grid-template-columns: 1fr 1.2fr 1fr; }
    .kpis { grid-template-columns: repeat(4, 1fr); }
    .card { border: 1px solid #e6e6e6; padding: 8px 10px; }
    .kpis .card:last-child { border-color: #e11d2e; background: #fff7f7; }
    label { display: block; font-size: 8px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #7a7a7a; }
    .card strong { display: block; margin-top: 3px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    col.date { width: 16%; }
    col.part { width: 34%; }
    col.method { width: 12%; }
    col.num { width: 12.66%; }
    th { background: #171717; color: #fff; font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; text-align: left; padding: 7px 6px; }
    th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td { padding: 7px 6px; border-bottom: 1px solid #eee; font-size: 10.5px; vertical-align: top; word-wrap: break-word; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .sub { color: #7a7a7a; font-size: 9px; margin-top: 2px; }
    .debit { color: #b91c1c; font-weight: 700; }
    .credit { color: #047857; font-weight: 700; }
    .pending { color: #a16207; font-weight: 700; }
    .open, .close { font-weight: 700; }
    .open td { background: #f4f4f5; }
    .close td { background: #171717; color: #fff; }
    footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 16px; padding-top: 8px; border-top: 2px solid #e11d2e; color: #7a7a7a; font-size: 9px; }
    @media print {
      body { background: #fff; }
      .sheet { width: auto; min-height: 0; margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="bar"></div>
    <div class="wrap">
      <div class="mast">
        <div class="brand-row"><span class="mark">i</span><span class="brand">iCash Exchange</span></div>
        <div class="right">
          <div class="eyebrow">Confidential</div>
          <div>Reseller desk · Asia/Dhaka</div>
          <div>${escapeHtml(model.statementNo)}</div>
        </div>
      </div>
      <h1>STATEMENT OF ACCOUNT</h1>
      <p class="lead">Deposits in, iCash voucher debits and sell payouts for the selected period.</p>
      <div class="meta">
        <div class="card"><label>Account</label><strong>iCash Exchange desk</strong></div>
        <div class="card"><label>Statement period</label><strong>${escapeHtml(model.periodLabel)}</strong></div>
        <div class="card"><label>Generated</label><strong>${escapeHtml(model.generatedAt)}</strong></div>
      </div>
      <div class="kpis">
        <div class="card"><label>Opening balance</label><strong>${escapeHtml(moneyLabel(model.opening))}</strong></div>
        <div class="card"><label>Total credit</label><strong class="credit">${escapeHtml(moneyLabel(model.inflow))}</strong></div>
        <div class="card"><label>Total debit</label><strong class="debit">${escapeHtml(moneyLabel(model.outflow))}</strong></div>
        <div class="card"><label>Closing balance</label><strong>${escapeHtml(moneyLabel(model.closing))}</strong></div>
      </div>
      <table>
        <colgroup>
          <col class="date"/>
          <col class="part"/>
          <col class="method"/>
          <col class="num"/>
          <col class="num"/>
          <col class="num"/>
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Particulars</th>
            <th>Method</th>
            <th class="num">Debit</th>
            <th class="num">Credit</th>
            <th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr class="open">
            <td colspan="5">Opening balance brought forward</td>
            <td class="num">${escapeHtml(money(model.opening))}</td>
          </tr>
          ${rows || `<tr><td colspan="6">No movements posted in this period.</td></tr>`}
          <tr class="close">
            <td colspan="5">Closing balance carried forward</td>
            <td class="num">${escapeHtml(money(model.closing))}</td>
          </tr>
        </tbody>
      </table>
      <footer>
        <span>This is a computer-generated statement and does not require a signature.</span>
        <span>iCash Exchange</span>
      </footer>
    </div>
  </div>
  ${autoPrint ? `<script>window.addEventListener("load", function () { window.print(); });</script>` : ""}
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
