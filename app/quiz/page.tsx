import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface QuizPageProps {
  searchParams: Promise<{
    category?: string;
    level?: string;
  }>;
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;
  const category = params?.category;
  const level = params?.level;

  // Redirect to /learn with mode=quiz
  const redirectUrl = category
    ? `/learn?mode=quiz&category=${encodeURIComponent(category)}${level ? `&level=${level}` : ''}`
    : '/learn?mode=quiz';

  redirect(redirectUrl);
}
