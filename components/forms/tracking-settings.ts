'use server'
import { getSettings } from '@/lib/cms/data'
export async function getTrackingId() {
  try {
    return (await getSettings())?.ghlTrackingId ?? ''
  } catch {
    return ''
  }
}
