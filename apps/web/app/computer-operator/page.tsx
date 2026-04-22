import { PublicTopicPage, buildTopicMetadata } from '@/components/marketing/PublicTopicPage';

export async function generateMetadata() {
  return buildTopicMetadata('computer-operator');
}

export default function ComputerOperatorPage() {
  return <PublicTopicPage slug="computer-operator" />;
}
