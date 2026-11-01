/**
 * i18n React provider — เก็บภาษาใน localStorage (`kub-council-lang`, default ไทย)
 * sync ค่ากับ core dict + formatters ใน lib/format ตอนภาษาเปลี่ยน
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  currentLang,
  LANG_STORAGE_KEY,
  setLang as setCoreLang,
  type Lang,
} from "./dict";
import { setFormatLang } from "../lib/format";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LangCtx>({
  lang: currentLang(),
  setLang: () => {},
});

function readInitial(): Lang {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    if (v === "en" || v === "th") return v;
  } catch {
    // localStorage อาจถูกบล็อก — ใช้ default
  }
  return "th";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      // ปล่อย — เก็บค่าไม่ได้ก็ยังเปลี่ยนภาษาใน session นี้ได้
    }
  }, []);

  useEffect(() => {
    setCoreLang(lang);
    setFormatLang(lang);
    document.documentElement.lang = lang === "en" ? "en" : "th";
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}

// สำคัญ: set core ก่อน re-render ครั้งแรกของ component นอก provider (เช่น lib)
// ให้ค่า core ตรงกับ state ตั้งแต่ต้น
setCoreLang(readInitial());
