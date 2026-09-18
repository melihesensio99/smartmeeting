import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

type Props = {
  transcript: string | null;
  isInRoom: boolean;
};

export function MeetingTranscriptPanel({ transcript, isInRoom }: Props) {
  const lines = transcript?.split(/\r?\n/).filter(Boolean) ?? [];

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Canlı transkripsiyon akışı
            </Typography>
            <Chip
              size="small"
              label={lines.length ? `${lines.length} ileti` : "Beklemede"}
              color={lines.length ? "success" : "default"}
            />
          </Stack>
          {lines.length ? (
            <Stack spacing={1.5}>
              {lines.map((line, index) => {
                const isEven = index % 2 === 0;
                return (
                  <Box
                    key={`${index}-${line}`}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: isEven
                        ? alpha("#6366F1", 0.1)
                        : "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      alignSelf: isEven ? "flex-start" : "flex-end",
                      maxWidth: "85%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      borderBottomLeftRadius: isEven ? 4 : 16,
                      borderBottomRightRadius: !isEven ? 4 : 16,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                    >
                      {line}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Alert severity={isInRoom ? "info" : "warning"}>
              {isInRoom
                ? "Kayıt başladığında konuşma akışı burada görünecek."
                : "Canlı transkripsiyon için önce toplantı odasına girin."}
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
