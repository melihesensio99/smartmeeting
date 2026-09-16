import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { navigate } from '../../app/navigation'

const loginSchema = z.object({ email: z.string().email('Geçerli bir e-posta giriniz.'), password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.') })
type LoginInput = z.infer<typeof loginSchema>

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })
  const submit = () => { localStorage.setItem('smartmeeting-session', 'demo'); navigate('/') }
  return <Box sx={{ minHeight: '100vh', bgcolor: 'primary.main', display: 'grid', placeItems: 'center', p: 2 }}><Card sx={{ width: '100%', maxWidth: 650, borderRadius: 3 }}><CardContent sx={{ p: { xs: 3, md: 5 } }}><Stack spacing={3}><Typography variant="h4">Giriş Yap</Typography><Typography color="text.secondary">Sisteme erişmek için e-posta ve şifrenizi giriniz.</Typography><TextField label="E-posta Adresi" type="email" {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message} /><TextField label="Şifre" type="password" {...register('password')} error={Boolean(errors.password)} helperText={errors.password?.message} /><Button size="large" variant="contained" onClick={handleSubmit(submit)}>Giriş Yap</Button></Stack></CardContent></Card></Box>
}
