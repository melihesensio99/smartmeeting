import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type {
  ActionItem,
  ActionPriority,
  Meeting,
  Participant,
} from "../../types/meeting";

type Props = {
  meeting: Meeting;
  actionParticipants: Participant[];
  isRoomManager: boolean;
  sendingEmail: boolean;
  onSendEmail: (meetingId: string) => void;
  onEditAction: (action: ActionItem) => void;
};

export function MeetingSummaryPanel({
  meeting,
  actionParticipants,
  isRoomManager,
  sendingEmail,
  onSendEmail,
  onEditAction,
}: Props) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={3}
      sx={{ display: "flex" }}
    >
      <Card sx={{ flex: 1, boxShadow: 2, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              AI özeti
            </Typography>
            {isRoomManager && (
              <Button
                size="small"
                variant="outlined"
                disabled={!meeting.summary || sendingEmail}
                onClick={() => onSendEmail(meeting.id)}
              >
                {sendingEmail
                  ? "Gönderiliyor…"
                  : "Katılımcılara e-posta gönder"}
              </Button>
            )}
          </Stack>
          {meeting.summary ? (
            <>
              <Typography sx={{ mt: 3, lineHeight: 1.7 }}>
                {meeting.summary.overview}
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography sx={{ fontWeight: 800, mb: 2 }}>
                Ana kararlar
              </Typography>
              {meeting.summary.decisions.map((decision) => (
                <Typography
                  key={decision}
                  sx={{
                    mt: 1.5,
                    p: 2,
                    bgcolor: alpha("#3B246B", 0.03),
                    borderRadius: 2,
                    borderLeft: "4px solid",
                    borderLeftColor: "primary.main",
                  }}
                >
                  • {decision}
                </Typography>
              ))}
            </>
          ) : (
            <Alert sx={{ mt: 3, borderRadius: 2 }} severity="info">
              Özet hazırlanıyor.
            </Alert>
          )}
        </CardContent>
      </Card>
      <Card sx={{ flex: 1, boxShadow: 2, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            Aksiyonlar
          </Typography>
          {meeting.summary?.actionItems.map((action) => (
            <Stack
              key={action.id}
              direction={{ xs: "column", sm: "row" }}
              sx={{
                alignItems: { sm: "center" },
                gap: 1.5,
                mt: 1.5,
                p: 2,
                borderLeft: "4px solid",
                borderLeftColor: action.completed
                  ? "success.main"
                  : "warning.main",
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Typography
                sx={{
                  flex: 1,
                  textDecoration: action.completed ? "line-through" : "none",
                  opacity: action.completed ? 0.7 : 1,
                  fontWeight: 500,
                }}
              >
                {action.description}{" "}
                <Box
                  component="span"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    mt: 0.5,
                    fontSize: "0.85rem",
                  }}
                >
                  {getAssigneeLabel(action, actionParticipants)} ·{" "}
                  {action.dueAt
                    ? new Date(action.dueAt).toLocaleDateString("tr-TR")
                    : "Termin yok"}
                </Box>
              </Typography>
              <Chip
                size="small"
                label={priorityLabel(action.priority)}
                color={priorityColor(action.priority)}
                sx={{ fontWeight: 600 }}
              />
              {isRoomManager && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onEditAction(action)}
                >
                  Düzenle
                </Button>
              )}
            </Stack>
          ))}
        </CardContent>
      </Card>
    </Stack>
  );
}

function priorityLabel(priority: ActionPriority) {
  const normalized = priority.toLowerCase();
  return normalized === "high"
    ? "Yüksek"
    : normalized === "low"
      ? "Düşük"
      : "Orta";
}

function priorityColor(priority: ActionPriority): "error" | "warning" | "info" {
  const normalized = priority.toLowerCase();
  return normalized === "high"
    ? "error"
    : normalized === "low"
      ? "info"
      : "warning";
}

function getAssigneeLabel(action: ActionItem, participants: Participant[]) {
  if (!action.assigneeUserIds.length) return "Atanmamış";
  const names = action.assigneeUserIds
    .map(
      (userId) =>
        participants.find((participant) => participant.userId === userId)
          ?.displayName,
    )
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join(", ") : (action.assignee ?? "Atanmamış");
}
