import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useMeetingStatus(meetingIds: string[], enabled: boolean) {
  const queryClient = useQueryClient();
  const meetingKey = meetingIds.join("|");
  useEffect(() => {
    if (!enabled) return undefined;
    const subscribedMeetingIds = meetingKey ? meetingKey.split("|") : [];
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5080/api";
    const hubUrl = `${apiUrl.replace(/\/api\/?$/, "")}/hubs/meeting-status`;
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();
    connection.on("meetingStatusChanged", () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    });
    void connection
      .start()
      .then(async () => {
        await Promise.all(
          subscribedMeetingIds.map((meetingId) =>
            connection.invoke("JoinMeeting", meetingId),
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      connection.off("meetingStatusChanged");
      void connection.stop();
    };
  }, [enabled, queryClient, meetingKey]);
}
