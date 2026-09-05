"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Ignore - user not logged in
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/catalog", label: "Каталог маршрутов" },
    ...(user ? [{ href: "/dashboard", label: "Личный кабинет" }] : []),
  ];

  const authLinks = user
    ? (
      <div className="site-nav__auth" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="site-nav__user" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {user.name}
        </span>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "8px 16px" }}>
          Выйти
        </button>
      </div>
    )
    : (
      <Link href="/auth/login" className="btn btn-primary">
        Войти
      </Link>
    );

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Дух приключений — главная">
          ДУХ <span>ПРИКЛЮЧЕНИЙ</span>
        </Link>

        <button
          className="site-header__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="site-nav"
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          style={{ display: "none" }}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav id="site-nav" className={`site-nav ${mobileMenuOpen ? "site-nav--open" : ""}`} role="navigation" aria-label="Основная навигация">
          <ul className="site-nav__list" style={{ display: "flex", gap: 24, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`site-nav__link ${pathname === link.href ? "site-nav__link--active" : ""}`}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="site-nav__auth" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {authLinks}
          </div>
        </nav>
      </div>

      <style jsx>{`
        .site-header__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .site-header__mobile-toggle {
          background: none;
          border: none;
          color: var(--text);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 8px;
        }
        .site-nav__link {
          color: var(--text-muted);
          font-weight: 500;
          transition: color 0.2s;
          text-decoration: none;
        }
        .site-nav__link:hover {
          color: var(--text);
        }
        .site-nav__link--active {
          color: var(--accent);
        }
        .site-nav__user {
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .site-header__mobile-toggle {
            display: block;
          }
          .site-nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            padding: 16px 20px;
            display: none;
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .site-nav--open {
            display: flex;
          }
          .site-nav__list {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .site-nav__list li {
            width: 100%;
          }
          .site-nav__link {
            display: block;
            padding: 12px 16px;
            border-radius: 8px;
            background: var(--bg-soft);
          }
          .site-nav__auth {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .site-nav__auth .btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
}