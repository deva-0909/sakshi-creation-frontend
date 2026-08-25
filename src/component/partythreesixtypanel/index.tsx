// Module 15: CRM 360-degree party view panel -- orders, quotations,
// invoices, receipts, opportunities, and calls for one party, rolled up
// from the new /account-master/getbyid/:id/360 endpoint. Self-contained
// (local state, not Redux) since it's used from exactly one page and
// fetches a single read-only payload on mount.
import React, { useEffect, useState } from "react";
import { Box, Paper, Stack, Typography, CircularProgress, Divider, Chip } from "@mui/material";
import { useRouter } from "next/router";
import { partyThreeSixtyService, type PartyThreeSixty } from "@/services/partyThreeSixty.service";

interface PartyThreeSixtyPanelProps {
  accountMasterId: string;
}

const StatTile = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, minWidth: 130, flex: 1 }}>
    <Typography fontSize={12} color="text.secondary" mb={0.5}>
      {label}
    </Typography>
    <Typography fontSize={18} fontWeight={700}>
      {value}
    </Typography>
  </Paper>
);

const MiniList = ({
  title,
  emptyText,
  rows,
  onRowClick,
  renderRow,
}: {
  title: string;
  emptyText: string;
  rows: any[];
  onRowClick?: (row: any) => void;
  renderRow: (row: any) => React.ReactNode;
}) => (
  <Box flex={1} minWidth={260}>
    <Typography fontSize={13} fontWeight={600} mb={1}>
      {title}
    </Typography>
    {rows.length === 0 ? (
      <Typography fontSize={12} color="text.secondary">
        {emptyText}
      </Typography>
    ) : (
      <Stack spacing={0.75}>
        {rows.slice(0, 8).map((row) => (
          <Box
            key={row._id}
            sx={{ borderLeft: "2px solid #D0D5DD", pl: 1.25, py: 0.25, cursor: onRowClick ? "pointer" : "default" }}
            onClick={() => onRowClick?.(row)}
          >
            {renderRow(row)}
          </Box>
        ))}
        {rows.length > 8 && (
          <Typography fontSize={11} color="text.secondary">
            +{rows.length - 8} more
          </Typography>
        )}
      </Stack>
    )}
  </Box>
);

const PartyThreeSixtyPanel: React.FC<PartyThreeSixtyPanelProps> = ({ accountMasterId }) => {
  const router = useRouter();
  const [data, setData] = useState<PartyThreeSixty | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountMasterId) return;
    setLoading(true);
    setError(null);
    partyThreeSixtyService
      .getPartyThreeSixty(accountMasterId)
      .then((res) => setData(res.data || null))
      .catch((err: any) => setError(err.message || "Failed to load 360 view"))
      .finally(() => setLoading(false));
  }, [accountMasterId]);

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography fontSize={13} color="#B42318">
        {error}
      </Typography>
    );
  }

  if (!data) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
      <Typography fontWeight={600} mb={2}>
        360&deg; View
      </Typography>

      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap mb={2}>
        <StatTile label="Orders" value={data.summary.orderCount} />
        <StatTile label="Quotations" value={data.summary.quotationCount} />
        <StatTile label="Invoices" value={data.summary.invoiceCount} />
        <StatTile label="Open Opportunities" value={data.summary.openOpportunityCount} />
        <StatTile label="Revenue" value={data.summary.revenue} />
        <StatTile
          label="Outstanding"
          value={
            <Typography component="span" fontSize={18} fontWeight={700} color={data.summary.outstanding > 0 ? "#B42318" : "#027A48"}>
              {data.summary.outstanding}
            </Typography>
          }
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
        <MiniList
          title="Orders"
          emptyText="No orders yet."
          rows={data.orders}
          onRowClick={(row) => router.push(`/admin/all-orders/view?id=${row._id}`)}
          renderRow={(row) => (
            <>
              <Typography fontSize={13} fontWeight={600}>
                {row.orderNumber}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                Qty {row.qty} &middot; {row.status}
                {row.expectedDeliveryDate ? ` · due ${new Date(row.expectedDeliveryDate).toLocaleDateString()}` : ""}
              </Typography>
            </>
          )}
        />
        <MiniList
          title="Quotations"
          emptyText="No quotations yet."
          rows={data.quotations}
          onRowClick={(row) => router.push(`/admin/quotation/view/${row._id}`)}
          renderRow={(row) => (
            <>
              <Typography fontSize={13} fontWeight={600}>
                {row.quotationNumber}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {row.status}
                {row.totalAmount !== undefined ? ` · ${row.totalAmount}` : ""}
              </Typography>
            </>
          )}
        />
        <MiniList
          title="Invoices"
          emptyText="No invoices yet."
          rows={data.invoices}
          onRowClick={(row) => router.push(`/admin/accounting/invoices/view/${row._id}`)}
          renderRow={(row) => (
            <>
              <Typography fontSize={13} fontWeight={600}>
                {row.invoiceNumber}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {row.status} &middot; {row.grandTotal} (paid {row.amountPaid})
              </Typography>
            </>
          )}
        />
        <MiniList
          title="Opportunities"
          emptyText="No opportunities yet."
          rows={data.opportunities}
          onRowClick={(row) => router.push(`/admin/crm/opportunities/view/${row._id}`)}
          renderRow={(row) => (
            <>
              <Typography fontSize={13} fontWeight={600}>
                {row.opportunityNumber}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                <Chip size="small" label={row.stage} sx={{ height: 18, fontSize: 10, mr: 0.5 }} />
                {row.estimatedValue !== undefined ? row.estimatedValue : ""}
              </Typography>
            </>
          )}
        />
        <MiniList
          title="Calls"
          emptyText="No calls logged yet."
          rows={data.calls}
          renderRow={(row) => (
            <>
              <Typography fontSize={13} fontWeight={600}>
                {row.reason || "Call"}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {row.status || ""} {row.date ? `· ${new Date(row.date).toLocaleDateString()}` : ""}
              </Typography>
            </>
          )}
        />
      </Stack>
    </Paper>
  );
};

export default PartyThreeSixtyPanel;
