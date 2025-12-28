import HomeContent from "./components/HomeContent";
import { getHomeData } from "@/actions/getHomeData";

export const revalidate = 3600; // 1時間に1回再検証 (SSG/ISR)

export default async function Home() {
  const initialData = await getHomeData();

  return <HomeContent initialData={initialData} />;
}
