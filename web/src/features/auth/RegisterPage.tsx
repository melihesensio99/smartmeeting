import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { navigate } from '../../app/navigation'
import { getApiErrorMessage, register as registerUser } from '../../lib/api'

const registerSchema = z.object({
  displayName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır.').max(160),
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.').max(128),
  confirmPassword: z.string(),
}).refine((input) => input.password === input.confirmPassword, { path: ['confirmPassword'], message: 'Şifreler eşleşmiyor.' })

type RegisterInput = z.infer<typeof registerSchema>

export function RegisterPage() {
  const registration = useMutation({ mutationFn: (input: RegisterInput) => registerUser(input.email, input.password, input.displayName), onSuccess: () => navigate('/login') })
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })
  const submit = (input: RegisterInput) => registration.mutate(input)

  return <Box sx={{ minHeight: '100vh', bgcolor: 'primary.main', display: 'grid', placeItems: 'center', p: 2 }}><Card sx={{ width: '100%', maxWidth: 650, borderRadius: 3 }}><CardContent sx={{ p: { xs: 3, md: 5 } }}><Stack spacing={3}><Typography variant="h4">Hesap Oluştur</Typography><Typography color="text.secondary">Toplantı asistanını kullanmak için kurumsal hesabınızı oluşturun.</Typography>{registration.isError && <Alert severity="error">{getApiErrorMessage(registration.error, 'Kayıt tamamlanamadı.')}</Alert>}<TextField label="Ad Soyad" {...register('displayName')} error={Boolean(errors.displayName)} helperText={errors.displayName?.message} /><TextField label="E-posta Adresi" type="email" {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message} /><TextField label="Şifre" type="password" {...register('password')} error={Boolean(errors.password)} helperText={errors.password?.message} /><TextField label="Şifre Tekrar" type="password" {...register('confirmPassword')} error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword?.message} /><Button size="large" variant="contained" disabled={registration.isPending} onClick={handleSubmit(submit)}>{registration.isPending ? 'Hesap oluşturuluyor…' : 'Kayıt Ol'}</Button><Link component="button" type="button" onClick={() => navigate('/login')}>Zaten hesabınız var mı? Giriş yapın</Link></Stack></CardContent></Card></Box>
}
