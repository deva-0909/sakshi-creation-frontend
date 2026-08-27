import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { MdArrowBack } from "react-icons/md";

/**
 * A standalone-PWA-mode back affordance. In an installed PWA there's no
 * browser chrome back button, so any detail/view page that only ever
 * pushed forward (no in-page back control) leaves a phone user with no way
 * back except the sidebar drawer or an OS-level swipe gesture -- see
 * claude/ui-ux-professional-polish-plan.md's mobile PWA usability audit.
 *
 * Deliberately a plain `router.back()` rather than a hardcoded destination
 * path: every page this is dropped into is reached from more than one
 * place (a list page, a search result, another record's linked view), so
 * "back" has to mean "wherever you came from."
 */
const BackButton: React.FC<{ sx?: object }> = ({ sx }) => {
  const router = useRouter();
  return (
    <Tooltip title="Back">
      <IconButton
        onClick={() => router.back()}
        aria-label="Go back"
        sx={{ minWidth: 44, minHeight: 44, mb: 1, ...sx }}
      >
        <MdArrowBack size={20} />
      </IconButton>
    </Tooltip>
  );
};

export default BackButton;
