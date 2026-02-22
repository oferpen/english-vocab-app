import NewLogin from '@/components/auth/NewLogin';

export const dynamic = 'force-dynamic';

export default function Home() {
  // Minimal homepage - just show login screen
  // Auth check moved to client-side in NewLogin component
  return <NewLogin />;
}
