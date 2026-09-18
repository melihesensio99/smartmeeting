import type { Meeting } from "../../types/meeting";

export function getMeetingPermissions(
  meeting: Meeting,
  currentUserId: string | null,
  canCompleteMeeting: boolean,
) {
  const isOrganizer =
    currentUserId !== null && currentUserId === meeting.organizerId;
  const isRoomManager =
    canCompleteMeeting ||
    isOrganizer ||
    meeting.participants.some(
      (participant) =>
        participant.userId === currentUserId && participant.canManageMeeting,
    );

  return {
    isOrganizer,
    isRoomManager,
    isCompleted:
      String(meeting.status) === "6" || meeting.status === "Completed",
  };
}
