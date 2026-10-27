import banner from "../assets/pixel/kub-pixel-party-banner.png";

/** Banner ภาพ pixel-art (สร้างด้วย PixelLab) — แสดงเฉพาะเวอร์ชัน Pixel Arts */
export function PixelBanner() {
  return (
    <div className="pixel-banner" aria-label="KUB Council pixel-art hero banner">
      <div className="pixel-banner__track" aria-hidden="true">
        <img src={banner} alt="" loading="lazy" />
        <img src={banner} alt="" loading="lazy" />
      </div>
      <span className="pixel-banner__aurora" aria-hidden="true" />
      <span className="pixel-banner__scanlines" aria-hidden="true" />
      <span className="pixel-banner__badge" aria-hidden="true">LIVE · KUB CHAIN</span>
    </div>
  );
}
