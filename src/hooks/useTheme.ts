import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "classic" | "pixel";

const STORAGE_KEY = "kub-council-theme";

function readInitial(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "pixel" || v === "classic") return v;
  } catch {
    /* ignore */
  }
  return "classic";
}

/**
 * สลับธีมระหว่างเวอร์ชันเดิม (classic) กับเวอร์ชัน Pixel Arts
 * — ใส่/ถอด class "pixel-theme" ที่ <html> และจำค่าไว้ใน localStorage
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("pixel-theme", theme === "pixel");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "pixel" ? "classic" : "pixel"));
  }, []);

  return { theme, toggle };
}
