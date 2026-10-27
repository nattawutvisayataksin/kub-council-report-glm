import banner from "../assets/pixel/kub-pixel-party-banner.png";

/** Banner ภาพ pixel-art (สร้างด้วย PixelLab) — แสดงเฉพาะเวอร์ชัน Pixel Arts */
export function PixelBanner() {
  return (
    <div className="pixel-banner">
      <img src={banner} alt="Five KUB council adventurers in pixel art" loading="lazy" />
    </div>
  );
}
