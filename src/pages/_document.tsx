import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* No page in this app previously set a viewport meta tag at all --
            harmless on desktop, but it meant mobile browsers rendered the
            page at desktop width and let the user pinch-zoom out, which
            also breaks how a PWA installs/launches full-screen on a phone. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/*
          Loaded as a plain stylesheet link (rather than next/font, which
          next/font/google does not support inside _document.tsx) so the
          font also reaches MUI's portal-rendered content -- Dialog, Menu,
          Select, Snackbar all mount outside the React tree via a portal,
          and a next/font CSS-variable-on-<html> approach would only apply
          to elements actually nested under it.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* PWA: manifest + icons + theme color, so the app is installable
            (Add to Home Screen / desktop install) and gets a proper icon,
            splash background, and browser-chrome tint instead of the
            generic Next.js defaults. Service worker registration itself is
            handled by @ducanh2912/next-pwa (see next.config.ts), which
            injects its own registration script automatically. */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7F56D9" />
        <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icons/favicon-16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sakshi Creation" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
