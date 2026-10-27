import type { ThemeMode } from "../hooks/useTheme";

interface Props {
  theme: ThemeMode;
  onToggle: () => void;
}

/** ปุ่มสลับเวอร์ชันเว็บ — ตรึงอยู่มุมขวาบนสุดของจอเสมอ */
export function ThemeToggle({ theme, onToggle }: Props) {
  const toPixel = theme === "classic";
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={toPixel ? "สลับไปเวอร์ชัน Pixel Arts" : "กลับเวอร์ชันเดิม"}
    >
      {toPixel ? "Click to Pixel Version" : "Click to Classic Version"}
    </button>
  );
}
