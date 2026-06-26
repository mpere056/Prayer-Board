import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prayer Board",
  description: "A gentle way to gather and share prayer requests.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link className="wordmark" href="/">
              Prayer <span>Board</span>
            </Link>
            <nav className="site-nav" aria-label="Primary navigation">
              {user ? (
                <>
                  <span className="signed-in-label">{user.displayName || user.email || "Signed in"}</span>
                  <form action="/api/auth/sign-out" method="post">
                    <button className="button button-secondary" type="submit">Sign out</button>
                  </form>
                </>
              ) : (
                <Link className="button button-secondary" href="/sign-in">
                  Sign in
                </Link>
              )}
            </nav>
          </header>
          {children}
          <footer className="site-footer">
            <Link href="/privacy">Privacy notice</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
