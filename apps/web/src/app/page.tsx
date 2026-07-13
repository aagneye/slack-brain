import { auth } from '@/auth';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFlow } from '@/components/landing/LandingFlow';
import { LandingLoop } from '@/components/landing/LandingLoop';
import { LandingAudience } from '@/components/landing/LandingAudience';
import { LandingProof } from '@/components/landing/LandingProof';
import { LandingResults } from '@/components/landing/LandingResults';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingTeam } from '@/components/landing/LandingTeam';
import { LandingCta } from '@/components/landing/LandingCta';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { isAuthenticatedSession } from '@/lib/auth-session';

export default async function HomePage() {
  const session = await auth();
  const authed = isAuthenticatedSession(session);

  return (
    <div className="landing-page min-h-screen">
      <LandingNav authed={authed} />
      <LandingHero authed={authed} />
      <LandingFlow />
      <LandingLoop />
      <LandingAudience />
      <LandingProof />
      <LandingResults />
      <LandingFaq />
      <LandingTeam />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
