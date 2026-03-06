import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useContext, useEffect, useMemo, useState } from "react";
import { ColorContext } from "utils/contexts/color";
import { SettingsContext } from "utils/contexts/settings";
import { TabContext } from "utils/contexts/tab";
import { ThemeContext } from "utils/contexts/theme";

import { bookmarksResponse, servicesResponse } from "utils/config/api-response";
import { getSettings } from "utils/config/config";
import createLogger from "utils/logger";
import themes from "utils/styles/themes";

export async function getStaticProps() {
  let logger;
  try {
    logger = createLogger("index");
    const { providers, ...settings } = getSettings();

    const services = await servicesResponse();
    const bookmarks = await bookmarksResponse();

    return {
      props: {
        initialSettings: settings,
        initialServices: services,
        initialBookmarks: bookmarks,
        ...(await serverSideTranslations(settings.language || "en")),
      },
    };
  } catch (e) {
    if (logger && e) logger.error(e);
    return {
      props: {
        initialSettings: {},
        initialServices: [],
        initialBookmarks: [],
        ...(await serverSideTranslations("en")),
      },
    };
  }
}

function SimpleCard({ item, settings }) {
  return (
    <a
      href={item.href}
      target={settings.target || "_blank"}
      rel="noreferrer"
      className="simple-card"
    >
      <div className="card-content">
        {item.icon && (
          <div className="card-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.icon} alt={item.name} />
          </div>
        )}
        <div className="card-text">
          <h3>{item.name}</h3>
          {item.description && <p>{item.description}</p>}
        </div>
      </div>
    </a>
  );
}

function ServiceGroup({ group, layout, settings }) {
  const columns = layout?.columns || 4;

  return (
    <div className="service-group">
      {layout?.header !== false && (
        <h2 className="group-title">{group.name}</h2>
      )}
      <div className={`service-grid cols-${columns}`}>
        {group.services?.map((service, idx) => (
          <SimpleCard key={idx} item={service} settings={settings} />
        ))}

        {group.groups?.map((subgroup, idx) => (
          <div key={idx} className="subgroup">
            <ServiceGroup group={subgroup} layout={layout?.[subgroup.name]} settings={settings} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({ tab, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`tab-button ${isActive ? "active" : ""}`}
    >
      {tab}
    </button>
  );
}

function SimplePage({ initialSettings, initialServices }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const { setColor } = useContext(ColorContext);
  const { settings, setSettings } = useContext(SettingsContext);
  const { activeTab, setActiveTab } = useContext(TabContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSettings(initialSettings);
    if (initialSettings.theme) setTheme(initialSettings.theme);
    if (initialSettings.color) setColor(initialSettings.color);
  }, [initialSettings, setSettings, setTheme, setColor]);

  // Get unique tabs
  const tabs = useMemo(
    () => [
      ...new Set(
        Object.keys(settings.layout || {})
          .map((groupName) => settings.layout[groupName]?.tab?.toString())
          .filter((tab) => tab)
      ),
    ],
    [settings.layout]
  );

  // Set initial active tab
  useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0].toLowerCase());
    }
  }, [tabs, activeTab, setActiveTab]);

  // Filter groups by active tab
  const visibleGroups = initialServices.filter((group) => {
    const groupTab = settings.layout?.[group.name]?.tab;
    if (!groupTab) return !activeTab || tabs.length === 0;
    return groupTab.toLowerCase() === activeTab;
  });

  return (
    <>
      <Head>
        <title>{initialSettings.title || "Homepage"}</title>
        <meta name="description" content={initialSettings.description || "Simple Homepage"} />
        {initialSettings.favicon && <link rel="icon" href={initialSettings.favicon} />}
        <meta name="theme-color" content={themes[settings.color || "blue"][settings.theme || "light"]} />
      </Head>

      <div className="simple-page">
        <div className="page-container">
          {/* Header */}
          <header className="page-header">
            <h1 className="page-title">
              {initialSettings.title || "CHeKT Portal"}
            </h1>
            {initialSettings.description && (
              <p className="page-description">{initialSettings.description}</p>
            )}
          </header>

          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="tabs-container">
              {tabs.map((tab) => (
                <TabButton
                  key={tab}
                  tab={tab}
                  isActive={activeTab === tab.toLowerCase()}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                />
              ))}
            </div>
          )}

          {/* Service Groups */}
          <div className="groups-container">
            {visibleGroups.map((group, idx) => (
              <ServiceGroup
                key={idx}
                group={group}
                layout={settings.layout?.[group.name]}
                settings={settings}
              />
            ))}
          </div>

          {/* Footer */}
          <footer className="page-footer">
            <div className="footer-content">
              <div className="footer-text">Simple Homepage</div>
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="theme-toggle"
                >
                  {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

export default SimplePage;
