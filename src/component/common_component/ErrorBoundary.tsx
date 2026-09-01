// QA-M5 fix (2026-09-01): the app had no React error boundary anywhere --
// a render-time error in any page component would unmount the whole React
// tree and leave the user staring at a blank white screen with no way
// back short of a manual refresh. React only supports catching render
// errors with a class component (there is no hooks equivalent), so this
// stays a class despite the rest of the codebase being function
// components.
//
// Placement (_app.tsx): wraps only `<Component {...pageProps} />`, not the
// whole app and not the Dashboard shell around it. Dashboard
// (src/component/Dashboard/index.tsx) owns the auth/redirect-to-"/login"
// logic (token checks, `router.push("/login")`) and the sidebar/nav shell
// -- none of that runs inside the page Component this boundary wraps, so
// a crash caught here can't swallow a login redirect, and the nav shell
// stays usable (including its logout button) even when the page content
// underneath has crashed. The bare "/login" page render is also left
// outside the boundary for the same reason: it's the one screen a broken
// boundary must never trap someone behind.
import React from 'react';
import { Box, Typography } from '@mui/material';
import ThemeButton from '@/component/common_component/themebutton';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Matches this codebase's existing error-logging convention (plain
    // console.error at the failure site, e.g. AssignTaskDialog's submit
    // handler and every controller's catch block on the backend) rather
    // than wiring up a new logging service.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
          width="100%"
          textAlign="center"
          px={2}
        >
          <Typography variant="h6" fontWeight={600} mb={1}>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" mb={3}>
            An unexpected error occurred while displaying this page.
          </Typography>
          <ThemeButton onClick={() => window.location.reload()}>Reload page</ThemeButton>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
