import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { MutableRefObject } from "react";
import type { RecorderState } from "../../hooks/useAudioRecorder";
import type { AudioRecorderController } from "./AudioRecorderCard";

type Props = {
  title: string;
  isRoomManager: boolean;
  isOrganizer: boolean;
  recordingDuration: string;
  recordingState: RecorderState;
  recordingUploading: boolean;
  recordingStarting: boolean;
  completingMeeting: boolean;
  statusKey: string;
  recorderControllerRef: MutableRefObject<AudioRecorderController | null>;
  onCompleteMeeting: () => void;
  onLeave: () => void;
};

export function MeetingRecordingHeader({
  title,
  isRoomManager,
  isOrganizer,
  recordingDuration,
  recordingState,
  recordingUploading,
  recordingStarting,
  completingMeeting,
  statusKey,
  recorderControllerRef,
  onCompleteMeeting,
  onLeave,
}: Props) {
  return (
    <Card
      sx={{
        background:
          "linear-gradient(135deg, #1E1B4B 0%, #0F172A 60%, #111827 100%)",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        color: "text.primary",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,63,94,0.25) 0%, rgba(99,102,241,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <CardContent
        sx={{ p: { xs: 2.5, md: 3 }, position: "relative", zIndex: 1 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { md: "center" },
            gap: 2.5,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mt: 0.5,
                color: "secondary.main",
                animation: "sm-pulse 2s infinite",
              }}
            >
              Canlı toplantı ve kayıt
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              {isRoomManager
                ? "Oda aktif. Ses kaydını buradan başlatabilir veya durdurabilirsiniz."
                : "Oda aktif. Toplantıyı dinleyebilir ve canlı akışı takip edebilirsiniz."}
            </Typography>
          </Box>
          {isRoomManager ? (
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Chip
                label={recordingDuration}
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.14)",
                  fontFamily: "monospace",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  height: 48,
                  px: 1,
                }}
              />
              {recordingState === "recording" || recordingState === "paused" ? (
                <>
                  <Button
                    size="large"
                    variant="outlined"
                    color="secondary"
                    disabled={recordingUploading || recordingStarting}
                    onClick={() => recorderControllerRef.current?.togglePause()}
                    sx={{ px: 2.5, py: 1.5, fontWeight: 700 }}
                  >
                    {recordingState === "recording"
                      ? "Kaydı duraklat"
                      : "Kayda devam et"}
                  </Button>
                  <Button
                    size="large"
                    variant="contained"
                    color="secondary"
                    disabled={recordingUploading || recordingStarting}
                    onClick={() => recorderControllerRef.current?.stop()}
                    sx={{ px: 2.5, py: 1.5, fontWeight: 700 }}
                  >
                    Kaydı bitir ve gönder
                  </Button>
                </>
              ) : (
                <Button
                  size="large"
                  variant="contained"
                  color="secondary"
                  disabled={recordingUploading || recordingStarting}
                  onClick={() => recorderControllerRef.current?.toggle()}
                  sx={{ px: 3, py: 1.5, fontWeight: 700 }}
                >
                  {recordingStarting
                    ? "Hazırlanıyor…"
                    : recordingUploading
                      ? "Gönderiliyor…"
                      : "Kaydı başlat"}
                </Button>
              )}
              <Button
                size="large"
                color="error"
                variant="contained"
                disabled={
                  completingMeeting || statusKey === "1" || statusKey === "2"
                }
                onClick={() => {
                  if (
                    window.confirm(
                      "Toplantıyı bitirmek istediğinizden emin misiniz? Bu işlemden sonra odaya tekrar girilemez.",
                    )
                  ) {
                    onCompleteMeeting();
                  }
                }}
                sx={{ fontWeight: 700 }}
              >
                {completingMeeting ? "Bitiriliyor…" : "Toplantıyı bitir"}
              </Button>
            </Stack>
          ) : (
            !isOrganizer && (
              <Button
                size="large"
                color="error"
                variant="contained"
                onClick={onLeave}
                sx={{ fontWeight: 700 }}
              >
                Odadan çık
              </Button>
            )
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
