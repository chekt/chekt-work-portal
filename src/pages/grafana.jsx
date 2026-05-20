import Head from "next/head";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { ColorContext } from "utils/contexts/color";
import { SettingsContext } from "utils/contexts/settings";
import { ThemeContext } from "utils/contexts/theme";

import { getSettings } from "utils/config/config";
import createLogger from "utils/logger";
import themes from "utils/styles/themes";

export async function getStaticProps() {
  let logger;
  try {
    logger = createLogger("grafana");
    const { providers, ...settings } = getSettings();

    return {
      props: {
        initialSettings: settings,
      },
    };
  } catch (e) {
    if (logger && e) logger.error(e);
    return {
      props: {
        initialSettings: {},
      },
    };
  }
}

function Sidebar() {
  const navItems = [
    { name: 'Dashboard', icon: '☰', href: '/dashboard' },
    { name: 'Grafana', icon: '/icons/grafana.png', href: '/grafana' },
  ];

  return (
    <aside className="sidebar">
      {navItems.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          className="nav-item"
        >
          {item.icon ? (
            typeof item.icon === 'string' && item.icon.startsWith('/') ? (
              <div className="nav-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt={item.name} />
              </div>
            ) : (
              <span className="nav-icon-emoji">{item.icon}</span>
            )
          ) : null}
          <span className="nav-name">{item.name}</span>
        </Link>
      ))}
    </aside>
  );
}

export default function GrafanaPage({ initialSettings }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const { setColor } = useContext(ColorContext);
  const { settings, setSettings } = useContext(SettingsContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSettings(initialSettings);
    if (initialSettings.theme) setTheme(initialSettings.theme);
    if (initialSettings.color) setColor(initialSettings.color);
  }, [initialSettings, setSettings, setTheme, setColor]);

  return (
    <>
      <Head>
        <title>Grafana - {initialSettings.title || "CHeKT Portal"}</title>
        <meta name="description" content="Grafana monitoring dashboard" />
        {initialSettings.favicon && <link rel="icon" href={initialSettings.favicon} />}
        <meta name="theme-color" content={themes[settings.color || "blue"][settings.theme || "light"]} />
      </Head>

      <div className="portal-page">
        {/* Header */}
        <header className="portal-header">
          <Link href="/dashboard" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/chekt.png" alt="CHeKT" />
          </Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="theme-toggle"
            >
              {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
          )}
        </header>

        {/* Main Layout with Sidebar */}
        <div className="portal-layout">
          <Sidebar />

          <div className="portal-content">
            <h1>Grafana</h1>
          </div>
        </div>
      </div>
    </>
  );
}
