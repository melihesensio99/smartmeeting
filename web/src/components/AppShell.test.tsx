import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

vi.mock("../lib/api", () => ({ logout: vi.fn().mockResolvedValue(undefined) }));

function renderAppShell(
  currentUser: Parameters<typeof AppShell>[0]["currentUser"],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppShell route="dashboard" currentUser={currentUser}>
        <div>Dashboard içeriği</div>
      </AppShell>
    </QueryClientProvider>,
  );
}

describe("AppShell", () => {
  it("global manager için tüm toplantı ve aksiyon menülerini gösterir", () => {
    renderAppShell({
      userId: "manager-1",
      email: "manager@example.com",
      displayName: "Ana Yönetici",
      isGlobalManager: true,
      canCreateMeetings: true,
    });

    expect(screen.getByText("Global Manager")).toBeInTheDocument();
    expect(screen.getByText("Tüm Toplantılar")).toBeInTheDocument();
    expect(screen.getByText("Tüm Aksiyonlar")).toBeInTheDocument();
    expect(screen.getByText("Ana Yönetici")).toBeInTheDocument();
  });

  it("normal kullanıcı için kişisel menü adlarını korur", () => {
    renderAppShell({
      userId: "user-1",
      email: "user@example.com",
      displayName: "Standart Kullanıcı",
      isGlobalManager: false,
      canCreateMeetings: false,
    });

    expect(screen.queryByText("Global Manager")).not.toBeInTheDocument();
    expect(screen.getByText("Toplantılar")).toBeInTheDocument();
    expect(screen.getByText("Aksiyonlarım")).toBeInTheDocument();
    expect(screen.queryByText("Tüm Toplantılar")).not.toBeInTheDocument();
  });
});
