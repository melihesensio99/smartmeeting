import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { navigate } from "../../app/navigation";
import { getApiErrorMessage, register as registerUser } from "../../lib/api";

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Ad soyad en az 2 karakter olmalıdır.")
      .max(160),
    email: z.string().email("Geçerli bir e-posta giriniz."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır.").max(128),
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler eşleşmiyor.",
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const registration = useMutation({
    mutationFn: (input: RegisterInput) =>
      registerUser(input.email, input.password, input.displayName),
    onSuccess: () => navigate("/login"),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const submit = (input: RegisterInput) => registration.mutate(input);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #090D16 0%, #0F172A 50%, #1E1B4B 100%)",
        display: "grid",
        placeItems: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0) 70%)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)",
          zIndex: 0,
        }}
      />
      <Card
        sx={{
          width: "100%",
          maxWidth: 650,
          borderRadius: 4,
          position: "relative",
          zIndex: 1,
          backgroundColor: "rgba(17, 24, 39, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          animation: "sm-fade-in 0.5s ease",
        }}
      >
        <CardContent sx={{ p: { xs: 4, md: 6 } }}>
          <Stack spacing={3.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)",
                  boxShadow: "0 4px 14px rgba(244,63,94,0.4)",
                  color: "white",
                  fontWeight: 900,
                  fontSize: 24,
                }}
              >
                M
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "primary.light" }}
              >
                Meeting
              </Typography>
            </Stack>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(90deg, #F9FAFB 0%, #818CF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              Hesap Oluştur
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1.1rem" }}>
              Toplantı akışınızı ve ekip aksiyonlarınızı yönetmek için
              hesabınızı oluşturun.
            </Typography>
            {registration.isError && (
              <Alert severity="error">
                {getApiErrorMessage(registration.error, "Kayıt tamamlanamadı.")}
              </Alert>
            )}
            <TextField
              label="Ad Soyad"
              {...register("displayName")}
              error={Boolean(errors.displayName)}
              helperText={errors.displayName?.message}
            />
            <TextField
              label="E-posta Adresi"
              type="email"
              {...register("email")}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
            <TextField
              label="Şifre"
              type="password"
              {...register("password")}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
            />
            <TextField
              label="Şifre Tekrar"
              type="password"
              {...register("confirmPassword")}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
            />
            <Button
              size="large"
              variant="contained"
              disabled={registration.isPending}
              onClick={handleSubmit(submit)}
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                borderRadius: "12px",
                background: "linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)",
                boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 24px rgba(99,102,241,0.5)",
                },
              }}
            >
              {registration.isPending ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/login")}
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  fontWeight: 500,
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    width: "100%",
                    transform: "scaleX(0)",
                    height: "2px",
                    bottom: -2,
                    left: 0,
                    backgroundColor: "primary.light",
                    transformOrigin: "bottom right",
                    transition: "transform 0.25s ease-out",
                  },
                  "&:hover::after": {
                    transform: "scaleX(1)",
                    transformOrigin: "bottom left",
                  },
                  "&:hover": { color: "primary.light" },
                }}
              >
                Zaten hesabınız var mı? Giriş yapın
              </Link>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
