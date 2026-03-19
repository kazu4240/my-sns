"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "🏠" },
  { href: "/search", icon: "🔎" },
  { href: "/profile", icon: "👤" },
  { href: "/notifications", icon: "🔔" },
  { href: "/dm", icon: "✉️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        left: "50%",
        bottom: "0",
        transform: "translateX(-50%)",
        width: "min(720px, 100%)",
        zIndex: 50,
        background: "rgba(21, 32, 43, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #2f3336",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          height: "56px",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                fontSize: "24px",
                opacity: isActive ? 1 : 0.72,
                transform: isActive ? "translateY(-1px)" : "none",
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
