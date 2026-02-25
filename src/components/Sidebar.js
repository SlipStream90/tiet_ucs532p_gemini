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
    <aside className="
  w-80 
  shrink-0 
  border-r 
  border-zinc-800 
  bg-[#0c0c12]
">
      <div className="sticky top-0 h-screen flex flex-col">

        {/* Brand Section */}
        <div className="px-8 py-8 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            AI Kitchen
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            v1.0 Documentation
          </p>
        </div>

        {/* Nav Section */}
        <div className="flex-1 px-6 py-8 overflow-y-auto">

          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-4">
            Documentation
          </p>

          <nav className="space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    block rounded-lg px-4 py-2 text-sm
                    transition-all duration-200
                    ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

        </div>

      </div>
    </aside>
  );
}