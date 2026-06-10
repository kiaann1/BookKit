import { HomeFeatures, HomeHero, homeFeatures } from "@/components/home/home-hero";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  return (
    <>
      <HomeHero isLoggedIn={!!session} />
      <HomeFeatures features={homeFeatures} />
    </>
  );
}
