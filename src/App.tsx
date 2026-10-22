import { useMemo } from "react";
import { Header } from "./components/Header";
import { CountdownCard } from "./components/CountdownCard";
import { SummaryStrip } from "./components/SummaryStrip";
import { ProposalCard } from "./components/ProposalCard";
import { TxFeed } from "./components/TxFeed";
import { ApiFallbackBanner, UnavailableBanner } from "./components/Banners";
import { Footer } from "./components/Footer";
import { useElection } from "./hooks/useElection";
import { APP_CONFIG } from "./config/election";
import { exportDetailCsv, exportSummaryCsv } from "./lib/export";

function LoadingScreen({ first }: { first: boolean }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <div>{first ? "กำลังอ่านข้อมูลจากบล็อกเชน KUB Chain…" : "กำลังอัปเดตข้อมูล…"}</div>
      <div className="muted" style={{ fontSize: 12 }}>
        สแกน ProposalVoted logs + cross-check API — ใช้เวลาเพียงสักครู่
      </div>
    </div>
  );
}

export default function App() {
  const { loading, model, refreshing, refreshNow } = useElection();

  const nameOf = useMemo(
    () =>
      (proposalId: number, choice: number): string =>
        model?.proposals
          .find((p) => p.id === proposalId)
          ?.options.find((o) => o.idx === choice)?.name ?? `ตัวเลือก ${choice + 1}`,
    [model],
  );

  if (loading || !model) return <LoadingScreen first={true} />;
  if (model.mode === "unavailable") {
    return (
      <div className="app">
        <Header model={model} refreshing={refreshing} refreshNow={refreshNow} />
        <UnavailableBanner onRetry={refreshNow} />
      </div>
    );
  }

  const feed = model.votes.slice(0, APP_CONFIG.TX_FEED_LIMIT);

  return (
    <div className="app">
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
        />
        <section className="grid">
          {model.proposals.map((p) => (
            <ProposalCard key={p.id} p={p} />
          ))}
        </section>
        <TxFeed votes={feed} refunds={model.refunds} nameOf={nameOf} total={model.totalVoteCount} />
      </main>

      <Footer model={model} />
    </div>
  );
}
