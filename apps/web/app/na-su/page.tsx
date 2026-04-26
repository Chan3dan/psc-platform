import { PublicTopicPage, buildTopicMetadata } from '@/components/marketing/PublicTopicPage';

export async function generateMetadata() {
  return buildTopicMetadata('na-su');
}

export default function NaSuPage() {
  return <PublicTopicPage slug="na-su" />;
}
