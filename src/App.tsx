import { useMemo } from "react";
import { Header } from "./components/Header";
import { CountdownCard } from "./components/CountdownCard";
import { SummaryStrip } from "./components/SummaryStrip";
import { StatsPanel } from "./components/StatsPanel";
import { ProposalCard } from "./components/ProposalCard";
import { TxFeed } from "./components/TxFeed";
import { WalletTable } from "./components/WalletTable";
import { ApiFallbackBanner, UnavailableBanner } from "./components/Banners";
import { Footer } from "./components/Footer";
import { ThemeToggle } from "./components/ThemeToggle";
import { PixelBanner } from "./components/PixelBanner";
import { useElection } from "./hooks/useElection";
import { useTheme } from "./hooks/useTheme";
import { useWalletAnalytics } from "./hooks/useWalletAnalytics";
import { useLang } from "./i18n";
import { t } from "./i18n/dict";
import { exportDetailCsv, exportSummaryCsv, exportWalletCsv } from "./lib/export";

function LoadingScreen({ first }: { first: boolean }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <div>{first ? t("loading-first") : t("loading-refresh")}</div>
      <div className="muted" style={{ fontSize: 12 }}>
        {t("loading-sub")}
      </div>
      <div className="muted" style={{ fontSize: 12, maxWidth: 340, textAlign: "center" }}>
        {t("loading-firstvisit")}
      </div>
    </div>
  );
}

export default function App() {
  const { lang } = useLang(); // subscribe ภาษา (nameOf fallback, LoadingScreen)
  void lang;
  const { loading, model, refreshing, refreshNow } = useElection();
  const wa = useWalletAnalytics(model);
  const { theme, toggle } = useTheme();
  const isPixel = theme === "pixel";

  const nameOf = useMemo(
    () =>
      (proposalId: number, choice: number): string =>
        model?.proposals
          .find((p) => p.id === proposalId)
          ?.options.find((o) => o.idx === choice)?.name ??
        t("pc.optionFallback", { n: choice + 1 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, lang],
  );

  if (loading || !model)
    return (
      <>
        <ThemeToggle theme={theme} onToggle={toggle} />
        <LoadingScreen first={true} />
      </>
    );
  if (model.mode === "unavailable") {
    return (
      <div className="app">
        <ThemeToggle theme={theme} onToggle={toggle} />
        <Header model={model} refreshing={refreshing} refreshNow={refreshNow} />
        <UnavailableBanner onRetry={refreshNow} />
      </div>
    );
  }

  return (
    <div className="app">
      <ThemeToggle theme={theme} onToggle={toggle} />
      {isPixel && <PixelBanner />}
      <Header model={model} refreshing={refreshing} refreshNow={refreshNow} />
      {model.mode === "api-fallback" && (
        <ApiFallbackBanner apiUpdatedAt={model.apiUpdatedAt} apiFetchedAtMs={model.apiFetchedAtMs} />
      )}

      <main>
        <CountdownCard />
        <SummaryStrip
          model={model}
          onExportSummary={() => exportSummaryCsv(model)}
          onExportDetail={() => exportDetailCsv(model)}
          onExportWallets={() => exportWalletCsv(model, wa.balances)}
        />
        <StatsPanel model={model} />
        <section className="grid">
          {model.proposals.map((p) => (
            <ProposalCard key={p.id} p={p} />
          ))}
        </section>
        <TxFeed votes={model.votes} refunds={model.refunds} nameOf={nameOf} total={model.totalVoteCount} />
        <WalletTable
          model={model}
          balances={wa.balances}
          missing={wa.missing}
          balancesUpdatedAtMs={wa.updatedAtMs}
          balancesLoading={wa.loading}
          progressDone={wa.progressDone}
          progressTotal={wa.progressTotal}
          tokenInfo={wa.tokenInfo}
          onRefreshBalances={wa.refreshBalances}
        />
      </main>

      <Footer />
    </div>
  );
}
