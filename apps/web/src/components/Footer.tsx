"use client";

import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Каталог маршрутов", href: "/catalog" },
    { label: "Опубликовать маршрут", href: "/dashboard/new" },
    { label: "Личный кабинет", href: "/dashboard" },
  ],
  legal: [
    { label: "Политика конфиденциальности", href: "/privacy" },
    { label: "Условия использования", href: "/terms" },
  ],
  social: [
    { label: "Telegram", href: "https://t.me/duh_priklyucheniy", external: true },
    { label: "GitHub", href: "https://github.com/duh-priklyucheniy", external: true },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <p style={{ fontWeight: 700, marginBottom: 8 }}>
            ДУХ <span style={{ color: "var(--accent)" }}>ПРИКЛЮЧЕНИЙ</span>
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Сообщество мотопутешественников. Находите лучшие маршруты, делитесь треками
            и вдохновляйтесь историями байкеров.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Навигация по продукту">
          <h4 style={{ marginBottom: 12, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Продукт
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {footerLinks.product.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="site-footer__link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__nav" aria-label="Юридическая информация">
          <h4 style={{ marginBottom: 12, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Юридическое
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {footerLinks.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="site-footer__link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__nav" aria-label="Социальные сети">
          <h4 style={{ marginBottom: 12, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Сообщество
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {footerLinks.social.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="site-footer__link"
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  aria-label={link.label}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
          © {year} «Дух приключений» — сообщество мотопутешествий
        </p>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Сделано с ❤️ для любителей дороги
        </p>
      </div>

      <style jsx>{`
        .site-footer {
          border-top: 1px solid var(--border);
          padding: 48px 0 24px;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .site-footer__grid {
          display: grid;
          grid-template-columns: 2fr repeat(3, 1fr);
          gap: 40px;
          margin-bottom: 32px;
        }
        .site-footer__brand {
          max-width: 280px;
        }
        .site-footer__nav h4 {
          margin-bottom: 12px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
        }
        .site-footer__link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
          font-size: 0.9rem;
        }
        .site-footer__link:hover {
          color: var(--accent);
        }
        .site-footer__bottom {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          font-size: 0.85rem;
        }
        @media (max-width: 900px) {
          .site-footer__grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .site-footer__brand {
            grid-column: span 2;
            max-width: none;
          }
        }
        @media (max-width: 600px) {
          .site-footer__grid {
            grid-template-columns: 1fr;
          }
          .site-footer__brand {
            grid-column: auto;
          }
          .site-footer__bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}