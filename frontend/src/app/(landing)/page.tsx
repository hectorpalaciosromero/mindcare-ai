import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import BenefitsPatients from "@/components/landing/BenefitsPatients";
import BenefitsPsychologists from "@/components/landing/BenefitsPsychologists";
import TechnologySection from "@/components/landing/TechnologySection";
import CTABanner from "@/components/landing/CTABanner";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <BenefitsPatients />
      <BenefitsPsychologists />
      <TechnologySection />
      <CTABanner />
    </>
  );
}
