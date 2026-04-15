"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/problem", label: "Problem" },
  { href: "/methodology", label: "Methodology" },
  { href: "/architecture", label: "Architecture" },
  { href: "/grocery", label: "Smart Grocery" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-zinc-800/60 px-8 py-16">
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-white">
          AI Kitchen
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Documentation
        </p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm px-3 py-2 rounded-md transition
                ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}