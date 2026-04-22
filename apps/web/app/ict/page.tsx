import { PublicTopicPage, buildTopicMetadata } from '@/components/marketing/PublicTopicPage';

export async function generateMetadata() {
  return buildTopicMetadata('ict');
}

export default function IctPage() {
  return <PublicTopicPage slug="ict" />;
}
