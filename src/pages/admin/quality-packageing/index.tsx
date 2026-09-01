import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TableCell,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllJobCardsThunk } from "@/store/slices/jobCardSlice";
import { getAllComplaintsThunk } from "@/store/slices/complaintSlice";
import { getAllOrdersThunk } from "@/store/slices/orderSlice";
// Build 5 (Quality Manager Dashboard):
// - Cartoon/box inventory (sub-item 2) reads from the Godown box/cartoon
//   receiving manifest that already exists (Phase 8, full-figma-slide-
//   scan.md) for the "ready in Store" side, and from job cards already at
//   the Factory stage for the "ready in Factory" side -- no new table.
// - Low-stock alert (sub-item 3) reads the stock summary endpoint, which
//   already computes a per-material balance and now also returns each
//   material's existing reorderLevel plus a computed belowReorder flag.
import { getAllGodownBoxReceiptsThunk } from "@/store/slices/godownBoxReceiptSlice";
import { getStockSummaryThunk } from "@/store/slices/stockLedgerSlice";

// Two-company Phase 3 Part B (claude/two-company-gap-analysis.md): the real
// Quality Manager Dashboard, replacing this page's previous entirely-mock
// content (hardcoded rows, no Redux, no API calls -- confirmed during Phase
// 3 Part A's scoping). Deliberately built with NO new backend endpoint or
// table: it's a read-only rollup of data that already exists (job cards,
// complaints, orders), scoped to whichever company is active in the global
// CompanyToggle, the same way every other company-scoped screen works.
// getAllJobCards/getAllComplaints are called unpaginated (no page/limit) so
// their full matching set comes back in one call and stage/priority counts
// can be computed client-side -- fine at this app's data volume, and it
// avoids inventing a dedicated stats endpoint for numbers this cheap to
// derive from data already being fetched for the tables below.
// Patch 112: "Production" added -- QP job cards now carry this single
// internal stage instead of cycling through Printer/Binder/Booklet Binder/
// Factory/Godown (see jobCard.controller.js's stage-simplification
// comment). The old stage names stay mapped here only for any historical
// rows created before this patch.
const STAGE_COLORS: Record<string, "default" | "info" | "warning" | "success"> = {
  Printer: "info",
  Binder: "info",
  "Booklet Binder": "info",
  Factory: "warning",
  Godown: "success",
  Done: "success",
  Production: "info",
};

const COMPLAINT_STATUS_COLORS: Record<string, "default" | "warning" | "info" | "success"> = {
  Open: "warning",
  "In Progress": "info",
  Resolved: "success",
  Closed: "default",
};

const jobCardColumns = [
  { id: "id", label: "#" },
  { id: "jobCardNumber", label: "Job Card No." },
  { id: "orderNumber", label: "Order No." },
  { id: "item", label: "Item" },
  { id: "stage", label: "Stage" },
  { id: "status", label: "Status" },
  { id: "assignedTo", label: "Assigned To" },
];

const complaintColumns = [
  { id: "id", label: "#" },
  { id: "complaintNumber", label: "Complaint No." },
  { id: "subject", label: "Subject" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
];

function KpiCard({
  label,
  value,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  accent: string;
  // Build 5 (Quality Manager Dashboard, sub-item 1 -- KPI drill-down):
  // optional so every pre-existing card (no drill-down target) is
  // unaffected; only "Jobs Completed Today" and "Jobs Hold" pass one.
  onClick?: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        "&:hover": onClick ? { boxShadow: 2 } : undefined,
      }}
      onClick={onClick}
    >
      <Typography fontSize={13} color="text.secondary" mb={0.5}>
        {label}
      </Typography>
      <Typography fontSize={28} fontWeight={700} sx={{ color: accent }}>
        {value}
      </Typography>
    </Paper>
  );
}

