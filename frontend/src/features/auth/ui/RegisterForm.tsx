import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config';
import { Button, FormError, Input, Label } from '@/shared/ui';
import { registerSchema, type RegisterValues } from '../model/schemas';
import { useRegister } from '../model/useAuthMutations';

export function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (values: RegisterValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => navigate(ROUTES.workspaces, { replace: true }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="name">Ім'я</Label>
        <Input id="name" autoComplete="name" {...register('name')} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

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
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {registerMutation.isError && <FormError error={registerMutation.error} />}

      <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
        Створити акаунт
      </Button>
    </form>
  );
}
