"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}>
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14.5H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20C5.8 16.9 8.47 15 12 15C15.53 15 18.2 16.9 19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 17H18L16.8 15.4C16.3 14.73 16 13.92 16 13.08V10.5C16 8.01 14.21 5.92 11.85 5.46V5C11.85 4.36 11.34 3.85 10.7 3.85H13.3C12.66 3.85 12.15 4.36 12.15 5V5.46C9.79 5.92 8 8.01 8 10.5V13.08C8 13.92 7.7 14.73 7.2 15.4L6 17Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 19C10.4 19.61 11.11 20 12 20C12.89 20 13.6 19.61 14 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 7L12 12.5L19.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", icon: HomeIcon },
    { href: "/search", icon: SearchIcon },
    { href: "/profile", icon: ProfileIcon },
    { href: "/notifications", icon: BellIcon },
    { href: "/messages", icon: MessageIcon },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        left: "50%",
        bottom: "10px",
        transform: "translateX(-50%)",
        width: "calc(100% - 18px)",
        maxWidth: "700px",
        zIndex: 999,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          minHeight: "64px",
          pointerEvents: "auto",
        }}
      >
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "64px",
                textDecoration: "none",
                color: active ? "#ffffff" : "#8899a6",
                background: "transparent",
              }}
            >
              <Icon active={active} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
