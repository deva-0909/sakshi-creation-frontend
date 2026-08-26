import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getOpportunityByIdThunk,
  getOpportunityHistoryThunk,
  getOpportunityActivitiesThunk,
  addOpportunityActivityThunk,
  markContactedThunk,
  markQualifiedThunk,
  markRequirementGatheringThunk,
  markProposalSentThunk,
  markNegotiationThunk,
  markWonThunk,
  markLostThunk,
  updateOpportunityThunk,
  convertToQuotationThunk,
  clearSingleOpportunity,
  clearOpportunityError,
  clearOpportunitySuccessMessage,
} from "@/store/slices/opportunitySlice";
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice";
import { toast } from "react-toastify";

const stageColor = (stage: string): { bg: string; color: string } => {
  switch (stage) {
    case "New":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Contacted":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Qualified":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Requirement Gathering":
      return { bg: "#FEDF89", color: "#93370D" };
    case "Proposal Sent":
      return { bg: "#E9D7FE", color: "#6941C6" };
    case "Negotiation":
      return { bg: "#FDE7C6", color: "#B93815" };
    case "Won":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Lost":
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

const ACTIVITY_TYPE_OPTIONS = [
  { label: "Call", value: "call" },
  { label: "Meeting", value: "meeting" },
  { label: "Email", value: "email" },
  { label: "Note", value: "note" },
];

const OpportunityDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { singleOpportunity: o, history, activities, loading, error, successMessage } = useAppSelector(
    (state) => state.opportunities
  );
  const { user } = useAppSelector((state) => state.auth);
  const { productItems } = useAppSelector((state) => state.productItems);

  const [loseOpen, setLoseOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [activityType, setActivityType] = useState<{ label: string; value: string }>(ACTIVITY_TYPE_OPTIONS[3]);
  const [activityNotes, setActivityNotes] = useState("");
  const [loggingActivity, setLoggingActivity] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Module 15: Opportunity -> Quotation conversion, offered once Won.
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertProductItem, setConvertProductItem] = useState<{ label: string; value: string } | null>(null);
  const [convertQty, setConvertQty] = useState("");
  const [convertSize, setConvertSize] = useState("");
  const [convertRate, setConvertRate] = useState("");
  const [convertPrintingRate, setConvertPrintingRate] = useState("");
  const [convertValidUntil, setConvertValidUntil] = useState("");
  const [convertRemarks, setConvertRemarks] = useState("");
  const [converting, setConverting] = useState(false);

  const permissions = user?.role?.permissions?.opportunity;

  useEffect(() => {
    if (typeof id === "string") {
      dispatch(getOpportunityByIdThunk(id));
      dispatch(getOpportunityHistoryThunk(id));
      dispatch(getOpportunityActivitiesThunk(id));
    }
    dispatch(getAllProductItemsThunk());
    return () => {
      dispatch(clearSingleOpportunity());
    };
  }, [id, dispatch]);

  // Mobile/toggle/seed audit (2026-08-26), Phase D: the opportunity's own
  // company isn't known until it loads, so the unconditional fetch above
  // stays unscoped (tri-state -- fine as an initial paint); once the
  // opportunity resolves, re-fetch scoped to its own company so the
  // Convert-to-Quotation product picker doesn't offer the other company's
  // items alongside shared ones.
  useEffect(() => {
    if (o?.companyName?._id) {
      dispatch(getAllProductItemsThunk({ companyName: o.companyName._id }));
    }
  }, [o?.companyName?._id, dispatch]);

  useEffect(() => {
    if (o) setFollowUpDate(o.followUpDate ? o.followUpDate.slice(0, 10) : "");
  }, [o]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearOpportunitySuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearOpportunityError());
    }
  }, [successMessage, error, dispatch]);

  if (loading && !o) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!o) return null;

  const doAction = async (action: () => any) => {
    try {
      await dispatch(action()).unwrap();
    } catch (err: any) {
      // error toast handled by the effect above via slice state
    }
  };

  const handleLogActivity = async () => {
    if (!activityNotes.trim()) {
      toast.error("Enter what happened");
      return;
    }
    setLoggingActivity(true);
    try {
      await dispatch(
        addOpportunityActivityThunk({ id: o._id, data: { type: activityType.value, notes: activityNotes.trim() } })
      ).unwrap();
      setActivityNotes("");
      setActivityType(ACTIVITY_TYPE_OPTIONS[3]);
    } catch (err: any) {
      // error toast handled by the effect above
    } finally {
      setLoggingActivity(false);
    }
  };

  const { bg, color } = stageColor(o.stage);
  const isOpenStage = ["New", "Contacted", "Qualified", "Requirement Gathering", "Proposal Sent", "Negotiation"].includes(o.stage);

  const handleSaveFollowUp = async () => {
    setSavingFollowUp(true);
    try {
      await dispatch(updateOpportunityThunk({ id: o._id, data: { followUpDate: followUpDate || undefined } })).unwrap();
    } catch (err: any) {
      // error toast handled by the effect above
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleConvertToQuotation = async () => {
    if (!convertProductItem || !convertQty || Number(convertQty) <= 0) {
      toast.error("Product item and a positive quantity are required");
      return;
    }
    setConverting(true);
    try {
      await dispatch(
        convertToQuotationThunk({
          id: o._id,
          data: {
            productItem: convertProductItem.value,
            qty: Number(convertQty),
            size: convertSize || undefined,
            rate: convertRate ? Number(convertRate) : undefined,
            printingrate: convertPrintingRate ? Number(convertPrintingRate) : undefined,
            validUntil: convertValidUntil || undefined,
            remarks: convertRemarks || undefined,
          },
        })
      ).unwrap();
      setConvertOpen(false);
      setConvertProductItem(null);
      setConvertQty("");
      setConvertSize("");
      setConvertRate("");
      setConvertPrintingRate("");
      setConvertValidUntil("");
      setConvertRemarks("");
    } catch (err: any) {
      // error toast handled by the effect above
    } finally {
      setConverting(false);
    }
  };

  const productItemOptions = (productItems || []).map((p: any) => ({ label: p.itemName, value: p._id }));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {o.opportunityNumber}
          </Typography>
          <ThemeChip label={o.stage} sx={{ background: bg, color, fontWeight: 600 }} />
        </Box>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/crm/opportunities")}>
          Back to list
        </ThemeButton>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Company" value={o.companyName?.companyName} />
          <DetailRow label="Prospect" value={o.prospectName} />
          <DetailRow label="Contact Person" value={o.contactPerson} />
          <DetailRow label="Contact Phone" value={o.contactPhone} />
          <DetailRow label="Contact Email" value={o.contactEmail} />
          <DetailRow label="Estimated Value" value={o.estimatedValue?.toLocaleString()} />
          <DetailRow label="Source" value={o.source} />
          <DetailRow
            label="Assigned To"
            value={o.assignedTo ? `${o.assignedTo.firstName} ${o.assignedTo.lastName}` : "-"}
          />
          <DetailRow label="Notes" value={o.notes} />
          <DetailRow
            label="Created By"
            value={o.createdBy ? `${o.createdBy.firstName} ${o.createdBy.lastName}` : "-"}
          />
          <DetailRow label="Created At" value={o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"} />
          {o.stage === "Won" && o.party && <DetailRow label="Converted Party" value={o.party.partyName} />}
          {o.stage === "Won" && o.wonAt && <DetailRow label="Won At" value={new Date(o.wonAt).toLocaleString()} />}
          {o.stage === "Lost" && o.lostAt && <DetailRow label="Lost At" value={new Date(o.lostAt).toLocaleString()} />}
          {o.stage === "Lost" && o.lostReason && <DetailRow label="Lost Reason" value={o.lostReason} />}
          {o.quotation && <DetailRow label="Converted Quotation" value={`${o.quotation.quotationNumber} (${o.quotation.status})`} />}

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={600} mb={1}>
            Follow-Up
          </Typography>
          {isOpenStage && permissions?.edit ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={2} alignItems="flex-start">
              <ThemeInput
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <ThemeButton onClick={handleSaveFollowUp} disabled={savingFollowUp} sx={{ background: "#175CD3", whiteSpace: "nowrap" }}>
                {savingFollowUp ? "Saving..." : "Save Follow-Up Date"}
              </ThemeButton>
            </Stack>
          ) : (
            <DetailRow label="Follow-Up Date" value={o.followUpDate ? new Date(o.followUpDate).toLocaleDateString() : "-"} />
          )}

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={600} mb={1}>
            Activity Log
          </Typography>
          {isOpenStage && permissions?.edit && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={2} alignItems="flex-start">
              <Box sx={{ minWidth: 140 }}>
                <ThemeSelect
                  options={ACTIVITY_TYPE_OPTIONS}
                  value={activityType}
                  onChange={(_, v) => v && setActivityType(v as { label: string; value: string })}
                />
              </Box>
              <ThemeInput
                fullWidth
                placeholder="What happened?"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
              />
              <ThemeButton onClick={handleLogActivity} disabled={loggingActivity} sx={{ background: "#175CD3", whiteSpace: "nowrap" }}>
                {loggingActivity ? "Logging..." : "Log Activity"}
              </ThemeButton>
            </Stack>
          )}
          <Stack spacing={1}>
            {activities.length === 0 && (
              <Typography fontSize={13} color="text.secondary">
                No activity logged yet.
              </Typography>
            )}
            {activities.map((a) => (
              <Box key={a._id} sx={{ borderLeft: "2px solid #D0D5DD", pl: 1.5, py: 0.5 }}>
                <Typography fontSize={13} fontWeight={600} sx={{ textTransform: "capitalize" }}>
                  {a.type}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {a.activityDate ? new Date(a.activityDate).toLocaleString() : ""}
                  {a.createdBy ? ` · ${a.createdBy.firstName} ${a.createdBy.lastName}` : ""}
                </Typography>
                {a.notes && (
                  <Typography fontSize={13} color="#101828">
                    {a.notes}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Actions
          </Typography>
          <Stack spacing={1.5}>
            {o.stage === "New" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(() => markContactedThunk(o._id))} sx={{ background: "#175CD3" }}>
                Mark Contacted
              </ThemeButton>
            )}
            {o.stage === "Contacted" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(() => markQualifiedThunk(o._id))} sx={{ background: "#B54708" }}>
                Mark Qualified
              </ThemeButton>
            )}
            {o.stage === "Qualified" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(() => markRequirementGatheringThunk(o._id))} sx={{ background: "#B54708" }}>
                Mark Requirement Gathering
              </ThemeButton>
            )}
            {o.stage === "Requirement Gathering" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(() => markProposalSentThunk(o._id))} sx={{ background: "#6941C6" }}>
                Mark Proposal Sent
              </ThemeButton>
            )}
            {o.stage === "Proposal Sent" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(() => markNegotiationThunk(o._id))} sx={{ background: "#B93815" }}>
                Mark Negotiation
              </ThemeButton>
            )}
            {o.stage === "Negotiation" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(() => markWonThunk(o._id))} sx={{ background: "#12B76A" }}>
                Mark Won
              </ThemeButton>
            )}
            {isOpenStage && permissions?.edit && (
              <ThemeButton
                variant="outlined"
                sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                onClick={() => setLoseOpen(true)}
              >
                Mark Lost
              </ThemeButton>
            )}
            {o.stage === "Won" && !o.quotationId && permissions?.edit && (
              <ThemeButton onClick={() => setConvertOpen(true)} sx={{ background: "#175CD3" }}>
                Convert to Quotation
              </ThemeButton>
            )}
            {!isOpenStage && o.stage !== "Won" && (
              <Typography fontSize={13} color="text.secondary">
                No further actions available for a {o.stage.toLowerCase()} opportunity.
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={600} mb={1}>
            Stage History
          </Typography>
          <Stack spacing={1}>
            {history.length === 0 && (
              <Typography fontSize={13} color="text.secondary">
                No history yet.
              </Typography>
            )}
            {history.map((h) => (
              <Box key={h._id} sx={{ borderLeft: "2px solid #D0D5DD", pl: 1.5, py: 0.5 }}>
                <Typography fontSize={13} fontWeight={600}>
                  {h.fromStage ? `${h.fromStage} → ${h.toStage}` : h.toStage}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}
                  {h.changedBy ? ` · ${h.changedBy.firstName} ${h.changedBy.lastName}` : ""}
                </Typography>
                {h.remarks && (
                  <Typography fontSize={12} color="text.secondary">
                    {h.remarks}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>

      <CustomDialog open={loseOpen} onClose={() => setLoseOpen(false)} title="Mark Opportunity Lost" maxWidth="xs">
        <ThemeInput
          labelName="Reason"
          fullWidth
          required
          multiline
          minRows={3}
          value={lostReason}
          onChange={(e) => setLostReason(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton variant="outlined" onClick={() => setLoseOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton
            sx={{ background: "#D92D20" }}
            onClick={async () => {
              if (!lostReason.trim()) {
                toast.error("A reason is required");
                return;
              }
              await dispatch(markLostThunk({ id: o._id, lostReason: lostReason.trim() }) as any);
              setLoseOpen(false);
              setLostReason("");
            }}
          >
            Confirm Lost
          </ThemeButton>
        </Box>
      </CustomDialog>

      <CustomDialog open={convertOpen} onClose={() => setConvertOpen(false)} title="Convert to Quotation" maxWidth="sm">
        <Stack spacing={2} mt={1}>
          <ThemeSelect
            label="Product Item"
            options={productItemOptions}
            value={convertProductItem}
            onChange={(_, v) => setConvertProductItem(v as { label: string; value: string } | null)}
          />
          <Stack direction="row" spacing={2}>
            <ThemeInput labelName="Quantity" type="number" fullWidth required value={convertQty} onChange={(e) => setConvertQty(e.target.value)} />
            <ThemeInput labelName="Size" fullWidth value={convertSize} onChange={(e) => setConvertSize(e.target.value)} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <ThemeInput labelName="Rate" type="number" fullWidth value={convertRate} onChange={(e) => setConvertRate(e.target.value)} />
            <ThemeInput labelName="Printing Rate" type="number" fullWidth value={convertPrintingRate} onChange={(e) => setConvertPrintingRate(e.target.value)} />
          </Stack>
          <ThemeInput
            labelName="Valid Until"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={convertValidUntil}
            onChange={(e) => setConvertValidUntil(e.target.value)}
          />
          <ThemeInput labelName="Remarks" fullWidth multiline minRows={2} value={convertRemarks} onChange={(e) => setConvertRemarks(e.target.value)} />
        </Stack>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <ThemeButton variant="outlined" onClick={() => setConvertOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton sx={{ background: "#175CD3" }} onClick={handleConvertToQuotation} disabled={converting}>
            {converting ? "Converting..." : "Create Quotation"}
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default OpportunityDetailPage;
