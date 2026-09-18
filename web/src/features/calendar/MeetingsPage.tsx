import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { useMemo, useState } from "react";
import { navigate } from "../../app/navigation";
import type { Meeting } from "../../types/meeting";

export function MeetingsPage({
  meetings,
  canCreateMeetings,
  onCreateMeeting,
}: {
  meetings: Meeting[];
  canCreateMeetings: boolean;
  onCreateMeeting: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      meetings.filter((meeting) =>
        meeting.title
          .toLocaleLowerCase("tr-TR")
          .includes(search.toLocaleLowerCase("tr-TR")),
      ),
    [meetings, search],
  );
  const statusOf = (meeting: Meeting) => String(meeting.status);
  const statusLabel = (meeting: Meeting) =>
    (
      ({
        "0": "Planlandı",
        "1": "Kayıt alınıyor",
        "2": "İşleniyor",
        "3": "Hazır",
        "4": "Başarısız",
        "5": "İptal edildi",
        "6": "Tamamlandı",
        Scheduled: "Planlandı",
        Recording: "Kayıt alınıyor",
        Processing: "İşleniyor",
        Ready: "Hazır",
        Failed: "Başarısız",
        Cancelled: "İptal edildi",
        Completed: "Tamamlandı",
      }) as Record<string, string>
    )[statusOf(meeting)] ?? statusOf(meeting);
  const statusColor = (
    meeting: Meeting,
  ): "default" | "success" | "warning" | "error" | "info" =>
    statusOf(meeting) === "6" || statusOf(meeting) === "Completed"
      ? "success"
      : statusOf(meeting) === "4" || statusOf(meeting) === "Failed"
        ? "error"
        : statusOf(meeting) === "1" || statusOf(meeting) === "Recording"
          ? "warning"
          : statusOf(meeting) === "2" || statusOf(meeting) === "Processing"
            ? "info"
            : "default";

  return (
    <Stack spacing={4}>
      {/* Header Section */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          pb: 2,
        }}
      >
        <Stack spacing={1}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Toplantılar
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Tüm toplantılarınızı buradan yönetin.
          </Typography>
        </Stack>
        {canCreateMeetings && (
          <Button
            variant="contained"
            onClick={onCreateMeeting}
            sx={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
              px: 3,
              py: 1,
              fontWeight: 600,
              gap: 1,
              "&:hover": {
                background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
              },
            }}
          >
            <Box component="span" sx={{ fontSize: "1.2rem", lineHeight: 1 }}>
              ＋
            </Box>
            Yeni Toplantı
          </Button>
        )}
        {/* Subtle bottom gradient line decoration */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #3B246B 0%, transparent 100%)",
            opacity: 0.2,
            borderRadius: 1,
          }}
        />
      </Stack>

      {/* Search Section */}
      <Card
        sx={{
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          transition: "box-shadow 0.3s",
          "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
        }}
      >
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <TextField
            fullWidth
            placeholder="Toplantı başlığı ara..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component="span"
                      sx={{ fontSize: "1.2rem", opacity: 0.5 }}
                    >
                      🔍
                    </Box>
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Meetings List Section */}
      <Card
        sx={{
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          transition: "box-shadow 0.3s",
          "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Stack spacing={0}>
            {filtered.map((meeting, index) => (
              <Stack
                key={meeting.id}
                direction={{ xs: "column", md: "row" }}
                sx={{
                  py: 3,
                  px: 4,
                  gap: 2,
                  alignItems: { md: "center" },
                  borderBottom: index === filtered.length - 1 ? 0 : 1,
                  borderColor: "divider",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: "action.hover",
                    "&::before": {
                      transform: "scaleY(1)",
                    },
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    bgcolor: "#3B246B",
                    transform: "scaleY(0)",
                    transition: "transform 0.2s ease-in-out",
                    transformOrigin: "center",
                  },
                }}
              >
                <Typography
                  sx={{
                    flex: 2,
                    fontWeight: 700,
                    color: "text.primary",
                    fontSize: "1.05rem",
                  }}
                >
                  {meeting.title}
                </Typography>
                <Typography
                  sx={{ flex: 1, color: "text.secondary", fontWeight: 500 }}
                >
                  {new Date(meeting.startsAt).toLocaleDateString("tr-TR")}
                </Typography>
                <Typography
                  sx={{ flex: 1, color: "text.secondary", fontWeight: 500 }}
                >
                  {new Date(meeting.startsAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
                <Chip
                  label={statusLabel(meeting)}
                  color={statusColor(meeting)}
                  sx={{ minWidth: 120, fontWeight: 600, borderRadius: "8px" }}
                />
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/meetings/${meeting.id}`)}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "divider",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "#3B246B",
                      bgcolor: alpha("#3B246B", 0.05),
                      color: "#3B246B",
                    },
                  }}
                >
                  ◉ İncele & Not Al
                </Button>
              </Stack>
            ))}
            {!filtered.length && (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box component="span" sx={{ fontSize: "3rem", opacity: 0.2 }}>
                  📋
                </Box>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: "1.1rem", fontWeight: 500 }}
                >
                  Aramanızla eşleşen toplantı bulunamadı.
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
