import { redirect } from 'next/navigation'
import { SEED_FARM_SECRET } from '@/lib/seed'

export default function Home() {
  redirect(`/farm/${SEED_FARM_SECRET}`)
}
