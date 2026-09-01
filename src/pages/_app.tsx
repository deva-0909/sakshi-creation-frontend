import { persistor, store } from "@/store";
import "@/styles/globals.css";
import theme from "@/theme";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from "next/router";
import Dashboard from "@/component/Dashboard";
import ErrorBoundary from "@/component/common_component/ErrorBoundary";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
{/* QA-M5 fix (2026-09-01): ErrorBoundary wraps only the page Component,
    not the whole app and not Dashboard. Dashboard owns the auth/
    redirect-to-"/login" logic and the sidebar/nav shell, so a page-content
    crash caught here can't swallow a login redirect, and the nav shell
    (including logout) stays usable underneath a crashed page. "/login"
    itself is left outside the boundary too -- it's the one screen a
    broken boundary must never trap someone behind. */}
{router.pathname === "/login" ? <Component {...pageProps} />:<Dashboard>
  <ErrorBoundary>
    <Component {...pageProps} />
  </ErrorBoundary>
</Dashboard>}
          {/* <Component {...pageProps} />; */}
          <ToastContainer/>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )

}
