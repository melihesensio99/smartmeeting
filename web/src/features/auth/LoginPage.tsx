import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { navigate } from '../../app/navigation'
import { getApiErrorMessage, login } from '../../lib/api'

const loginSchema = z.object({ email: z.string().email('Geçerli bir e-posta giriniz.'), password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.') })
type LoginInput = z.infer<typeof loginSchema>

export function LoginPage() {
  const auth = useMutation({ mutationFn: (input: LoginInput) => login(input.email, input.password), onSuccess: (result) => { localStorage.setItem('smartmeeting-user', result.displayName); localStorage.setItem('smartmeeting-user-id', result.userId); navigate('/') } })
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })
  const submit = (input: LoginInput) => auth.mutate(input)
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #241640 0%, #3B246B 55%, #6D52A5 100%)', display: 'grid', placeItems: 'center', p: 2, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, rgba(255,107,107,0) 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,82,165,0.25) 0%, rgba(109,82,165,0) 70%)', zIndex: 0 }} />
      <Card sx={{ width: '100%', maxWidth: 650, borderRadius: 4, position: 'relative', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', animation: 'sm-fade-in 0.5s ease' }}>
        <CardContent sx={{ p: { xs: 4, md: 6 } }}>
          <Stack spacing={3.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 3, background: 'linear-gradient(135deg, #FF6B6B 0%, #FF9A98 100%)', boxShadow: '0 4px 12px rgba(255,107,107,0.4)', color: 'white', fontWeight: 900, fontSize: 24 }}>M</Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Meeting</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #3B246B 0%, #6D52A5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Giriş Yap</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>Toplantılarınızı, notlarınızı ve aksiyonlarınızı tek merkezden yönetin.</Typography>
            {auth.isError && <Alert severity="error">{getApiErrorMessage(auth.error, 'Giriş yapılamadı. E-posta ve şifrenizi kontrol edin.')}</Alert>}
            <TextField label="E-posta Adresi" type="email" {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message} />
            <TextField label="Şifre" type="password" {...register('password')} error={Boolean(errors.password)} helperText={errors.password?.message} />
            <Button size="large" variant="contained" disabled={auth.isPending} onClick={handleSubmit(submit)} sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: '12px', background: 'linear-gradient(90deg, #3B246B 0%, #6D52A5 100%)', boxShadow: '0 8px 16px rgba(59,36,107,0.3)', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 20px rgba(59,36,107,0.4)' } }}>{auth.isPending ? 'Giriş yapılıyor…' : 'Giriş Yap'}</Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component="button" type="button" onClick={() => navigate('/register')} sx={{ color: 'text.secondary', textDecoration: 'none', fontWeight: 500, position: 'relative', '&::after': { content: '""', position: 'absolute', width: '100%', transform: 'scaleX(0)', height: '2px', bottom: -2, left: 0, backgroundColor: 'primary.main', transformOrigin: 'bottom right', transition: 'transform 0.25s ease-out' }, '&:hover::after': { transform: 'scaleX(1)', transformOrigin: 'bottom left' }, '&:hover': { color: 'primary.main' } }}>Hesabınız yok mu? Kayıt olun</Link>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
