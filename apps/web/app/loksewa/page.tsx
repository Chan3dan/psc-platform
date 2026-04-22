import { PublicTopicPage, buildTopicMetadata } from '@/components/marketing/PublicTopicPage';

export async function generateMetadata() {
  return buildTopicMetadata('loksewa');
}

export default function LoksewaPage() {
  return <PublicTopicPage slug="loksewa" />;
}
