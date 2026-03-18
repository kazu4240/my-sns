import type { Metadata } from "next";
import BottomNav from "../components/BottomNav";

export const metadata: Metadata = {
  title: "Ulein",
  description: "Ulein SNS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          background: "#15202b",
        }}
      >
        <div style={{ paddingBottom: "94px" }}>{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
