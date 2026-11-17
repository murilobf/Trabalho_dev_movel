import { useLocalSearchParams, useRouter } from 'expo-router';
import ReviewScreen from '../../components/ReviewScreen';

export default function AvaliarRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return <ReviewScreen bookId={Number(id)} onClose={() => router.back()} />;
}