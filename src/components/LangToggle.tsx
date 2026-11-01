import { useLang } from "../i18n";
import { t } from "../i18n/dict";

/** ปุ่มสลับภาษาไทย/อังกฤษ (ใช้ใน header chips — ไปกับปุ่มธีมและแชร์) */
export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label={t("lang.title")}>
      <button
        className={lang === "th" ? "lg on" : "lg"}
        onClick={() => setLang("th")}
        aria-pressed={lang === "th"}
      >
        ไทย
      </button>
      <button
        className={lang === "en" ? "lg on" : "lg"}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
