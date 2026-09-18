import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { navigate, type AppRoute } from "../app/navigation";
import { logout } from "../lib/api";
import type { CurrentUser } from "../types/auth";
import type { Meeting } from "../types/meeting";

const drawerWidth = 260;

export function AppShell({
  route,
  currentUser,
  meetings = [],
  children,
}: {
  route: AppRoute;
  currentUser?: CurrentUser;
  meetings?: Meeting[];
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const liveMeetings = meetings.filter(
    (meeting) =>
      String(meeting.status).toLowerCase() !== "completed" &&
      String(meeting.status) !== "6",
  );
  const liveItems =
    liveMeetings.length > 0
      ? liveMeetings.map((meeting) => ({
          label: `Canlı · ${meeting.title}`,
          path: `/meetings/${meeting.id}`,
          route: "meeting-detail" as const,
          icon: "●",
          disabled: false,
        }))
      : [
          {
            label: "Aktif toplantınız yok",
            path: "/meetings?empty-live=1",
            route: "meetings" as const,
            icon: "●",
            disabled: true,
          },
        ];
  const menu: Array<{
    label: string;
    path: string;
    route: AppRoute;
    icon: string;
    disabled?: boolean;
  }> = [
    { label: "Dashboard", path: "/", route: "dashboard" as const, icon: "▦" },
    ...liveItems,
    {
      label: currentUser?.isGlobalManager ? "Tüm Toplantılar" : "Toplantılar",
      path: "/meetings",
      route: "meetings" as const,
      icon: "▣",
    },
    {
      label: currentUser?.isGlobalManager ? "Tüm Aksiyonlar" : "Aksiyonlarım",
      path: "/my-actions",
      route: "actions" as const,
      icon: "☑",
    },
  ];

  const displayName =
    currentUser?.displayName ??
    localStorage.getItem("smartmeeting-user") ??
    "Hesabım";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ flexGrow: 1, minWidth: 0, alignItems: "center" }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: (theme) =>
                  `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`,
                color: "white",
                fontWeight: 900,
                letterSpacing: -1,
              }}
            >
              M
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  textShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                Meeting
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ display: "block", opacity: 0.82 }}
              >
                Akıllı toplantı çalışma alanı
              </Typography>
            </Box>
          </Stack>

          {currentUser?.isGlobalManager && (
            <Typography
              color="secondary"
              sx={{ mr: 3, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              Global Manager
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1}
            sx={{ mr: 3, alignItems: "center" }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              {userInitial}
            </Box>
            <Typography noWrap sx={{ whiteSpace: "nowrap" }}>
              {displayName}
            </Typography>
          </Stack>

          <Button
            color="inherit"
            variant="outlined"
            sx={{
              flexShrink: 0,
              borderRadius: 20,
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.6)",
              },
            }}
            onClick={async () => {
              await logout();
              queryClient.removeQueries({ queryKey: ["current-user"] });
              localStorage.removeItem("smartmeeting-user");
              localStorage.removeItem("smartmeeting-user-id");
              navigate("/login");
            }}
          >
            Çıkış Yap
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            pt: 10,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <List
          sx={{
            flexGrow: 1,
            px: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          {menu.map((item) => {
            const isSelected = route === item.route;
            return (
              <ListItemButton
                key={`${item.route}-${item.path}-${item.label}`}
                selected={isSelected}
                disabled={item.disabled}
                onClick={() => navigate(item.path)}
                sx={{
                  py: 1.2,
                  px: 1.5,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  bgcolor: isSelected
                    ? (theme) => alpha(theme.palette.secondary.main, 0.08)
                    : "transparent",
                  position: "relative",
                  "&::before": isSelected
                    ? {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "10%",
                        bottom: "10%",
                        width: 4,
                        borderRadius: "0 4px 4px 0",
                        background: (theme) =>
                          `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      }
                    : {},
                  "&:hover": {
                    bgcolor: (theme) =>
                      alpha(theme.palette.secondary.main, 0.12),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isSelected
                      ? (theme) => alpha(theme.palette.secondary.main, 0.15)
                      : (theme) => alpha(theme.palette.text.primary, 0.04),
                    color: isSelected ? "secondary.main" : "text.secondary",
                    mr: 2,
                    fontSize: 18,
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.icon}
                </Box>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: 16,
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? "text.primary" : "text.secondary",
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontWeight: 500 }}
          >
            v1.0 · SmartMeeting
          </Typography>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{ ml: `${drawerWidth}px`, pt: 11, px: { xs: 2, md: 4 }, pb: 5 }}
      >
        {children}
      </Box>
    </Box>
  );
}
