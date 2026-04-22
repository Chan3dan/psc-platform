import { PublicTopicPage, buildTopicMetadata } from '@/components/marketing/PublicTopicPage';

export async function generateMetadata() {
  return buildTopicMetadata('gk');
}

export default function GkPage() {
  return <PublicTopicPage slug="gk" />;
}
