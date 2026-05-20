import Head from "next/head";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { ColorContext } from "utils/contexts/color";
import { SettingsContext } from "utils/contexts/settings";
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
      },
    };
  } catch (e) {
    if (logger && e) logger.error(e);
    return {
      props: {
        initialSettings: {},
        initialServices: [],
        initialBookmarks: [],
      },
    };
  }
}

function EnvironmentButton({ env, href, settings }) {
  return (
    <a
      href={href}
      target={settings.target || "_blank"}
      rel="noreferrer"
      className="env-button"
    >
      {env}
    </a>
  );
}

function ServiceRow({ service, settings }) {
  const serviceName = service.name;
  const environments = service.services;

  return (
    <div className="service-row">
      <div className="service-name">
        {service.icon && (
          <div className="service-icon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={service.icon} alt={serviceName} />
          </div>
        )}
        <span>{serviceName}</span>
      </div>
      <div className="service-environments">
        {environments?.map((env, idx) => (
          <EnvironmentButton
            key={idx}
            env={env.name}
            href={env.href}
            settings={settings}
          />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool, settings }) {
  return (
    <a
      href={tool.href}
      target={settings.target || "_blank"}
      rel="noreferrer"
      className="tool-card"
      title={tool.description}
    >
      {tool.icon && (
        <div className="tool-icon">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tool.icon} alt={tool.name} />
        </div>
      )}
      <div className="tool-name">{tool.name}</div>
    </a>
  );
}

function WorkServicesSection({ groups, settings }) {
  // Chekt Work 섹션: 환경별 서비스들
  const workServiceNames = ['Dealer Portal', 'Monitoring Portal', 'End User Web', 'Console', 'Account'];
  const workGroups = groups.filter(g => workServiceNames.includes(g.name));

  // Tools(By Env) 섹션에서 Kibana, Grafana, GitOps 가져오기
  const toolsByEnvGroup = groups.find(g => g.name === 'Tools(By Env)');
  const envTools = toolsByEnvGroup?.groups || [];

  return (
    <div className="work-services-section">
      <h2 className="section-title">Chekt Work</h2>
      <div className="services-list">
        {workGroups.map((group, idx) => {
          // group.services 배열이 환경들 (Dev, QE, S1, Prod)
          return (
            <ServiceRow
              key={idx}
              service={{
                name: group.name,
                services: group.services,
                icon: group.icon
              }}
              settings={settings}
            />
          );
        })}
        {envTools.map((tool, idx) => (
          <ServiceRow
            key={`env-${idx}`}
            service={{
              name: tool.name,
              services: tool.services,
              icon: tool.services?.[0]?.icon || tool.icon
            }}
            settings={settings}
          />
        ))}
      </div>
    </div>
  );
}

function ToolsSection({ groups, settings }) {
  // Tools 섹션: 일반 툴들
  const toolsGroup = groups.find(g => g.name === 'Tools');
  const tools = toolsGroup?.services || [];

  return (
    <div className="tools-section">
      <h2 className="section-title">Tools</h2>
      <div className="tools-grid">
        {tools.map((tool, idx) => (
          <ToolCard key={idx} tool={tool} settings={settings} />
        ))}
      </div>
    </div>
  );
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

function SimplePage({ initialSettings, initialServices }) {
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
        <title>{initialSettings.title || "Homepage"}</title>
        <meta name="description" content={initialSettings.description || "Simple Homepage"} />
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
            <div className="content-layout">
              <WorkServicesSection groups={initialServices} settings={settings} />
              <ToolsSection groups={initialServices} settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SimplePage;
