import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Meeting, Participant } from "../../types/meeting";

type Props = {
  meeting: Meeting;
  participants: Participant[];
  isOrganizer: boolean;
  isRoomManager: boolean;
  sendingEmail: boolean;
  onManageParticipants: () => void;
  onSendEmail: () => void;
};

export function MeetingParticipantsPanel({
  meeting,
  participants,
  isOrganizer,
  isRoomManager,
  sendingEmail,
  onManageParticipants,
  onSendEmail,
}: Props) {
  return (
    <Card
      sx={{
        overflow: "visible",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.shadows[8],
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Katılımcılar ve e-posta alıcıları
            </Typography>
            <Chip
              size="small"
              label={`${participants.length} kişi`}
              color={participants.length ? "success" : "default"}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Toplantı tamamlandığında AI özeti ve aksiyonlar aşağıdaki kişilere
            gönderilebilir.
          </Typography>
          {participants.length ? (
            <Stack spacing={1.5}>
              {participants.map((participant) => (
                <Stack
                  key={participant.id}
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha("#FFFFFF", 0.03),
                    transition: "background-color 0.2s",
                    "&:hover": { bgcolor: alpha("#FFFFFF", 0.06) },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: "1rem",
                      bgcolor: alpha("#6366F1", 0.2),
                      color: "primary.light",
                      fontWeight: 700,
                    }}
                  >
                    {participant.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                    >
                      {participant.displayName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {participant.email}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    variant={
                      participant.canManageMeeting ? "filled" : "outlined"
                    }
                    color={participant.canManageMeeting ? "primary" : "default"}
                    label={
                      participant.userId === meeting.organizerId
                        ? "Toplantıyı kuran"
                        : "Katılımcı"
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              ))}
            </Stack>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Henüz katılımcı eklenmedi.
            </Alert>
          )}
          {(isOrganizer || (isRoomManager && !isOrganizer)) && (
            <Button
              fullWidth
              variant="outlined"
              sx={{ py: 1.5, fontWeight: 700 }}
              onClick={onManageParticipants}
            >
              {isOrganizer
                ? "Katılımcı ekle ve yetkiyi düzenle"
                : "Konuşmacı eşleştirmelerini yönet"}
            </Button>
          )}
          {isRoomManager && (
            <IconButton
              aria-label="Transkript ve AI özetini e-posta ile gönder"
              title="Transkript ve AI özetini e-posta ile gönder"
              color="secondary"
              disabled={
                !meeting.transcript ||
                !meeting.summary ||
                !meeting.participants.length ||
                sendingEmail
              }
              onClick={onSendEmail}
              sx={{ alignSelf: "flex-end" }}
            >
              {sendingEmail ? "…" : "✉"}
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
