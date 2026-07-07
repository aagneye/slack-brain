import { auth } from '@/auth';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingBrainPreview } from '@/components/landing/LandingBrainPreview';
import { LandingTeam } from '@/components/landing/LandingTeam';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      <LandingNav authed={!!session} />
      <LandingHero authed={!!session} />
      <LandingFeatures />
      <LandingBrainPreview />
      <LandingTeam />
      <LandingFooter />
    </div>
  );
}
