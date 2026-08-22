import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Дух приключений — каталог мотомаршрутов",
    template: "%s | Дух приключений",
  },
  description:
    "Каталог маршрутов мотопутешествий. Находите вдохновение для новых поездок и делитесь собственными маршрутами с сообществом.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="app-shell">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}