import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saturday.solutions",
  description: "Transform your syllabus PDFs into Google Calendar events. Schedule smarter with Saturday.solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Canela+Text:wght@250;300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
