import PulseClient from "@/app/pulse/components/PulseClient";

export const revalidate = 0;

export default function PulsePage() {
  // SSRでのデータフェッチを廃止し、クライアントサイドで取得
  return <PulseClient />;
}
