import { renderIcon } from "@/lib/icon";

const SIZES = ["192", "512"];

export const dynamic = "force-static";
export const generateStaticParams = () => SIZES.map((size) => ({ size }));

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  return renderIcon(Number(size));
}
