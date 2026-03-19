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
        bottom: "12px",
        transform: "translateX(-50%)",
        width: "min(720px, calc(100vw - 24px))",
        zIndex: 50,
        background: "rgba(21, 32, 43, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid #2f3336",
        borderRadius: "18px",
        padding: "8px 10px calc(8px + env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
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
                height: "48px",
                borderRadius: "12px",
                fontSize: "23px",
                opacity: isActive ? 1 : 0.78,
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
