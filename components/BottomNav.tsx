"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
      <path
        d="M5 20C5.8 16.8 8.5 15 12 15C15.5 15 18.2 16.8 19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M12 4.5C8.96243 4.5 6.5 6.96243 6.5 10V13.2C6.5 14.0912 6.2125 14.9585 5.68 15.673L4.5 17.25H19.5L18.32 15.673C17.7875 14.9585 17.5 14.0912 17.5 13.2V10C17.5 6.96243 15.0376 4.5 12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M9.5 19C10 20.1 10.9 20.75 12 20.75C13.1 20.75 14 20.1 14.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DMIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M4 6.5H20C20.5523 6.5 21 6.94772 21 7.5V17.5C21 18.0523 20.5523 18.5 20 18.5H4C3.44772 18.5 3 18.0523 3 17.5V7.5C3 6.94772 3.44772 6.5 4 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.1 : 0}
      />
      <path
        d="M4 8L12 13.5L20 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems = [
  { href: "/", render: (active: boolean) => <HomeIcon active={active} /> },
  { href: "/search", render: (active: boolean) => <SearchIcon active={active} /> },
  { href: "/profile", render: (active: boolean) => <ProfileIcon active={active} /> },
  { href: "/notifications", render: (active: boolean) => <BellIcon active={active} /> },
  { href: "/dm", render: (active: boolean) => <DMIcon active={active} /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ hidden?: boolean }>;
      setHidden(!!customEvent.detail?.hidden);
    };

    window.addEventListener(
      "bottom-nav-visibility",
      handleVisibility as EventListener
    );

    return () => {
      window.removeEventListener(
        "bottom-nav-visibility",
        handleVisibility as EventListener
      );
    };
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        left: "50%",
        bottom: "12px",
        transform: hidden
          ? "translateX(-50%) translateY(110%)"
          : "translateX(-50%) translateY(0)",
        width: "min(720px, 100%)",
        zIndex: 50,
        background: "rgba(21, 32, 43, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #2f3336",
        transition: "transform 0.22s ease",
        willChange: "transform",
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
                color: isActive ? "#ffffff" : "#8899a6",
                opacity: 1,
                transform: "translateY(-7px)",
              }}
            >
              {item.render(isActive)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
