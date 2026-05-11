import { BestSellers } from "@/components/sections/BestSellers";
import { Hero } from "@/components/sections/Hero";
import { OccasionNavigation } from "@/components/sections/OccasionNavigation";
import { SeasonalCampaign } from "@/components/sections/SeasonalCampaign";
import { SocialProof } from "@/components/sections/SocialProof";
import { TrustIndicators } from "@/components/sections/TrustIndicators";

export function Home() {
  return (
    <>
      <Hero />
      <OccasionNavigation />
      <BestSellers />
      <SeasonalCampaign />
      <TrustIndicators />
      <SocialProof />
    </>
  );
}
