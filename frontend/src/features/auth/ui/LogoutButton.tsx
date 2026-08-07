import { Button } from '@/shared/ui';
import { useLogout } from '../model/useAuthMutations';

export function LogoutButton() {
  const logout = useLogout();
  return (
    <Button variant="outline" size="sm" onClick={() => logout.mutate()} isLoading={logout.isPending}>
      Вийти
    </Button>
  );
}
