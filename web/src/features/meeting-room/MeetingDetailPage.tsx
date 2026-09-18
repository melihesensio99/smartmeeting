import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "../../app/navigation";
import { getApiErrorMessage, searchUsers } from "../../lib/api";
import type {
  AddParticipantInput,
  Meeting,
  Participant,
  UserResponse,
} from "../../types/meeting";
import type { ActionItem, ActionPriority } from "../../types/meeting";
import { ActionItemEditor } from "../actions/ActionItemEditor";
import { useMeetingRoomPresence } from "./useMeetingRoomPresence";
import { MeetingRoomMediaPanel } from "./MeetingRoomMediaPanel";
import {
  AudioRecorderCard,
  type AudioRecorderController,
} from "./AudioRecorderCard";
import type { RecorderState } from "../../hooks/useAudioRecorder";
import { getMeetingPermissions } from "./meetingPermissions";
import { MeetingSummaryPanel } from "./MeetingSummaryPanel";
import { MeetingTranscriptPanel } from "./MeetingTranscriptPanel";
import { MeetingParticipantsPanel } from "./MeetingParticipantsPanel";
import { MeetingRecordingHeader } from "./MeetingRecordingHeader";

type Props = {
  meeting: Meeting | undefined;
  currentUserId: string | null;
  canCompleteMeeting: boolean;
  onComplete: (meetingId: string, actionItemId: string) => void;
  onCompleteMeeting: (meetingId: string) => void;
  onUpdateAction: (
    meetingId: string,
    actionItemId: string,
    input: {
      assigneeUserIds: string[];
      dueAt: string | null;
      priority: ActionPriority;
    },
  ) => void;
  onCreateAction: (
    meetingId: string,
    input: {
      description: string;
      assigneeUserIds: string[];
      dueAt: string | null;
      priority: ActionPriority;
    },
  ) => void;
  onSaveNotes: (meetingId: string, notes: string) => void;
  onRecordingStart: (meetingId: string) => Promise<void>;
  onAudioReady: (meetingId: string, audio: Blob) => void;
  recordingUploading: boolean;
  recordingStarting: boolean;
  completingMeeting: boolean;
  onMapSpeaker: (
    meetingId: string,
    participantId: string,
    speakerLabel: string,
  ) => void;
  onConfirmSpeaker: (meetingId: string, participantId: string) => void;
  onRejectSpeaker: (meetingId: string, participantId: string) => void;
  onAddParticipant: (meetingId: string, input: AddParticipantInput) => void;
  onUpdateParticipantPermission: (
    meetingId: string,
    participantId: string,
    canManageMeeting: boolean,
  ) => void;
  onRemoveParticipant: (meetingId: string, participantId: string) => void;
  onSendEmail: (meetingId: string) => void;
  onRetryProcessing: (meetingId: string) => void;
  savingNotes: boolean;
  addingParticipant: boolean;
  updatingParticipantPermission: boolean;
  removingParticipant: boolean;
  confirmingSpeaker: boolean;
  rejectingSpeaker: boolean;
  sendingEmail: boolean;
  updatingAction: boolean;
  creatingAction: boolean;
  retryingProcessing: boolean;
  emailSent: boolean;
  emailError: string | null;
  onLeaveMeeting?: (meetingId: string) => void;
  leavingMeeting?: boolean;
};

