import { useLang } from "../i18n";
import { t } from "../i18n/dict";
import type { ThemeMode } from "../hooks/useTheme";

interface Props {
  theme: ThemeMode;
  onToggle: () => void;
}

/** ปุ่มสลับเวอร์ชันเว็บ — ตรึงอยู่มุมขวาบนสุดของจอเสมอ */
export function ThemeToggle({ theme, onToggle }: Props) {
  useLang(); // re-render เมื่อภาษาเปลี่ยน
  const toPixel = theme === "classic";
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={toPixel ? t("tt.title.toPixel") : t("tt.title.toClassic")}
    >
      {toPixel ? t("tt.toPixel") : t("tt.toClassic")}
    </button>
  );
}
