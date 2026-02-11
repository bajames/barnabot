"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const subApps = [
  { label: "Crossword", href: "/dashboard/crossword", icon: "⊞" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Barnabot</h1>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{session?.user?.email}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {subApps.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === app.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-base">{app.icon}</span>
            {app.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
