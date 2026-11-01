import { fmtAgoSeconds } from "../lib/format";
import { useLang } from "../i18n";
import { t } from "../i18n/dict";

export function ApiFallbackBanner({
  apiUpdatedAt,
  apiFetchedAtMs,
}: {
  apiUpdatedAt: string | null;
  apiFetchedAtMs: number | null;
}) {
  useLang(); // re-render เมื่อภาษาเปลี่ยน
  return (
    <div className="banner warn">
      <b>{t("bn.fallbackTitle")}</b> {t("bn.fallback1")}
      <a href="https://kubcouncil.vercel.app/api/votes" target="_blank" rel="noreferrer">
        /api/votes
      </a>
      {t("bn.fallback3")}
      {apiUpdatedAt ? t("bn.fallbackUpdated", { t: apiUpdatedAt }) : t("bn.fallbackNoTs")}
      {apiFetchedAtMs
        ? t("bn.fallbackFetched", { t: fmtAgoSeconds((Date.now() - apiFetchedAtMs) / 1000) })
        : ""}
      {t("bn.fallbackRetry")}
    </div>
  );
}

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
