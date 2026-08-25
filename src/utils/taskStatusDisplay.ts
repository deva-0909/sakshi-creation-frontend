// Full Figma slide scan Phase 2 (claude/full-figma-slide-scan.md, Theme 4):
// the Designer/Printer/Binder/Booklet Binder task lists use a Pending -> In
// Progress -> Done(/Rework) status model, but the Figma design consistently
// labels the same progression Seen -> Working -> Done. The user's decision
// was a display-only relabel: the stored values (Pending/In Progress/Done/
// Rework -- read/compared everywhere from permissions to job-card mirroring
// to the stepper) are untouched; only what these four task-list pages show
// to a human changes.
//
// Deliberately scoped to just these four task-list pages, not app-wide --
// every other place these same status strings appear (All Orders' status
// column, the stepper, the task detail pages' button/section logic) reads
// them for logic, not as a label a human reads as a status word, or shows
// a different status field entirely (orders.status, not designerStatus/
// printerStatus/binderStatus/bookletBinderStatus).
export const TASK_STATUS_DISPLAY: Record<string, string> = {
  Pending: "Seen",
  "In Progress": "Working",
  Done: "Done",
  // Rework has no Figma-shown equivalent in this three-state model --
  // left as-is rather than force-fit into one of the three buckets.
  Rework: "Rework",
};

export const displayTaskStatus = (status?: string | null): string =>
  (status && TASK_STATUS_DISPLAY[status]) || status || "N/A";
