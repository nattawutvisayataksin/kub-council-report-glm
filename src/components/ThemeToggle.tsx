import ballotBox from "../assets/pixel/ballot-box.png";
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
      <img src={ballotBox} alt="" width={24} height={24} />
      {toPixel ? "Click to Pixel Version" : "CLASSIC"}
    </button>
  );
}
