// Salvar como: src/app/avaliar/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import ReviewScreen from '../../components/ReviewScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function AvaliarRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();

  return (
    <ReviewScreen
      bookId={Number(id)}
      usuarioId={usuario?.id ?? null}
      onClose={() => router.back()}
    />
  );
}
