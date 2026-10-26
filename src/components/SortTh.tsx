/**
 * หัวตารางที่คลิกเรียงได้ (asc/desc) — ใช้ร่วมกันระหว่างตารางธุรกรรมโหวต
 * และตาราง Analytics ผู้โหวต
 */

import type { CSSProperties } from "react";

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

export function nextSort(sort: SortState, k: string, defDir: SortDir = "desc"): SortState {
  if (sort.key === k) return { key: k, dir: sort.dir === "desc" ? "asc" : "desc" };
  return { key: k, dir: defDir };
}

export function SortTh({
  label,
  k,
  sort,
  onSort,
  right,
}: {
  label: string;
  k: string;
  sort: SortState;
  onSort: (k: string) => void;
  right?: boolean;
}) {
  const active = sort.key === k;
  const style: CSSProperties | undefined = right ? { textAlign: "right" } : undefined;
  return (
    <th
      className="sortable"
      style={style}
      onClick={() => onSort(k)}
      title="คลิกเพื่อเรียง (สลับ มาก→น้อย / น้อย→มาก)"
    >
      {label}
      <span className={active ? "sort-caret" : "sort-idle"} aria-hidden="true">
        {active ? (sort.dir === "desc" ? "▼" : "▲") : "⇅"}
      </span>
    </th>
  );
}

/** เทียบ bigint แบบไม่ overflow (คืน -1/0/1) */
export function cmpBig(a: bigint, b: bigint): number {
  return a === b ? 0 : a > b ? 1 : -1;
}
