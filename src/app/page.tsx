import { HomeCta } from "@/components/home/home-cta";
import { HomeFeatures, homeFeatures } from "@/components/home/home-features";
import { HomeHero } from "@/components/home/home-hero";
import { HomeHowItWorks } from "@/components/home/home-how-it-works";
import { HomeSpotlight } from "@/components/home/home-spotlight";
import type { FeaturedCover } from "@/lib/home/featured-covers";
import {
  getFeaturedCoverCount,
  getFeaturedCovers,
} from "@/lib/home/featured-covers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function splitFeaturedCovers(
  covers: FeaturedCover[],
  heroCount: number,
  spotlightCount: number,
) {
  const heroCovers = covers.slice(0, heroCount);
  const heroIds = new Set(heroCovers.map((cover) => cover.id));
  const spotlightCovers = covers
    .filter((cover) => !heroIds.has(cover.id))
    .slice(0, spotlightCount);

  return {
    heroCovers,
    spotlightCovers:
      spotlightCovers.length > 0
        ? spotlightCovers
        : covers.slice(0, spotlightCount),
  };
}

export default async function HomePage() {
  const session = await getSession();
  const [featuredCovers, coverCount] = await Promise.all([
    getFeaturedCovers(12),
    getFeaturedCoverCount(),
  ]);

  const { heroCovers, spotlightCovers } = splitFeaturedCovers(
    featuredCovers,
    5,
    4,
  );

  return (
    <div className="mesh-background">
      <HomeHero
        isLoggedIn={!!session}
        featuredCovers={heroCovers}
        coverCount={coverCount}
      />
      <HomeFeatures features={homeFeatures} />
      <HomeSpotlight books={spotlightCovers} />
      <HomeHowItWorks />
      <HomeCta isLoggedIn={!!session} coverCount={coverCount} />
    </div>
  );
}
