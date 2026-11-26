import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thắng Huế – Chi tiêu gia đình",
    short_name: "Thắng Huế",
    description: "Quản lý chi tiêu gia đình",
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffbeb",
    theme_color: "#f59e0b",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
