import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
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
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