const QualityManagerDashboard = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const { jobCards } = useAppSelector((state) => state.jobCards);
  const { complaints } = useAppSelector((state) => state.complaints);
  const { orders } = useAppSelector((state) => state.orders);
  const { receipts: boxReceipts } = useAppSelector((state) => state.godownBoxReceipts);
  const { summary: stockSummary } = useAppSelector((state) => state.stockLedger);
  const [ordersTotalCount, setOrdersTotalCount] = useState<number | null>(null);
  // Build 5 (Quality Manager Dashboard, sub-item 1): "Hold" total comes
  // from the same lightweight pagination.totalCount trick already used
  // for ordersTotalCount above (limit: 1, read only the count). "Completed
  // today" needs the actual rows (to check each one's date), so it's
  // fetched unpaginated like jobCards/complaints already are elsewhere on
  // this page -- fine at this app's data volume, same reasoning as the
  // file-level comment above.
  const [holdOrdersCount, setHoldOrdersCount] = useState<number | null>(null);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);

  useEffect(() => {
    const companyName = activeCompanyId || undefined;
    dispatch(getAllJobCardsThunk({ companyName }));
    dispatch(getAllComplaintsThunk({ companyName }));
    // limit: 10 both for the "recent orders" table and to get an exact
    // pagination.totalCount for the "Active Orders" KPI without pulling
    // every order row down to the client.
    dispatch(getAllOrdersThunk({ companyName, limit: 10 }))
      .unwrap()
      .then((res: any) => setOrdersTotalCount(res?.pagination?.totalCount ?? null))
      .catch(() => setOrdersTotalCount(null));
    dispatch(getAllOrdersThunk({ companyName, status: "Hold", limit: 1 }))
      .unwrap()
      .then((res: any) => setHoldOrdersCount(res?.pagination?.totalCount ?? null))
      .catch(() => setHoldOrdersCount(null));
    dispatch(getAllOrdersThunk({ companyName, status: "Completed", limit: 200 }))
      .unwrap()
      .then((res: any) => setCompletedOrders(res?.data || []))
      .catch(() => setCompletedOrders([]));
    dispatch(getAllGodownBoxReceiptsThunk({ companyName }));
    dispatch(getStockSummaryThunk({ companyName }));
  }, [dispatch, activeCompanyId]);

  const inProduction = jobCards.filter((jc: any) => jc.status !== "Completed" && jc.status !== "Cancelled").length;
  const atFactory = jobCards.filter((jc: any) => jc.currentStage === "Factory").length;
  const atGodown = jobCards.filter((jc: any) => jc.currentStage === "Godown").length;
  const openComplaints = complaints.filter((c: any) => c.status === "Open" || c.status === "In Progress").length;

  // Build 5, sub-item 1: "today" = local calendar day, matching the
  // `?today=1` handling added to all-orders/index.tsx.
  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const completedTodayCount = completedOrders.filter((o: any) => isToday(o.updatedAt)).length;

  // Build 5, sub-item 2 -- cartoon/box inventory by size, Factory vs Store.
  // Store side: net (inward - outward) from the existing Godown box/
  // cartoon receiving manifest, grouped by size. Factory side: job cards
  // currently sitting at the Factory stage (finished, not yet moved to
  // Godown), grouped by their order's box size -- both are real existing
  // data, no new table.
  const cartonInventory = useMemo(() => {
    const bySize: Record<string, { factory: number; store: number }> = {};
    for (const jc of jobCards as any[]) {
      if (jc.currentStage !== "Factory") continue;
      const size = jc.order?.size || "Unspecified";
      bySize[size] = bySize[size] || { factory: 0, store: 0 };
      bySize[size].factory += Number(jc.qty) || 0;
    }
    for (const r of boxReceipts as any[]) {
      const size = r.size || "Unspecified";
      bySize[size] = bySize[size] || { factory: 0, store: 0 };
      const qty = Number(r.qty) || 0;
      bySize[size].store += r.type === "outward" ? -qty : qty;
    }
    return Object.entries(bySize)
      .map(([size, v]) => ({ size, factory: v.factory, store: v.store }))
      .sort((a, b) => a.size.localeCompare(b.size));
  }, [jobCards, boxReceipts]);

  // Build 5, sub-item 3 -- low-stock alert. Materials with no reorderLevel
  // set are never flagged (belowReorder is only true when one is set and
  // the current balance is under it) -- see stockLedger.controller.js.
  const lowStockMaterials = (stockSummary as any[]).filter((s: any) => s.belowReorder);

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Quality Packaging
        </Typography>
        <Typography fontSize={14} color="text.secondary">
          Live production, order, and complaint status for the active company -- switch companies with the toggle above.
        </Typography>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Active Orders" value={ordersTotalCount ?? 0} accent="#7F56D9" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Job Cards In Production" value={inProduction} accent="#1976d2" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="At Factory" value={atFactory} accent="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="At Godown" value={atGodown} accent="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Open Complaints" value={openComplaints} accent="#d32f2f" />
        </Grid>
        {/* Build 5, sub-item 1: clickable, drill down into all-orders
            pre-filtered. Duration (start date vs. end date) shows there as
            a computed column, not here -- these are just counts. */}
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard
            label="Jobs Completed Today"
            value={completedTodayCount}
            accent="#0891b2"
            onClick={() => router.push("/admin/all-orders?status=Completed&today=1")}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard
            label="Jobs Hold"
            value={holdOrdersCount ?? 0}
            accent="#DC2626"
            onClick={() => router.push("/admin/all-orders?status=Hold")}
          />
        </Grid>
      </Grid>

      {/* Build 5, sub-item 3 -- low-stock alert banner. Only rendered when
          at least one material is below its own set reorder level; a
          material with no threshold set never appears here. */}
      {lowStockMaterials.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, mb: 3, borderColor: "#FCA5A5", bgcolor: "#FEF2F2" }}
        >
          <Typography fontWeight={600} color="#B42318" mb={1}>
            Low Stock Alert
          </Typography>
          <Stack spacing={0.5}>
            {lowStockMaterials.map((s: any) => (
              <Typography key={s.material._id} fontSize={13} color="#7A271A">
                {s.material.materialName}
                {s.material.materialSize ? ` (${s.material.materialSize})` : ""}: {s.balance}
                {" "}
                on hand -- below reorder level of {s.material.reorderLevel}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Build 5, sub-item 2 -- cartoon (box) inventory by size, Factory
          vs Store. Read-only aggregation of existing data: Factory column
          is job cards currently at the Factory stage (finished, not yet
          moved to Godown); Store column is the net inward-outward balance
          from the existing Godown box/cartoon receiving manifest. */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography fontWeight={600} mb={1}>
          Cartoon Inventory (Ready Boxes)
        </Typography>
        {cartonInventory.length === 0 ? (
          <Typography fontSize={13} color="text.secondary">
            No box/cartoon inventory recorded yet.
          </Typography>
        ) : (
          <BasicTable
            showFillter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={[
              { id: "size", label: "Size" },
              { id: "factory", label: "Ready in Factory" },
              { id: "store", label: "Ready in Store (Godown)" },
            ]}
            rowData={cartonInventory.map((row, idx) => ({ ...row, id: idx }))}
            renderRow={(row: any) => (
              <>
                <TableCell>{row.size}</TableCell>
                <TableCell>{row.factory}</TableCell>
                <TableCell>{row.store}</TableCell>
              </>
            )}
          />
        )}
      </Paper>

      <Stack spacing={3}>
        <Box>
          <Typography fontWeight={600} mb={1}>
            Job Cards
          </Typography>
          <BasicTable
            showFillter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={jobCardColumns}
            rowData={jobCards.map((jc: any) => ({ ...jc, id: jc._id }))}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell
                  sx={{ cursor: "pointer", color: "#7F56D9", fontWeight: 600 }}
                  onClick={() => router.push(`/admin/job-card/view/${row._id}`)}
                >
                  {row.jobCardNumber}
                </TableCell>
                <TableCell>{row.order?.orderNumber || "-"}</TableCell>
                <TableCell>{row.productItem?.itemName || "-"}</TableCell>
                <TableCell>
                  <Chip size="small" label={row.currentStage} color={STAGE_COLORS[row.currentStage] || "default"} />
                </TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : "-"}</TableCell>
              </>
            )}
          />
        </Box>

        <Box>
          <Typography fontWeight={600} mb={1}>
            Order In
          </Typography>
          <Typography fontSize={13} color="text.secondary" mb={1}>
            Expand a row for its Factory production-tracking panel (Unit, Start Date,
            Pasting, Pining, RS For, Kantan, Kantan Deckal, Finish Date) -- read-only
            here; edit it from the full Job Card page.
          </Typography>
          {orders.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography fontSize={13} color="text.secondary">
                No orders yet.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {orders.map((o: any) => (
                <Accordion key={o._id} disableGutters variant="outlined" sx={{ borderRadius: 2, "&:before": { display: "none" } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Grid container spacing={2} alignItems="center" sx={{ width: "100%" }}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography
                          fontWeight={600}
                          sx={{ color: "#7F56D9", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/all-orders/view?id=${o._id}`);
                          }}
                        >
                          {o.orderNumber}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography fontSize={13}>{o.party?.partyName || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography fontSize={13}>{o.productItem?.itemName || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Chip size="small" label={o.status} />
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails>
                    {o.productionPanel ? (
                      <>
                        <Grid container spacing={2}>
                          {[
                            ["Unit", o.productionPanel.unit ?? "-"],
                            ["Start Date", o.productionPanel.startDate ? new Date(o.productionPanel.startDate).toLocaleDateString() : "-"],
                            ["Pasting", o.productionPanel.pasting ?? "-"],
                            ["Pining", o.productionPanel.pining ?? "-"],
                            ["RS For", o.productionPanel.rsFor ?? "-"],
                            ["Kantan", o.productionPanel.kantan ?? "-"],
                            ["Kantan Deckal", o.productionPanel.kantanDeckal ?? "-"],
                            ["Finish Date", o.productionPanel.finishDate ? new Date(o.productionPanel.finishDate).toLocaleDateString() : "-"],
                          ].map(([label, value]) => (
                            <Grid size={{ xs: 6, sm: 3 }} key={label as string}>
                              <Typography fontSize={12} color="text.secondary">
                                {label}
                              </Typography>
                              <Typography fontSize={14}>{value as React.ReactNode}</Typography>
                            </Grid>
                          ))}
                        </Grid>
                        <Box mt={2}>
                          <Typography
                            fontSize={13}
                            fontWeight={600}
                            sx={{ color: "#7F56D9", cursor: "pointer", display: "inline-block" }}
                            onClick={() => router.push(`/admin/job-card/view/${o.productionPanel.jobCardId}`)}
                          >
                            View / Edit Job Card →
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Typography fontSize={13} color="text.secondary">
                        No job card has been created for this order yet -- no production-tracking data to show.
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <Typography fontWeight={600} mb={1}>
            Open Complaints
          </Typography>
          <BasicTable
            showFillter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={complaintColumns}
            rowData={complaints.map((c: any) => ({ ...c, id: c._id }))}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell
                  sx={{ cursor: "pointer", color: "#7F56D9", fontWeight: 600 }}
                  onClick={() => router.push("/admin/complaints")}
                >
                  {row.complaintNumber}
                </TableCell>
                <TableCell>{row.subject}</TableCell>
                <TableCell>{row.priority}</TableCell>
                <TableCell>
                  <Chip size="small" label={row.status} color={COMPLAINT_STATUS_COLORS[row.status] || "default"} />
                </TableCell>
              </>
            )}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default QualityManagerDashboard;
