import { PublicTopicPage, buildTopicMetadata } from '@/components/marketing/PublicTopicPage';

export async function generateMetadata() {
  return buildTopicMetadata('kharidar');
}

export default function KharidarPage() {
  return <PublicTopicPage slug="kharidar" />;
}
