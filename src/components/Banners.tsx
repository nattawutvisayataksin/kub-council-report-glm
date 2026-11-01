import { useLang } from "../i18n";
import { t } from "../i18n/dict";

export function UnavailableBanner({ onRetry }: { onRetry: () => void }) {
  useLang(); // re-render เมื่อภาษาเปลี่ยน
  return (
    <div className="banner bad">
      <b>{t("bn.unavailTitle")}</b> {t("bn.unavailBody")}
      <button className="btn" style={{ marginLeft: 8 }} onClick={onRetry}>
        {t("bn.retry")}
      </button>
    </div>
  );
}
