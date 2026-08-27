import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, TableCell, Chip, Stack } from "@mui/material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllJobCardsThunk } from "@/store/slices/jobCardSlice";
import { getAllComplaintsThunk } from "@/store/slices/complaintSlice";
import { getAllOrdersThunk } from "@/store/slices/orderSlice";

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
const STAGE_COLORS: Record<string, "default" | "info" | "warning" | "success"> = {
  Printer: "info",
  Binder: "info",
  "Booklet Binder": "info",
  Factory: "warning",
  Godown: "success",
  Done: "success",
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

const orderColumns = [
  { id: "id", label: "#" },
  { id: "orderNumber", label: "Order No." },
  { id: "party", label: "Party" },
  { id: "item", label: "Item" },
  { id: "qty", label: "Qty" },
  { id: "status", label: "Status" },
];

const complaintColumns = [
  { id: "id", label: "#" },
  { id: "complaintNumber", label: "Complaint No." },
  { id: "subject", label: "Subject" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
];

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
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
  const [ordersTotalCount, setOrdersTotalCount] = useState<number | null>(null);

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
  }, [dispatch, activeCompanyId]);

  const inProduction = jobCards.filter((jc: any) => jc.status !== "Completed" && jc.status !== "Cancelled").length;
  const atFactory = jobCards.filter((jc: any) => jc.currentStage === "Factory").length;
  const atGodown = jobCards.filter((jc: any) => jc.currentStage === "Godown").length;
  const openComplaints = complaints.filter((c: any) => c.status === "Open" || c.status === "In Progress").length;

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
      </Grid>

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
            Recent Orders
          </Typography>
          <BasicTable
            showFillter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={orderColumns}
            rowData={orders.map((o: any) => ({ ...o, id: o._id }))}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell
                  sx={{ cursor: "pointer", color: "#7F56D9", fontWeight: 600 }}
                  onClick={() => router.push(`/admin/all-orders/view?id=${row._id}`)}
                >
                  {row.orderNumber}
                </TableCell>
                <TableCell>{row.party?.partyName || "-"}</TableCell>
                <TableCell>{row.productItem?.itemName || "-"}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>{row.status}</TableCell>
              </>
            )}
          />
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
