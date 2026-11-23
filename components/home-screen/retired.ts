import { redirect } from 'next/navigation'

import { getPublishedHomeScreen } from '@/lib/cms/data'

/**
 * The priced packages are retired while the home screen is on (21 Nov 2026):
 * their pages send visitors to Offers. Turning the screen off brings them back.
 */
export async function retiredForOffers() {
  const { screen } = await getPublishedHomeScreen()
  if (screen.enabled) redirect('/offers')
}
