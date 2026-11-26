import { ImageResponse } from "next/og";

/** Vẽ icon app (khoai tây chiên) bằng code, không cần file ảnh */
export function renderIcon(size: number) {
  const s = size / 100; // vẽ trên lưới 100x100, nằm trong vùng an toàn maskable (80%)
  const fry = (left: number, top: number, rotate: number) => (
    <div
      key={`${left}-${top}`}
      style={{
        position: "absolute",
        left: left * s,
        top: top * s,
        width: 8 * s,
        height: 38 * s,
        background: "#fde047",
        borderRadius: 2 * s,
        transform: `rotate(${rotate}deg)`,
        border: `${1.2 * s}px solid #eab308`,
      }}
    />
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#f59e0b" }}>
        {fry(30, 20, -12)}
        {fry(40, 15, -4)}
        {fry(50, 14, 4)}
        {fry(60, 19, 12)}
        {fry(45, 22, 0)}
        <div
          style={{
            position: "absolute",
            left: 26 * s,
            top: 44 * s,
            width: 48 * s,
            height: 38 * s,
            background: "#e11d48",
            borderRadius: `${4 * s}px ${4 * s}px ${12 * s}px ${12 * s}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 17 * s,
            fontWeight: 700,
          }}
        >
          TH
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
