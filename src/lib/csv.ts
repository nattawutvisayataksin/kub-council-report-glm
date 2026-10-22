/** Export CSV (มี BOM สำหรับ Excel ไทย) — export เฉพาะข้อมูล on-chain ที่ผ่านการ verify */

export type CsvCell = string | number;

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, CsvCell>>,
  headers?: string[],
): void {
  if (rows.length === 0) return;
  const cols =
    headers ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: CsvCell): string => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => esc(r[c])).join(",")),
  ].join("\r\n");
  const blob = new Blob([`\ufeff${body}`], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
