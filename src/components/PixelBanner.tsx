import banner from "../assets/pixel/banner.png";

/** Banner ภาพ pixel-art (สร้างด้วย PixelLab) — แสดงเฉพาะเวอร์ชัน Pixel Arts */
export function PixelBanner() {
  return (
    <div className="pixel-banner">
      <img src={banner} alt="Pixel art council hall banner" loading="lazy" />
    </div>
  );
}
