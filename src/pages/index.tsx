import React, { useEffect } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider } from "@mui/material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import { getDashboardSummaryThunk } from "@/store/slices/dashboardSlice";

const STATUS_COLORS: Record<string, string> = {
  Draft: "#667085",
  "Pending Approval": "#B4761F",
  Approved: "#12B76A",
  Rejected: "#D92D20",
  Sent: "#175CD3",
  Accepted: "#12B76A",
  Converted: "#7B06C2",
  Cancelled: "#D92D20",
  "Partially Received": "#B4761F",
  Received: "#12B76A",
  Issued: "#175CD3",
  "Partially Paid": "#B4761F",
  Paid: "#12B76A",
  "In Progress": "#175CD3",
  Completed: "#12B76A",
  Pending: "#667085",
};

const StatusPill: React.FC<{ status: string; count: number }> = ({ status, count }) => (
  <Box
    display="flex"
    alignItems="center"
    gap={0.75}
    sx={{ border: "1px solid #E4E7EC", borderRadius: 2, px: 1.25, py: 0.5 }}
  >
    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: STATUS_COLORS[status] || "#98A2B3" }} />
    <Typography fontSize={13} color="text.secondary">
      {status}
    </Typography>
    <Typography fontSize={13} fontWeight={700}>
      {count}
    </Typography>
  </Box>
);

const KpiCard: React.FC<{ label: string; value: React.ReactNode; sub?: string; accent?: string; onClick?: () => void }> = ({
  label,
  value,
  sub,
  accent = "#7B06C2",
  onClick,
}) => (
  <Paper
    variant="outlined"
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 2,
      flex: "1 1 200px",
      minWidth: 200,
      cursor: onClick ? "pointer" : "default",
      borderTop: `3px solid ${accent}`,
      "&:hover": onClick ? { boxShadow: 2 } : undefined,
    }}
  >
    <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.4}>
      {label}
    </Typography>
    <Typography fontSize={26} fontWeight={700} mt={0.5} sx={{ fontVariantNumeric: "tabular-nums" }}>
      {value}
    </Typography>
    {sub && (
      <Typography fontSize={12} color="text.secondary" mt={0.25}>
        {sub}
      </Typography>
    )}
  </Paper>
);

const StatusCard: React.FC<{ title: string; byStatus: Record<string, number> }> = ({ title, byStatus }) => {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: "1 1 320px", minWidth: 300 }}>
      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1.5}>
        <Typography fontWeight={600}>{title}</Typography>
        <Typography fontSize={13} color="text.secondary">
          {total} total
        </Typography>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(byStatus).length === 0 ? (
          <Typography fontSize={13} color="text.secondary">
            No records yet.
          </Typography>
        ) : (
          Object.entries(byStatus).map(([status, count]) => <StatusPill key={status} status={status} count={count} />)
        )}
      </Box>
    </Paper>
  );
};

// The dashboard's content area -- App-level Dashboard shell (sidebar +
// header) already wraps every page except /login, so this is just the
// widget grid for "/". Each widget is rendered only when its key is
// present in the summary payload, matching the backend's own scoping (a
// widget is omitted server-side, not just hidden client-side, when the
// caller's view permission for that module is false -- see
// dashboard.controller.js's hasView()).
const Home = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { summary, loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getDashboardSummaryThunk());
  }, [dispatch]);

  const nothingToShow =
    !loading &&
    summary &&
    !summary.quotations &&
    !summary.purchaseOrders &&
    !summary.jobCards &&
    !summary.invoices &&
    summary.pendingApprovalsCount === undefined &&
    !summary.lowestStockMaterials &&
    !summary.profitability;

  return (
    <Box p={1}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Overview
      </Typography>

      {loading && !summary ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : nothingToShow ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <Typography color="text.secondary">
            Nothing to show yet -- your role doesn&apos;t currently have view access to any of the dashboard&apos;s data sources.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {/* KPI row */}
          <Box display="flex" flexWrap="wrap" gap={2}>
            {summary?.pendingApprovalsCount !== undefined && (
              <KpiCard
                label="Pending My Approval"
                value={summary.pendingApprovalsCount}
                sub="Quotations + Purchase Orders"
                accent="#B4761F"
                onClick={() => router.push("/admin/approvals")}
              />
            )}
            {summary?.invoices && (
              <KpiCard
                label="Revenue This Month"
                value={`₹${summary.invoices.monthlyRevenue.toLocaleString("en-IN")}`}
                sub="Issued invoices, current calendar month"
                accent="#175CD3"
              />
            )}
            {summary?.profitability && (
              <KpiCard
                label="Job Card Profit"
                value={`₹${summary.profitability.totalProfit.toLocaleString("en-IN")}`}
                sub={summary.profitability.marginPct !== null ? `${summary.profitability.marginPct}% margin across ${summary.profitability.jobCardCount} job cards` : `Across ${summary.profitability.jobCardCount} job cards`}
                accent={summary.profitability.totalProfit >= 0 ? "#12B76A" : "#D92D20"}
              />
            )}
            {summary?.lowestStockMaterials && (
              <KpiCard
                label="Lowest Stock Material"
                value={summary.lowestStockMaterials[0]?.material.materialName || "-"}
                sub={summary.lowestStockMaterials[0] ? `Balance: ${summary.lowestStockMaterials[0].balance}` : "No inventory recorded yet"}
                accent="#D92D20"
                onClick={() => router.push("/admin/inventory/stock-ledger")}
              />
            )}
          </Box>

          {/* Status breakdowns */}
          {(summary?.quotations || summary?.purchaseOrders || summary?.jobCards || summary?.invoices) && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              {summary?.quotations && <StatusCard title="Quotations" byStatus={summary.quotations.byStatus} />}
              {summary?.purchaseOrders && <StatusCard title="Purchase Orders" byStatus={summary.purchaseOrders.byStatus} />}
              {summary?.jobCards && <StatusCard title="Job Cards" byStatus={summary.jobCards.byStatus} />}
              {summary?.invoices && <StatusCard title="Invoices" byStatus={summary.invoices.byStatus} />}
            </Box>
          )}

          {/* Lowest stock table */}
          {summary?.lowestStockMaterials && summary.lowestStockMaterials.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography fontWeight={600} mb={1.5}>
                Materials by Lowest Current Balance
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Stack divider={<Divider />}>
                {summary.lowestStockMaterials.map((row) => (
                  <Box key={row.material._id} display="flex" justifyContent="space-between" py={1}>
                    <Typography fontSize={14}>{row.material.materialName}</Typography>
                    <Typography fontSize={14} fontWeight={700} color={row.balance <= 0 ? "#D92D20" : "text.primary"} sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {row.balance}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Home;
