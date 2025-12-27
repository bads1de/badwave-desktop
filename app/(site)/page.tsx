import HomeContent from "./components/HomeContent";

export default function Home() {
  // SSRでのデータフェッチを廃止し、クライアントサイドで取得
  // これによりオフライン時もキャッシュから表示可能になる
  return <HomeContent />;
}
