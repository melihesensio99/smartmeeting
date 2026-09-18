import { getApiErrorMessage } from "../../lib/api";
import type { ActionPriority, AddParticipantInput } from "../../types/meeting";
import { useMeetings } from "../calendar/useMeetings";

type MeetingMutations = ReturnType<typeof useMeetings>;

export function useMeetingDetailActions(mutations: MeetingMutations) {
  return {
    onComplete: (meetingId: string, actionItemId: string) =>
      mutations.completeAction.mutate({ meetingId, actionItemId }),
    onCompleteMeeting: (meetingId: string) =>
      mutations.complete.mutate(meetingId),
    onUpdateAction: (
      meetingId: string,
      actionItemId: string,
      input: {
        assigneeUserIds: string[];
        dueAt: string | null;
        priority: ActionPriority;
      },
    ) => mutations.updateAction.mutate({ meetingId, actionItemId, ...input }),
    onCreateAction: (
      meetingId: string,
      input: {
        description: string;
        assigneeUserIds: string[];
        dueAt: string | null;
        priority: ActionPriority;
      },
    ) => mutations.createAction.mutate({ meetingId, input }),
    onSaveNotes: (meetingId: string, notes: string) =>
      mutations.updateNotes.mutate({ meetingId, notes }),
    onRecordingStart: async (meetingId: string) => {
      await mutations.startRecording.mutateAsync(meetingId);
    },
    onAudioReady: (meetingId: string, audio: Blob) =>
      mutations.upload.mutate({ meetingId, audio }),
    onMapSpeaker: (
      meetingId: string,
      participantId: string,
      speakerLabel: string,
    ) =>
      mutations.mapSpeaker.mutate({ meetingId, participantId, speakerLabel }),
    onConfirmSpeaker: (meetingId: string, participantId: string) =>
      mutations.confirmSpeaker.mutate({ meetingId, participantId }),
    onRejectSpeaker: (meetingId: string, participantId: string) =>
      mutations.rejectSpeaker.mutate({ meetingId, participantId }),
    onAddParticipant: (meetingId: string, input: AddParticipantInput) =>
      mutations.addParticipant.mutate({ meetingId, input }),
    onUpdateParticipantPermission: (
      meetingId: string,
      participantId: string,
      canManageMeeting: boolean,
    ) =>
      mutations.updateParticipantPermission.mutate({
        meetingId,
        participantId,
        canManageMeeting,
      }),
    onRemoveParticipant: (meetingId: string, participantId: string) =>
      mutations.removeParticipant.mutate({ meetingId, participantId }),
    onLeaveMeeting: (meetingId: string) =>
      mutations.leaveMeeting.mutate(meetingId),
    onSendEmail: (meetingId: string) => mutations.sendEmail.mutate(meetingId),
    onRetryProcessing: (meetingId: string) =>
      mutations.retryProcessing.mutate(meetingId),
    recordingUploading: mutations.upload.isPending,
    recordingStarting: mutations.startRecording.isPending,
    completingMeeting: mutations.complete.isPending,
    savingNotes: mutations.updateNotes.isPending,
    addingParticipant: mutations.addParticipant.isPending,
    confirmingSpeaker: mutations.confirmSpeaker.isPending,
    rejectingSpeaker: mutations.rejectSpeaker.isPending,
    updatingParticipantPermission:
      mutations.updateParticipantPermission.isPending,
    removingParticipant: mutations.removeParticipant.isPending,
    leavingMeeting: mutations.leaveMeeting.isPending,
    sendingEmail: mutations.sendEmail.isPending,
    updatingAction: mutations.updateAction.isPending,
    creatingAction: mutations.createAction.isPending,
    retryingProcessing: mutations.retryProcessing.isPending,
    emailSent: mutations.sendEmail.isSuccess,
    emailError: mutations.sendEmail.isError
      ? getApiErrorMessage(mutations.sendEmail.error, "E-posta gönderilemedi.")
      : null,
  };
}
