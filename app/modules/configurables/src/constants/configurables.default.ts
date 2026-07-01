/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  // Base
  background: string;
  foreground: string;
  // Card
  card: string;
  cardForeground: string;
  // Popover
  popover: string;
  popoverForeground: string;
  // Primary
  primary: string;
  primaryForeground: string;
  // Secondary
  secondary: string;
  secondaryForeground: string;
  // Muted
  muted: string;
  mutedForeground: string;
  // Accent
  accent: string;
  accentForeground: string;
  // Destructive
  destructive: string;
  destructiveForeground: string;
  // Border / Input / Ring
  border: string;
  input: string;
  ring: string;
  // Charts
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  // Navbar
  navbarBackground: string;
  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};

export type TFont = {
  headingFont: string;
  textFont: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  font: TFont;
  // Mirror new schema fields here. Example:
  //   maxItemsPerPage?: number;
  //   enableNotifications?: boolean;
  //   featuredCategories?: string[];
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "My App",
  logoUrl: "",
  brandColor: {
    // Base
    background:        "#f4f6f8",
    foreground:        "#0a0f1e",
    // Card
    card:              "#ffffff",
    cardForeground:    "#0a0f1e",
    // Popover
    popover:           "#ffffff",
    popoverForeground: "#0a0f1e",
    // Primary
    primary:           "#0a0f1e",
    primaryForeground: "#ffffff",
    // Secondary
    secondary:           "#f7f8fa",
    secondaryForeground: "#28303c",
    // Muted
    muted:           "#f7f8fa",
    mutedForeground: "#7a8493",
    // Accent
    accent:           "#eaf0ff",
    accentForeground: "#2d5be3",
    // Destructive
    destructive:           "#dc2626",
    destructiveForeground: "#ffffff",
    // Border / Input / Ring
    border: "#e4e8ef",
    input:  "#e4e8ef",
    ring:   "#2d5be3",
    // Charts
    chart1: "#2d5be3",
    chart2: "#16a34a",
    chart3: "#f59e0b",
    chart4: "#b45309",
    chart5: "#dc2626",
    // Navbar
    navbarBackground: "#f4f6f8",
    // Sidebar
    sidebarBackground:        "#f7f8fa",
    sidebarForeground:        "#4b5160",
    sidebarPrimary:           "#2d5be3",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent:            "#ffffff",
    sidebarAccentForeground:  "#0a0f1e",
    sidebarBorder:            "#e4e8ef",
    sidebarRing:              "#2d5be3",
  },
  font: {
    headingFont: "Plus Jakarta Sans",
    textFont: "Inter",
  },
  // ─────────────────────────────────────────────────────────────────────
  // Add new field defaults here. See RULES.md §5 for per-type shape.
  // ─────────────────────────────────────────────────────────────────────
};
