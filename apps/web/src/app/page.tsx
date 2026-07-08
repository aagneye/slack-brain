import { auth } from '@/auth';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingBrainPreview } from '@/components/landing/LandingBrainPreview';
import { LandingTeam } from '@/components/landing/LandingTeam';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { isAuthenticatedSession } from '@/lib/auth-session';

export default async function HomePage() {
  const session = await auth();
  const authed = isAuthenticatedSession(session);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav authed={authed} />
      <LandingHero authed={authed} />
      <LandingFeatures />
      <LandingBrainPreview />
      <LandingTeam />
      <LandingFooter />
    </div>
  );
}
