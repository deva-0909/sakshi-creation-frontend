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

// Order To Factory page (Build 4, Godown Manager role, 2026-08-27): the
// Figma frame for this screen shows a three-value status chip vocabulary --
// Hold / In-Progress / Order -- distinct from both the model above (task
// sub-status) and QP_STATUS_LABELS (all-orders/index.tsx's fuller stage
// labels for the same orders.status column). A sibling to
// displayTaskStatus rather than a shared function since it reads a
// different source field (orders.status, not a task/staff sub-status) and
// buckets a different, smaller set of values.
//
// Mapping confirmed against the Figma frame's two unambiguous cases --
// "Hold" and "Received" (a freshly placed order, not yet worked) map
// directly to "Hold" and "Order". Every other pipeline stage (Printer,
// Binder, Booklet Binder, Factory, Godown) is plainly "In-Progress". The
// one open question is the terminal "Completed" state, which the Figma
// frame's three values don't have a slot for -- bucketed into
// "In-Progress" here as the closest of the three confirmed values (an
// order that reached Completed did, in fact, get all the way through
// production), not asserted as the one true reading of a state Figma never
// showed.
const ORDER_TO_FACTORY_STATUS_DISPLAY: Record<string, "Hold" | "Order"> = {
  Hold: "Hold",
  Received: "Order",
};

export const displayOrderToFactoryStatus = (
  status?: string | null
): "Hold" | "Order" | "In-Progress" =>
  (status && ORDER_TO_FACTORY_STATUS_DISPLAY[status]) || "In-Progress";
