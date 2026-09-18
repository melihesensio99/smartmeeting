import { createTheme, alpha } from "@mui/material/styles";

// Modern Dark / Slate-Navy Palette
const primaryMain = "#6366F1"; // Vibrant Indigo
const primaryDark = "#4F46E5";
const primaryLight = "#818CF8";
const secondaryMain = "#F43F5E"; // Rose / Coral Accent
const bgDefault = "#0B0F19"; // Deep Slate Navy Dark Background
const bgPaper = "#111827"; // Card & Surface Background
const textPrimary = "#F9FAFB";
const textSecondary = "#9CA3AF";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: primaryMain,
      dark: primaryDark,
      light: primaryLight,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: secondaryMain,
      dark: "#E11D48",
      light: "#FB7185",
      contrastText: "#FFFFFF",
    },
    info: { main: "#38BDF8" },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    background: { default: bgDefault, paper: bgPaper },
    text: { primary: textPrimary, secondary: textSecondary },
    divider: alpha("#E5E7EB", 0.08),
  },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h3: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 },
    h4: { fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h5: { fontWeight: 750, letterSpacing: "-0.01em", lineHeight: 1.3 },
    h6: { fontWeight: 700, lineHeight: 1.35 },
    subtitle1: { fontWeight: 600, letterSpacing: "0.01em" },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.8125rem",
      letterSpacing: "0.02em",
      textTransform: "uppercase" as const,
    },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    caption: { lineHeight: 1.5, letterSpacing: "0.01em" },
    overline: { fontWeight: 700, letterSpacing: "0.08em", lineHeight: 2 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": { boxSizing: "border-box" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(115deg, #090D16 0%, #0F172A 50%, #1E1B4B 100%)`,
          boxShadow: `0 4px 24px rgba(0, 0, 0, 0.45)`,
          borderBottom: `1px solid ${alpha("#FFFFFF", 0.06)}`,
          backdropFilter: "blur(16px)",
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" as const },
      styleOverrides: {
        root: {
          backgroundColor: bgPaper,
          borderColor: alpha("#FFFFFF", 0.08),
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.25)`,
          transition:
            "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
          "&:hover": {
            borderColor: alpha(primaryLight, 0.3),
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none" as const,
          fontWeight: 700,
          letterSpacing: "0.01em",
          transition: "all 0.2s ease",
          position: "relative" as const,
          overflow: "hidden" as const,
        },
        contained: {
          boxShadow: `0 2px 10px ${alpha(primaryMain, 0.35)}`,
          "&:hover": {
            boxShadow: `0 4px 18px ${alpha(primaryMain, 0.55)}`,
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        outlined: {
          borderWidth: "1.5px",
          borderColor: alpha("#FFFFFF", 0.16),
          "&:hover": {
            borderWidth: "1.5px",
            borderColor: primaryLight,
            backgroundColor: alpha(primaryMain, 0.1),
          },
        },
        sizeLarge: {
          padding: "12px 28px",
          fontSize: "1rem",
        },
        sizeMedium: {
          padding: "8px 20px",
        },
        sizeSmall: {
          padding: "5px 14px",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined" as const,
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: alpha("#FFFFFF", 0.03),
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha("#FFFFFF", 0.12),
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: alpha(primaryLight, 0.5),
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${alpha(primaryMain, 0.25)}`,
              backgroundColor: alpha("#FFFFFF", 0.05),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: primaryMain,
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backgroundColor: "#131B2E",
          border: `1px solid ${alpha("#FFFFFF", 0.1)}`,
          boxShadow: `0 24px 64px rgba(0, 0, 0, 0.65)`,
        },
        root: {
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(5, 8, 16, 0.75)",
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          fontSize: "1.25rem",
          paddingBottom: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
          borderRadius: 10,
          transition: "all 0.2s ease",
        },
        sizeSmall: {
          fontSize: "0.75rem",
          height: 26,
        },
        outlined: {
          borderWidth: "1.5px",
          borderColor: alpha("#FFFFFF", 0.16),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(180deg, #0D131F 0%, #0B0F19 100%)`,
          borderRight: `1px solid ${alpha("#FFFFFF", 0.06)}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "0 12px 12px 0",
          marginRight: 12,
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: alpha("#FFFFFF", 0.04),
          },
          "&.Mui-selected": {
            backgroundColor: alpha(primaryMain, 0.15),
            "&:hover": {
              backgroundColor: alpha(primaryMain, 0.22),
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha("#FFFFFF", 0.08),
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: alpha("#FFFFFF", 0.08),
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha("#FFFFFF", 0.08),
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: primaryMain,
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: primaryMain,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: alpha("#FFFFFF", 0.4),
          "&.Mui-checked": {
            color: "#10B981",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: "#1E293B",
          color: "#F8FAFC",
          border: `1px solid ${alpha("#FFFFFF", 0.1)}`,
          boxShadow: `0 6px 16px rgba(0, 0, 0, 0.4)`,
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: "background-color 0.2s ease",
        },
      },
    },
  },
});