export function MeetingDetailPage({
  meeting,
  currentUserId,
  canCompleteMeeting,
  onCompleteMeeting,
  onUpdateAction,
  onCreateAction,
  onSaveNotes,
  onRecordingStart,
  onAudioReady,
  recordingUploading,
  recordingStarting,
  onMapSpeaker,
  onConfirmSpeaker,
  onRejectSpeaker,
  onAddParticipant: onAddParticipantSingle,
  onUpdateParticipantPermission,
  onRemoveParticipant,
  onSendEmail,
  onRetryProcessing,
  savingNotes,
  addingParticipant,
  updatingParticipantPermission,
  removingParticipant,
  confirmingSpeaker,
  rejectingSpeaker,
  sendingEmail,
  updatingAction,
  creatingAction,
  retryingProcessing,
  completingMeeting,
  emailSent,
  emailError,
}: Props) {
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>(
    {},
  );
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedUser, setSelectedUserState] = useState<UserResponse | null>(
    null,
  );
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [creatingActionForm, setCreatingActionForm] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "status" | "transcript" | "participants" | "summary"
  >("status");
  const [panelOpen, setPanelOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<RecorderState>("idle");
  const [recordingDuration, setRecordingDuration] = useState("00:00:00");
  const recorderControllerRef = useRef<AudioRecorderController | null>(null);
  const [participantNotes, setParticipantNotes] = useState(
    meeting?.notes ?? "",
  );
  const users = useQuery({
    queryKey: ["users", participantSearch],
    queryFn: () => searchUsers(participantSearch),
    enabled: participantSearch.trim().length >= 2,
  });
  const roomPresence = useMeetingRoomPresence(meeting?.id);
  const setSelectedUser = (user: UserResponse | null) => {
    setSelectedUserState(user);
    if (user)
      setSelectedUsers((current) =>
        current.some((selected) => selected.userId === user.userId)
          ? current
          : [...current, user],
      );
  };
  const effectiveSelectedUser =
    selectedUser ?? (users.data?.length === 1 ? users.data[0] : null);
  const addSelectedParticipants = (
    meetingId: string,
    fallback: UserResponse,
  ) => {
    const batch = selectedUsers.length ? selectedUsers : [fallback];
    batch.forEach((user) =>
      onAddParticipantSingle(meetingId, { ...user, canManageMeeting: false }),
    );
    setSelectedUsers([]);
    setSelectedUserState(null);
    setParticipantSearch("");
  };
  const onAddParticipant = (meetingId: string, input: AddParticipantInput) =>
    addSelectedParticipants(meetingId, input);
  const meetingId = meeting?.id;
  useEffect(() => {
    if (!meetingId) return;
    if (roomPresence.isInRoom)
      localStorage.setItem("smartmeeting-live-room", meetingId);
    else if (localStorage.getItem("smartmeeting-live-room") === meetingId)
      localStorage.removeItem("smartmeeting-live-room");
    window.dispatchEvent(new Event("smartmeeting-live-room-changed"));
  }, [meetingId, roomPresence.isInRoom]);
  if (!meeting)
    return (
      <Alert severity="warning">
        Toplantı bulunamadı.{" "}
        <Button onClick={() => navigate("/meetings")}>Toplantılara dön</Button>
      </Alert>
    );
  const status = String(meeting.status);
  const statusInfo: Record<
    string,
    {
      label: string;
      color: "default" | "primary" | "warning" | "info" | "success" | "error";
      message: string;
      progress: number;
    }
  > = {
    "0": {
      label: "Planlandı",
      color: "default",
      message: "Toplantı kaydı başlatılmaya hazır.",
      progress: 0,
    },
    "1": {
      label: "Kayıt alınıyor",
      color: "warning",
      message: "Mikrofon kaydı devam ediyor.",
      progress: 25,
    },
    "2": {
      label: "İşleniyor",
      color: "info",
      message: "Ses dosyası, transkript ve AI özeti hazırlanıyor.",
      progress: 70,
    },
    "3": {
      label: "Hazır",
      color: "success",
      message: "Transkript ve AI özeti hazır.",
      progress: 100,
    },
    "4": {
      label: "Başarısız",
      color: "error",
      message: "Toplantı işlenirken bir hata oluştu.",
      progress: 100,
    },
    "5": {
      label: "İptal edildi",
      color: "default",
      message: "Toplantı işlemi iptal edildi.",
      progress: 0,
    },
    "6": {
      label: "Tamamlandı",
      color: "success",
      message:
        "Toplantı yöneticisi tarafından sonlandırıldı. Oda yeniden açılamaz.",
      progress: 100,
    },
  };
  const statusKey =
    (
      {
        Scheduled: "0",
        Recording: "1",
        Processing: "2",
        Ready: "3",
        Failed: "4",
        Cancelled: "5",
        Completed: "6",
      } as Record<string, string>
    )[status] ?? status;
  const currentStatus = statusInfo[statusKey] ?? {
    label: status,
    color: "default" as const,
    message: "Toplantı durumu güncelleniyor.",
    progress: 0,
  };
  const { isOrganizer, isRoomManager, isCompleted } = getMeetingPermissions(
    meeting,
    currentUserId,
    canCompleteMeeting,
  );
  const actionParticipants: Participant[] = [
    {
      id: meeting.id,
      userId: meeting.organizerId,
      displayName: meeting.organizerEmail ?? "Toplantı yöneticisi",
      email: meeting.organizerEmail ?? "organizer@meeting.local",
      canManageMeeting: true,
      speakerLabel: null,
      speakerMappingStatus: "None" as const,
      speakerConfidence: null,
    },
    ...meeting.participants,
  ].filter(
    (participant, index, all) =>
      all.findIndex((item) => item.userId === participant.userId) === index,
  );
  const emailParticipants: Participant[] = [
    {
      id: meeting.id,
      userId: meeting.organizerId,
      displayName: "Toplantıyı kuran",
      email: meeting.organizerEmail ?? "organizer@meeting.local",
      canManageMeeting: true,
      speakerLabel: null,
      speakerMappingStatus: "None" as const,
      speakerConfidence: null,
    },
    ...meeting.participants,
  ].filter(
    (participant, index, all) =>
      all.findIndex((item) => item.userId === participant.userId) === index,
  );
  return (
    <Stack spacing={4}>
      {(!roomPresence.isInRoom || isCompleted) && (
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          {meeting.title}
        </Typography>
      )}
      {roomPresence.isInRoom && !isCompleted && (
        <MeetingRecordingHeader
          title={meeting.title}
          isRoomManager={isRoomManager}
          isOrganizer={isOrganizer}
          recordingDuration={recordingDuration}
          recordingState={recordingState}
          recordingUploading={recordingUploading}
          recordingStarting={recordingStarting}
          completingMeeting={completingMeeting}
          statusKey={statusKey}
          recorderControllerRef={recorderControllerRef}
          onCompleteMeeting={() => onCompleteMeeting(meeting.id)}
          onLeave={() => void roomPresence.leaveRoom()}
        />
      )}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        sx={{ alignItems: "stretch" }}
      >
        <Stack
          spacing={3}
          sx={{
            flex: 1,
            minWidth: 0,
            ...(roomPresence.isInRoom
              ? { "& > .MuiCard-root:first-child": { display: "none" } }
              : {}),
          }}
        >
          <Card
            sx={{
              border: "1px solid",
              borderColor: roomPresence.isInRoom ? "success.main" : "divider",
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                {roomPresence.isInRoom && (
                  <Alert severity="success">
                    ● Şu an bu toplantının canlı odasındasınız.
                  </Alert>
                )}
                {isCompleted && (
                  <Alert severity="info">
                    Bu toplantı tamamlandı. Canlı odaya yeniden katılım kapalı.
                  </Alert>
                )}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  sx={{
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Canlı toplantı odası
                    </Typography>
                    <Typography color="text.secondary">
                      Odaya girdiğinizde katılımcıları gerçek zamanlı görebilir,
                      odadan çıktığınızda toplantı günün listesinde kalır.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant={roomPresence.isInRoom ? "outlined" : "contained"}
                      color={roomPresence.isInRoom ? "error" : "primary"}
                      disabled={roomPresence.isConnecting || isCompleted}
                      onClick={() =>
                        void (roomPresence.isInRoom
                          ? roomPresence.leaveRoom()
                          : roomPresence.enterRoom())
                      }
                    >
                      {roomPresence.isConnecting
                        ? "Bağlanıyor…"
                        : roomPresence.isInRoom
                          ? "Odadan çık"
                          : "Odaya gir"}
                    </Button>
                  </Stack>
                </Stack>
                {roomPresence.error && (
                  <Alert severity="error">{roomPresence.error}</Alert>
                )}
                {roomPresence.isInRoom ? (
                  <>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", flexWrap: "wrap" }}
                    >
                      <Chip
                        color="success"
                        label={`${roomPresence.participants.length} kişi şu an odada`}
                      />
                      {roomPresence.participants.map((participant) => (
                        <Chip
                          key={participant.userId}
                          variant="outlined"
                          label={`${participant.displayName}${participant.isOrganizer ? " · Yönetici" : ""}`}
                        />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Katılımcıların giriş ve çıkışları bu alanda anlık
                      güncellenir.
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {isCompleted
                      ? "Toplantı tamamlandı."
                      : "Henüz odaya girmediniz. Odaya girdiğinizde diğer aktif katılımcılar görünür."}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
          {roomPresence.isInRoom && (
            <MeetingRoomMediaPanel
              localStream={roomPresence.localStream}
              remoteStreams={roomPresence.remoteStreams}
              participants={roomPresence.participants}
              isMuted={roomPresence.isMuted}
              isCameraOff={roomPresence.isCameraOff}
              onToggleMute={roomPresence.toggleMute}
              onToggleCamera={roomPresence.toggleCamera}
            />
          )}
          {(isRoomManager || roomPresence.isInRoom) && (
            <MeetingTranscriptPanel
              transcript={meeting.transcript}
              isInRoom={roomPresence.isInRoom}
            />
          )}
          {roomPresence.isInRoom && !isRoomManager && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "primary.light" }}
                    >
                      Canlı toplantı notları
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        participantNotes.trim() ? "Not var" : "Henüz not yok"
                      }
                      color={participantNotes.trim() ? "primary" : "default"}
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Toplantı notu ekle / düzenle"
                    value={participantNotes}
                    disabled
                    onChange={(event) =>
                      setParticipantNotes(event.target.value)
                    }
                    placeholder="Toplantı sırasında önemli kararları veya bağlamı yazın..."
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Bu notlar STT tamamlandıktan sonra AI özetine bağlam
                      olarak dahil edilir.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Not düzenleme yalnızca oda yöneticisine açıktır.
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              flexWrap: "wrap",
              display: roomPresence.isInRoom ? "none" : "flex",
            }}
          >
            {[
              {
                key: "status" as const,
                label: "İşlem durumu",
                value: currentStatus.label,
              },
              {
                key: "transcript" as const,
                label: "Transkript",
                value: meeting.transcript ? "Hazır" : "Henüz hazır değil",
              },
              {
                key: "summary" as const,
                label: "Özet & aksiyonlar",
                value: meeting.summary
                  ? `${meeting.summary.actionItems.length} aksiyon`
                  : "Hazırlanıyor",
              },
            ].map((panel) => (
              <Card
                key={panel.key}
                sx={{
                  flex: "1 1 210px",
                  minWidth: 190,
                  border: activePanel === panel.key ? 2 : 1,
                  borderColor:
                    activePanel === panel.key ? "primary.main" : "divider",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: (theme) => theme.shadows[4],
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background:
                      "linear-gradient(90deg, #6366F1 0%, #F43F5E 100%)",
                    opacity: activePanel === panel.key ? 1 : 0,
                    transition: "opacity 0.2s ease",
                  },
                }}
              >
                <CardActionArea
                  sx={{ height: "100%" }}
                  onClick={() => {
                    setActivePanel(panel.key);
                    setPanelOpen(true);
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {panel.label}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
                      {panel.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ display: "block", mt: 1, fontWeight: 600 }}
                    >
                      Açmak için tıkla →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Stack>
        <Stack
          id="meeting-recording"
          spacing={3}
          sx={{
            width: { xs: "100%", lg: 440 },
            maxWidth: "100%",
            flexShrink: 0,
          }}
        >
          <MeetingParticipantsPanel
            meeting={meeting}
            participants={emailParticipants}
            isOrganizer={isOrganizer}
            isRoomManager={isRoomManager}
            sendingEmail={sendingEmail}
            onManageParticipants={() => {
              setActivePanel("participants");
              setPanelOpen(true);
            }}
            onSendEmail={() => onSendEmail(meeting.id)}
          />
          {roomPresence.isInRoom && isRoomManager && (
            <AudioRecorderCard
              meetings={[meeting]}
              selectedMeetingId={meeting.id}
              onMeetingChange={() => undefined}
              onRecordingStart={onRecordingStart}
              onAudioReady={(audio) => onAudioReady(meeting.id, audio)}
              onSaveNotes={onSaveNotes}
              uploading={recordingUploading}
              starting={recordingStarting}
              savingNotes={savingNotes}
              fixedMeeting={meeting}
              canRecord
              onRecordingStateChange={setRecordingState}
              onRecordingDurationChange={setRecordingDuration}
              onControllerReady={(controller) => {
                recorderControllerRef.current = controller;
              }}
              hideActionButton
              compact
            />
          )}
          {roomPresence.isInRoom && !isRoomManager && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack
                  spacing={2}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    background: (theme) =>
                      `linear-gradient(${theme.palette.background.paper}, ${theme.palette.background.paper}) padding-box, linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(theme.palette.secondary.main, 0.4)}) border-box`,
                    border: "2px solid transparent",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: "primary.light" }}
                  >
                    Canlı toplantı notları
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={5}
                    label="Not ekle"
                    value={participantNotes}
                    onChange={(event) =>
                      setParticipantNotes(event.target.value)
                    }
                    placeholder="Toplantı sırasında önemli kararları veya bağlamı yazın..."
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  />
                  <Button
                    variant="outlined"
                    sx={{ borderRadius: 3, py: 1 }}
                    onClick={() => onSaveNotes(meeting.id, participantNotes)}
                    disabled={!participantNotes.trim() || savingNotes}
                  >
                    {savingNotes ? "Not kaydediliyor…" : "Notları kaydet"}
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textAlign: "center" }}
                  >
                    Bu notlar STT tamamlandıktan sonra AI özetine bağlam olarak
                    dahil edilir.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Stack>
      <Dialog
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        fullWidth
        maxWidth="lg"
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
      >
        <DialogTitle
          sx={{ bgcolor: "primary.main", color: "primary.contrastText", pb: 2 }}
        >
          {
            (
              {
                status: "📊 Toplantı işlem durumu",
                transcript: "📝 Konuşmacılı transkript",
                participants: "👥 Katılımcılar ve konuşmacı eşleştirme",
                summary: "✨ Özet ve aksiyonlar",
              } as Record<typeof activePanel, string>
            )[activePanel]
          }
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: "background.default" }}>
          <Card
            sx={{
              display: activePanel === "status" ? "block" : "none",
              boxShadow: 2,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Toplantı işlem durumu
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Chip
                      label={currentStatus.label}
                      color={currentStatus.color}
                      sx={{ fontWeight: 700 }}
                    />
                    {isRoomManager && statusKey === "4" && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        disabled={retryingProcessing}
                        onClick={() => onRetryProcessing(meeting.id)}
                      >
                        {retryingProcessing
                          ? "Tekrar deneniyor…"
                          : "Yeniden işle"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
                <Typography color="text.secondary">
                  {currentStatus.message}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={currentStatus.progress}
                  color={
                    currentStatus.color === "default"
                      ? "primary"
                      : currentStatus.color
                  }
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: (theme) =>
                      alpha(
                        theme.palette[
                          currentStatus.color === "default"
                            ? "primary"
                            : currentStatus.color
                        ].main,
                        0.2,
                      ),
                    "& .MuiLinearProgress-bar": {
                      background:
                        currentStatus.color === "default" ||
                        currentStatus.color === "primary"
                          ? "linear-gradient(90deg, #3B246B 0%, #6D52A5 100%)"
                          : undefined,
                      borderRadius: 6,
                    },
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
          <Card
            sx={{
              display: activePanel === "transcript" ? "block" : "none",
              boxShadow: 2,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Konuşmacılı transkript
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                  {meeting.transcript ??
                    "Transkript henüz hazır değil. Ses kaydı tamamlandığında burada görünecek."}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card
            sx={{
              display: activePanel === "participants" ? "block" : "none",
              boxShadow: 2,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Katılımcılar ve konuşmacı eşleştirme
              </Typography>
              {isOrganizer && (
                <>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ mt: 3, mb: 2 }}
                  >
                    <TextField
                      fullWidth
                      size="medium"
                      label="Kayıtlı kullanıcı ara"
                      placeholder="Ad soyad veya e-posta"
                      value={participantSearch}
                      onChange={(event) => {
                        setParticipantSearch(event.target.value);
                        setSelectedUser(null);
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <Button
                      variant="contained"
                      disabled={!effectiveSelectedUser || addingParticipant}
                      sx={{ px: 4, fontWeight: 700 }}
                      onClick={() => {
                        if (!effectiveSelectedUser) return;
                        const input: AddParticipantInput = {
                          ...effectiveSelectedUser,
                          canManageMeeting: false,
                        };
                        onAddParticipant(meeting.id, input);
                        setParticipantSearch("");
                        setSelectedUser(null);
                      }}
                    >
                      {addingParticipant ? "Ekleniyor…" : "Katılımcı ekle"}
                    </Button>
                  </Stack>
                  {users.isFetching && (
                    <Typography color="text.secondary">
                      Kullanıcılar aranıyor…
                    </Typography>
                  )}
                  {users.isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {getApiErrorMessage(
                        users.error,
                        "Kullanıcılar getirilemedi.",
                      )}
                    </Alert>
                  )}
                  {users.data && users.data.length > 0 && (
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      {users.data.map((user) => (
                        <Button
                          key={user.userId}
                          variant={
                            effectiveSelectedUser?.userId === user.userId
                              ? "contained"
                              : "outlined"
                          }
                          onClick={() => setSelectedUser(user)}
                          sx={{
                            justifyContent: "flex-start",
                            textAlign: "left",
                            py: 1.5,
                            borderRadius: 2,
                          }}
                        >
                          {effectiveSelectedUser?.userId === user.userId
                            ? "✓ Seçildi · "
                            : ""}
                          {user.displayName} · {user.email}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </>
              )}
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {isOrganizer
                  ? "Yalnızca sistemde kayıtlı kullanıcılar eklenebilir. Yeni katılımcılar normal yetkiyle eklenir; yönetim yetkisini aşağıdaki listeden verebilirsiniz."
                  : "Toplantı sahibi katılımcı ve toplantı içi yetkilerini yönetir. Yetkili katılımcılar kayıt, not, aksiyon ve konuşmacı işlemlerini yönetebilir."}
              </Typography>
              <Stack spacing={2}>
                {meeting.participants.length ? (
                  meeting.participants.map((participant) => (
                    <Stack
                      key={participant.id}
                      direction={{ xs: "column", md: "row" }}
                      sx={{
                        gap: 2,
                        alignItems: { md: "center" },
                        p: 2,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: alpha("#3B246B", 0.1),
                          color: "primary.main",
                          fontWeight: 700,
                        }}
                      >
                        {participant.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        sx={{ minWidth: 180, fontWeight: 700, flex: 1 }}
                      >
                        {participant.displayName}
                        {participant.canManageMeeting && (
                          <Chip
                            size="small"
                            label="Toplantı yöneticisi"
                            color="primary"
                            sx={{ ml: 1, fontWeight: 600 }}
                          />
                        )}
                      </Typography>
                      {isRoomManager && (
                        <>
                          <Select
                            size="small"
                            displayEmpty
                            value={
                              speakerLabels[participant.id] ??
                              participant.speakerLabel ??
                              ""
                            }
                            onChange={(event) =>
                              setSpeakerLabels((current) => ({
                                ...current,
                                [participant.id]: event.target.value,
                              }))
                            }
                            sx={{ minWidth: 180, borderRadius: 2 }}
                          >
                            <MenuItem value="">
                              <em>Speaker etiketi seçin</em>
                            </MenuItem>
                            {Array.from({ length: 9 }, (_, index) => (
                              <MenuItem
                                key={index}
                                value={`Speaker ${index + 1}`}
                              >
                                Speaker {index + 1}
                              </MenuItem>
                            ))}
                          </Select>
                          <Button
                            variant="outlined"
                            disabled={!speakerLabels[participant.id]?.trim()}
                            onClick={() =>
                              onMapSpeaker(
                                meeting.id,
                                participant.id,
                                speakerLabels[participant.id],
                              )
                            }
                          >
                            Öneriyi kaydet
                          </Button>
                          {participant.speakerMappingStatus ===
                            "PendingConfirmation" && (
                            <>
                              <Chip
                                size="small"
                                color="warning"
                                label={`Onay bekliyor${participant.speakerConfidence !== null ? ` · %${Math.round(participant.speakerConfidence * 100)}` : ""}`}
                                sx={{ fontWeight: 600 }}
                              />
                              <Button
                                size="small"
                                variant="contained"
                                disabled={confirmingSpeaker}
                                onClick={() =>
                                  onConfirmSpeaker(meeting.id, participant.id)
                                }
                              >
                                Onayla
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                disabled={rejectingSpeaker}
                                onClick={() =>
                                  onRejectSpeaker(meeting.id, participant.id)
                                }
                              >
                                Reddet
                              </Button>
                            </>
                          )}
                          {participant.speakerMappingStatus === "Confirmed" && (
                            <Chip
                              size="small"
                              color="success"
                              label="Eşleştirme onaylandı"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </>
                      )}
                      {isOrganizer && (
                        <>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={participant.canManageMeeting}
                                disabled={updatingParticipantPermission}
                                onChange={(event) =>
                                  onUpdateParticipantPermission(
                                    meeting.id,
                                    participant.id,
                                    event.target.checked,
                                  )
                                }
                              />
                            }
                            label="Yönetim"
                          />
                          <Button
                            color="error"
                            size="small"
                            variant="outlined"
                            disabled={removingParticipant}
                            onClick={() =>
                              onRemoveParticipant(meeting.id, participant.id)
                            }
                          >
                            Çıkar
                          </Button>
                        </>
                      )}
                    </Stack>
                  ))
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Bu toplantıya henüz katılımcı eklenmemiş.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
          {activePanel === "summary" && (
            <MeetingSummaryPanel
              meeting={meeting}
              actionParticipants={actionParticipants}
              isRoomManager={isRoomManager}
              sendingEmail={sendingEmail}
              onSendEmail={onSendEmail}
              onEditAction={setEditingAction}
            />
          )}
          {activePanel === "summary" && isRoomManager && (
            <Card sx={{ mt: 3, boxShadow: 2, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Manuel aksiyon atama
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ fontWeight: 700 }}
                    disabled={!meeting.summary}
                    onClick={() => setCreatingActionForm(true)}
                  >
                    Elle aksiyon ata
                  </Button>
                </Stack>
                {!meeting.summary && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Manuel aksiyon atamak için AI özetinin hazır olması gerekir.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
      {emailSent && (
        <Alert severity="success" sx={{ borderRadius: 2, boxShadow: 1 }}>
          Toplantı özeti katılımcılara e-posta ile gönderildi.
        </Alert>
      )}
      {emailError && (
        <Alert severity="error" sx={{ borderRadius: 2, boxShadow: 1 }}>
          {emailError}
        </Alert>
      )}
      <ActionItemEditor
        key={creatingActionForm ? "new" : (editingAction?.id ?? "closed")}
        action={creatingActionForm ? null : editingAction}
        participants={actionParticipants}
        open={creatingActionForm || editingAction !== null}
        saving={creatingActionForm ? creatingAction : updatingAction}
        includeDescription={creatingActionForm}
        onClose={() => {
          setCreatingActionForm(false);
          setEditingAction(null);
        }}
        onSave={(input) => {
          if (creatingActionForm) {
            if (!input.description) return;
            onCreateAction(meeting.id, {
              description: input.description,
              assigneeUserIds: input.assigneeUserIds,
              dueAt: input.dueAt,
              priority: input.priority,
            });
            setCreatingActionForm(false);
            return;
          }
          if (!editingAction) return;
          onUpdateAction(meeting.id, editingAction.id, {
            assigneeUserIds: input.assigneeUserIds,
            dueAt: input.dueAt,
            priority: input.priority,
          });
          setEditingAction(null);
        }}
      />
    </Stack>
  );
}
