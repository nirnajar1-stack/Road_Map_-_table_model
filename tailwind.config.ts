import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lambo: {
          gold: "#FFC000",
          "gold-dark": "#917300",
          "gold-text": "#FFCE3E",
          black: "#000000",
          charcoal: "#202020",
          iron: "#181818",
          smoke: "#F5F5F5",
          ash: "#7D7D7D",
          steel: "#969696",
          slate: "#666666",
          ironText: "#555555",
          shadow: "#313131",
          graphite: "#494949",
          cyan: "#29ABE2",
          "link-blue": "#3860BE",
          teal: "#1EAEDB",
        },
        theme: {
          page: "var(--page-bg)",
          surface: "var(--surface)",
          raised: "var(--surface-raised)",
          border: "var(--border)",
          text: "var(--text)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        road: {
          asphalt: "var(--road-asphalt)",
          edge: "var(--road-edge)",
          grass: "var(--road-grass)",
          "grass-dark": "var(--road-grass-dark)",
          dash: "var(--road-dash)",
        },
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      letterSpacing: {
        micro: "0.225px",
        label: "0.96px",
        caption: "-0.42px",
        button: "0.2px",
      },
      maxWidth: {
        container: "1440px",
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
