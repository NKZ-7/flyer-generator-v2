import { StudioLayout } from '@/components/StudioLayout';
import type { FlyerPreferences } from '@/lib/types';

interface HomeProps {
  searchParams: Promise<{ prefill?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { prefill } = await searchParams;

  let initialPrefs: Partial<FlyerPreferences> | undefined;
  if (prefill) {
    try {
      initialPrefs = JSON.parse(decodeURIComponent(prefill)) as Partial<FlyerPreferences>;
    } catch {
      // Malformed prefill param — ignore
    }
  }

  return <StudioLayout initialPrefs={initialPrefs} />;
}
