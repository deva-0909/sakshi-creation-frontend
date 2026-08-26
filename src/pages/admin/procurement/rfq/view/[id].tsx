import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getRfqByIdThunk,
  sendRfqThunk,
  cancelRfqThunk,
  recordVendorQuoteThunk,
  clearSingleRfq,
  clearRfqError,
  clearRfqSuccessMessage,
} from "@/store/slices/rfqSlice";
import { selectWinningQuoteThunk, clearPurchaseOrderError, clearPurchaseOrderSuccessMessage } from "@/store/slices/purchaseOrderSlice";
import { toast } from "react-toastify";

const rfqStatusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Sent":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Closed":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

const quoteStatusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Invited":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Quoted":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Selected":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Not Selected":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box display="flex" justifyContent="space-between" py={0.75} borderBottom="1px solid #F2F4F7">
    <Typography fontSize={14} color="#667085">
      {label}
    </Typography>
    <Typography fontSize={14} fontWeight={600} color="#101828">
      {value ?? "-"}
    </Typography>
  </Box>
);

const RfqDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { singleRfq: rfq, loading, error, successMessage } = useAppSelector((state) => state.rfqs);
  const { user } = useAppSelector((state) => state.auth);
  const poState = useAppSelector((state) => state.purchaseOrders);

  const permissions = user?.role?.permissions?.rfq;
  const poPermissions = user?.role?.permissions?.purchaseorder;

  const [quoteFormId, setQuoteFormId] = useState<string | null>(null);
  const [quoteRates, setQuoteRates] = useState<Record<string, string>>({});
  const [expectedDate, setExpectedDate] = useState("");

  const load = () => {
    if (typeof id === "string") {
      dispatch(getRfqByIdThunk(id));
    }
  };

  useEffect(() => {
    load();
    return () => {
      dispatch(clearSingleRfq());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearRfqSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearRfqError());
    }
  }, [successMessage, error, dispatch]);

  useEffect(() => {
    if (poState.successMessage) {
      toast.success(poState.successMessage);
      dispatch(clearPurchaseOrderSuccessMessage());
      router.push(`/admin/procurement/purchase-orders`);
    }
    if (poState.error) {
      toast.error(poState.error);
      dispatch(clearPurchaseOrderError());
    }
  }, [poState.successMessage, poState.error, dispatch, router]);

  if (loading && !rfq) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!rfq) return null;

  const { bg, color } = rfqStatusColor(rfq.status);

  const openQuoteForm = (quoteId: string) => {
    setQuoteFormId(quoteId);
    const rates: Record<string, string> = {};
    (rfq.items || []).forEach((it) => {
      rates[it._id] = "";
    });
    setQuoteRates(rates);
  };

  const submitQuote = async (quoteId: string) => {
    const items = (rfq.items || [])
      .filter((it) => quoteRates[it._id] && Number(quoteRates[it._id]) > 0)
      .map((it) => ({ rfqItemId: it._id, rate: Number(quoteRates[it._id]) }));
    if (items.length !== (rfq.items || []).length) {
      toast.error("Enter a positive rate for every material");
      return;
    }
    try {
      await dispatch(recordVendorQuoteThunk({ quoteId, items })).unwrap();
      setQuoteFormId(null);
      load();
    } catch (err) {
      // handled by effect above
    }
  };

  const selectWinner = async (quoteId: string) => {
    await dispatch(selectWinningQuoteThunk({ quoteId, expectedDate: expectedDate || undefined }));
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {rfq.rfqNumber}
          </Typography>
          <ThemeChip label={rfq.status} sx={{ background: bg, color, fontWeight: 600 }} />
        </Box>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/procurement/rfq")}>
          Back to list
        </ThemeButton>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Company" value={rfq.companyName?.companyName} />
          <DetailRow label="Notes" value={rfq.notes} />
          <DetailRow
            label="Created By"
            value={rfq.createdBy ? `${rfq.createdBy.firstName} ${rfq.createdBy.lastName}` : "-"}
          />
          <DetailRow label="Created At" value={rfq.createdAt ? new Date(rfq.createdAt).toLocaleString() : "-"} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Actions
          </Typography>
          <Stack spacing={1.5}>
            {rfq.status === "Draft" && permissions?.edit && (
              <ThemeButton onClick={() => dispatch(sendRfqThunk(rfq._id))} sx={{ background: "#175CD3" }}>
                Send to Vendors
              </ThemeButton>
            )}
            {["Draft", "Sent"].includes(rfq.status) && permissions?.edit && (
              <ThemeButton
                variant="outlined"
                sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                onClick={() => dispatch(cancelRfqThunk(rfq._id))}
              >
                Cancel RFQ
              </ThemeButton>
            )}
            {["Draft", "Sent"].includes(rfq.status) === false && (
              <Typography fontSize={13} color="text.secondary">
                No further actions available for a {rfq.status.toLowerCase()} RFQ.
              </Typography>
            )}
          </Stack>

          {rfq.status === "Sent" && (
            <>
              <Divider sx={{ my: 2 }} />
              <ThemeInput
                labelName="PO Expected Date (used on winner selection)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </>
          )}
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Typography fontWeight={600} mb={1}>
          Materials Needed
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Material</TableCell>
              <TableCell>Qty Needed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rfq.items || []).map((it) => (
              <TableRow key={it._id}>
                <TableCell>{it.material?.materialName || "-"}</TableCell>
                <TableCell>{it.quantityNeeded}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography fontWeight={600} mb={1}>
          Vendor Quotes
        </Typography>
        <Stack spacing={2}>
          {(rfq.quotes || []).map((quote) => {
            const qColor = quoteStatusColor(quote.status);
            const total = (quote.items || []).reduce((sum, it) => sum + (it.rate || 0), 0);
            const canRecord = permissions?.edit && rfq.status === "Sent" && ["Invited", "Quoted"].includes(quote.status);
            const canSelect = poPermissions?.create && rfq.status === "Sent" && quote.status === "Quoted";
            return (
              <Box key={quote._id} sx={{ border: "1px solid #EAECF0", borderRadius: 2, p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography fontWeight={600}>{quote.vendor?.name || "-"}</Typography>
                    <ThemeChip label={quote.status} sx={{ background: qColor.bg, color: qColor.color, fontWeight: 600 }} />
                    {quote.items && quote.items.length > 0 && (
                      <Typography fontSize={13} color="text.secondary">
                        Total: {total}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {canRecord && (
                      <ThemeButton
                        variant="outlined"
                        size="small"
                        onClick={() => (quoteFormId === quote._id ? setQuoteFormId(null) : openQuoteForm(quote._id))}
                      >
                        {quote.status === "Quoted" ? "Update Quote" : "Record Quote"}
                      </ThemeButton>
                    )}
                    {canSelect && (
                      <ThemeButton size="small" sx={{ background: "#12B76A" }} onClick={() => selectWinner(quote._id)}>
                        Select as Winner
                      </ThemeButton>
                    )}
                  </Stack>
                </Box>

                {quote.items && quote.items.length > 0 && (
                  <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Material</TableCell>
                        <TableCell>Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quote.items.map((qi) => {
                        const rfqItem = (rfq.items || []).find((i) => i._id === qi.rfqItemId);
                        return (
                          <TableRow key={qi._id}>
                            <TableCell>{rfqItem?.material?.materialName || "-"}</TableCell>
                            <TableCell>{qi.rate}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </Box>
                )}

                {quoteFormId === quote._id && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed #EAECF0" }}>
                    <Typography fontSize={13} fontWeight={600} mb={1}>
                      Enter rate per material
                    </Typography>
                    <Stack spacing={1.5}>
                      {(rfq.items || []).map((it) => (
                        <Stack key={it._id} direction="row" spacing={2} alignItems="center">
                          <Typography fontSize={13} sx={{ flex: 1 }}>
                            {it.material?.materialName || "-"} (needs {it.quantityNeeded})
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <ThemeInput
                              type="number"
                              fullWidth
                              value={quoteRates[it._id] || ""}
                              onChange={(e) => setQuoteRates((prev) => ({ ...prev, [it._id]: e.target.value }))}
                            />
                          </Box>
                        </Stack>
                      ))}
                      <ThemeButton onClick={() => submitQuote(quote._id)} sx={{ background: "#175CD3" }}>
                        Save Quote
                      </ThemeButton>
                    </Stack>
                  </Box>
                )}
              </Box>
            );
          })}
          {(rfq.quotes || []).length === 0 && (
            <Typography fontSize={13} color="text.secondary">
              No vendors invited.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default RfqDetailPage;
