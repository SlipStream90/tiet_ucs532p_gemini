"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "DEMO",
    links: [
      { href: "/dashboard",    label: "Live Dashboard",       icon: "⬡" },
      { href: "/live-grocery", label: "Live Grocery Tracker", icon: "🥦" },
      { href: "/grocery",      label: "Grocery Classifier",   icon: "🔬" },
    ],
  },
  {
    label: "DOCUMENTATION",
    links: [
      { href: "/",            label: "Overview",      icon: "◈" },
      { href: "/problem",     label: "Problem",       icon: "◉" },
      { href: "/methodology", label: "Methodology",   icon: "◎" },
      { href: "/architecture",label: "Architecture",  icon: "◫" },
      { href: "/grocery-doc", label: "Smart Grocery", icon: "◌" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "240px", flexShrink: 0,
      borderRight: "1px solid var(--border)",
      padding: "28px 16px",
      background: "rgba(7,7,13,0.6)",
      position: "sticky", top: "60px",
      height: "calc(100vh - 60px)",
      overflowY: "auto",
    }}>
      {sections.map(section => (
        <div key={section.label} style={{ marginBottom: "28px" }}>
          <div style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-muted)", marginBottom: "8px", paddingLeft: "10px",
          }}>
            {section.label}
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {section.links.map(link => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "7px 10px", borderRadius: "8px",
                  fontSize: "0.84rem", fontWeight: active ? 600 : 400,
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  background: active ? "rgba(99,102,241,0.12)" : "transparent",
                  border: active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                  transition: "all 0.15s",
                  textDecoration: "none",
                }}>
                  <span style={{
                    fontSize: "0.7rem",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                  }}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: "auto", paddingTop: "20px",
        borderTop: "1px solid var(--border)",
        fontSize: "0.7rem", color: "var(--text-muted)", paddingLeft: "10px",
        lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 600, marginBottom: "4px", color: "var(--text-secondary)" }}>AI Kitchen v1.0</div>
        <div>UCS532P Project</div>
        <div>HOG + SVM + RF + LR</div>
      </div>
    </aside>
  );
}