import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        ДУХ <span>ПРИКЛЮЧЕНИЙ</span>
      </Link>
      <nav className="site-nav">
        <Link href="/catalog">Каталог маршрутов</Link>
        <Link href="/dashboard">Личный кабинет</Link>
        <Link href="/auth/login">Войти</Link>
      </nav>
    </header>
  );
}