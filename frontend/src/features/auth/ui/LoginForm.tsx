import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import { Button, FormError, Input, Label } from '@/shared/ui';
import { loginSchema, type LoginValues } from '../model/schemas';
import { useLogin } from '../model/useAuthMutations';

export function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, { onSuccess: () => navigate(ROUTES.workspaces, { replace: true }) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {login.isError && <FormError error={login.error} />}

      <Button type="submit" className="w-full" isLoading={login.isPending}>
        Увійти
      </Button>
    </form>
  );
}
