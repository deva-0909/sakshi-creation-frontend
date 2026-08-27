import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider, Stepper, Step, StepLabel, useMediaQuery, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import CustomDialog from "@/component/customdialog";
import BackButton from "@/component/common_component/BackButton";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllRolesThunk } from "@/store/slices/roleSlice";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { getAllMachinesThunk } from "@/store/slices/machineSlice";
import { getSuggestedRoutingTemplateThunk } from "@/store/slices/routingSlice";
import { DEFECT_CATEGORIES } from "@/services/jobCard.service";
import {
  getJobCardByIdThunk,
  getJobCardStageHistoryThunk,
  advanceJobCardStageThunk,
  recordMaterialUsageThunk,
  clearSingleJobCard,
  clearJobCardError,
  clearJobCardSuccessMessage,
} from "@/store/slices/jobCardSlice";
import {
  getCostingByJobCardThunk,
  upsertLaborCostThunk,
  clearCostingSuccessMessage,
  clearCostingError,
} from "@/store/slices/costingSlice";
import {
  createReworkThunk,
  getReworksForJobCardThunk,
  startReworkThunk,
  submitReworkForApprovalThunk,
  approveReworkThunk,
  rejectReworkThunk,
  clearJobCardReworkError,
  clearJobCardReworkSuccessMessage,
  clearReworks,
} from "@/store/slices/jobCardReworkSlice";
import { toast } from "react-toastify";

// Module 8: QC slots in as a real stage of its own -- advisory only, so a
// Failed result is recorded but never blocks the card from moving on to
// Delivery (see the design plan's Q1 answer).
const SAKSHI_CREATION_STAGES = ["Designer", "Printer", "Binder", "Booklet Binder", "QC", "Delivery"];
// Phase 2 Part B (two-company): Quality Packaging's pipeline has no
// Designer/QC/Delivery stages and adds Factory + Godown at the end,
// matching the backend's stageOrderForCompany (jobCard.controller.js).
const QUALITY_PACKAGING_STAGES = ["Printer", "Binder", "Booklet Binder", "Factory", "Godown"];
const stagesForCompany = (companyName?: string) => (companyName === "Quality Packaging" ? QUALITY_PACKAGING_STAGES : SAKSHI_CREATION_STAGES);
const STAGE_STATUSES = ["Pending", "In Progress", "Done"];
// Only these 3 stages run on physical equipment -- see machine.validator.js's
// category enum, which the backend also uses to reject a mismatched machine.
// Shared by both companies' pipelines; Factory/Godown have no equipment of
// their own, same as the existing Factory/Godown inventory categories.
const MACHINE_STAGES = ["Printer", "Binder", "Booklet Binder"];
// Sakshi Creation order-process audit (2026-08-25): Designer and Delivery
// aren't material-consuming production steps any more than Quality
// Packaging's Factory/Godown are (see the matching QP-audit gap) -- but the
// Wasted Sheets and Record Material Usage sections below render
// unconditionally at every stage, with no indication that these two don't
// really apply. Not blocked (an edge case might still need it), just flagged
// with the same advisory-copy pattern already used for QC above.
const NON_MATERIAL_STAGES = ["Designer", "Delivery"];

const reworkStatusColor: Record<string, { bg: string; color: string }> = {
  Pending: { bg: "#F2F4F7", color: "#344054" },
  "In Progress": { bg: "#D1E9FF", color: "#175CD3" },
  "Pending Approval": { bg: "#FEF0C7", color: "#B54708" },
  Approved: { bg: "#D1FADF", color: "#027A48" },
  Rejected: { bg: "#FEE4E2", color: "#B42318" },
};

const statusColor: Record<string, { bg: string; color: string }> = {
  Pending: { bg: "#F2F4F7", color: "#344054" },
  "In Progress": { bg: "#D1E9FF", color: "#175CD3" },
  "On Hold": { bg: "#FEF0C7", color: "#B54708" },
  Completed: { bg: "#D1FADF", color: "#027A48" },
  Cancelled: { bg: "#FEE4E2", color: "#B42318" },
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

const JobCardDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { id } = router.query;
  const { singleJobCard: jc, stageHistory, loading, error, successMessage } = useAppSelector((state) => state.jobCards);
  const { suggestedTemplate } = useAppSelector((state) => state.routing);
  const { roles } = useAppSelector((state) => state.roles);
  const { materials } = useAppSelector((state) => state.materials);
  const { machines } = useAppSelector((state) => state.machines);
  const { user } = useAppSelector((state) => state.auth);
  const {
    singleCosting: costing,
    loading: costingLoading,
    error: costingError,
    successMessage: costingSuccessMessage,
  } = useAppSelector((state) => state.costing);
  const {
    reworks,
    loading: reworkLoading,
    error: reworkError,
    successMessage: reworkSuccessMessage,
  } = useAppSelector((state) => state.jobCardReworks);

  const permissions = user?.role?.permissions?.jobcard;
  const costingPermissions = user?.role?.permissions?.costing;
  const reworkPermissions = user?.role?.permissions?.rework;

  // Advance-stage form state
  const [stage, setStage] = useState("");
  const [stageStatus, setStageStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<{ label: string; value: string | number } | null>(null);
  // Module 8: real per-stage quantities
  const [completedQty, setCompletedQty] = useState("");
  const [rejectedQty, setRejectedQty] = useState("");
  const [reworkQty, setReworkQty] = useState("");
  // Module 8: QC -- only shown/sent when stage === "QC"
  const [qcResult, setQcResult] = useState<any>(null);
  const [defectCategory, setDefectCategory] = useState<any>(null);
  const [defectReason, setDefectReason] = useState("");
  // QP box-manufacturing Figma audit (2026-08-25): the Order-In screen's
  // expandable Factory checklist -- only shown/sent when stage === "Factory".
  // No formula backs Kantan/Kantan Deckal anywhere in the Figma file itself
  // (see claude/qp-box-manufacturing-kantan-figma-audit.md), so these are
  // plain manual fields, matching what the design shows.
  const [factoryUnitNumber, setFactoryUnitNumber] = useState("");
  const [pasteingStatus, setPasteingStatus] = useState("");
  const [piningStatus, setPiningStatus] = useState("");
  const [rsFor, setRsFor] = useState("");
  const [kantan, setKantan] = useState("");
  const [kantanDeckal, setKantanDeckal] = useState("");
  const [factoryDeliveryDate, setFactoryDeliveryDate] = useState("");
  // Module 8: wastage now needs a material + Role/Staff, same as Record
  // Material Usage, so it can write a real stock movement.
  const [wastedSheet, setWastedSheet] = useState("");
  const [wastageReason, setWastageReason] = useState("");
  const [wastageMaterial, setWastageMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [wastageRole, setWastageRole] = useState<{ label: string; value: string | number } | null>(null);
  const [wastageStaff, setWastageStaff] = useState<any>(null);

  // Material usage form state
  const [usageRole, setUsageRole] = useState<{ label: string; value: string | number } | null>(null);
  const [usageStaff, setUsageStaff] = useState<any>(null);
  const [usageMaterial, setUsageMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [usageQty, setUsageQty] = useState("");

  // Rework create-dialog state (Module 8)
  const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
  const [reworkReason, setReworkReason] = useState("");
  const [reworkDefectCategory, setReworkDefectCategory] = useState<any>(null);
  const [reworkQuantity, setReworkQuantity] = useState("");
  const [reworkDepartment, setReworkDepartment] = useState<{ label: string; value: string | number } | null>(null);
  const [reworkStaff, setReworkStaff] = useState<any>(null);
  const [reworkNotes, setReworkNotes] = useState("");
  const [reworkCost, setReworkCost] = useState("");
  const [rejectDialogFor, setRejectDialogFor] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  // Cost-bucket entry form -- no wage/rate data exists anywhere in the
  // system, so this is recorded by hand per job card (see the design
  // plan). Module 14 extended this from 2 buckets (labor/overhead) to
  // all 8 the scope doc asks for.
  const [laborCostInput, setLaborCostInput] = useState("");
  const [overheadCostInput, setOverheadCostInput] = useState("");
  const [printingCostInput, setPrintingCostInput] = useState("");
  const [bindingCostInput, setBindingCostInput] = useState("");
  const [finishingCostInput, setFinishingCostInput] = useState("");
  const [outsourcingCostInput, setOutsourcingCostInput] = useState("");
  const [deliveryCostInput, setDeliveryCostInput] = useState("");
  const [costingNotes, setCostingNotes] = useState("");

  useEffect(() => {
    if (typeof id === "string") {
      dispatch(getJobCardByIdThunk(id));
      dispatch(getJobCardStageHistoryThunk(id));
      dispatch(getCostingByJobCardThunk(id));
      dispatch(getReworksForJobCardThunk(id));
    }
    dispatch(getAllRolesThunk());
    dispatch(getAllMaterialsThunk());
    return () => {
      dispatch(clearSingleJobCard());
      dispatch(clearReworks());
    };
  }, [id, dispatch]);

  // Module 10: informational routing suggestion, keyed off the job card's
  // product item -- falls back to the default template server-side if no
  // product-specific template exists.
  useEffect(() => {
    if (jc?.productItem?._id) {
      dispatch(getSuggestedRoutingTemplateThunk(jc.productItem._id));
    }
  }, [jc?.productItem?._id, dispatch]);

  // Mobile/toggle/seed audit (2026-08-26), Phase D: getAllMachinesThunk was
  // dispatched unscoped before jc even loaded, and the Advance Stage machine
  // picker only filtered by category -- a staff member could assign a
  // machine belonging to the *other* company to this job card's stage.
  // Deferred until the job card's own order (and its company) is loaded, so
  // the picker only ever offers this order's company's machines.
  useEffect(() => {
    if (jc?.order?.companyName?._id) {
      dispatch(getAllMachinesThunk({ companyName: jc.order.companyName._id }));
    }
  }, [jc?.order?.companyName?._id, dispatch]);

  useEffect(() => {
    if (jc) {
      const stages = stagesForCompany(jc.order?.companyName?.companyName);
      setStage(jc.currentStage === "Done" ? stages[stages.length - 1] : jc.currentStage);
    }
  }, [jc]);

  useEffect(() => {
    if (costing) {
      setLaborCostInput(String(costing.laborCost ?? ""));
      setOverheadCostInput(String(costing.overheadCost ?? ""));
      setPrintingCostInput(String(costing.printingCost ?? ""));
      setBindingCostInput(String(costing.bindingCost ?? ""));
      setFinishingCostInput(String(costing.finishingCost ?? ""));
      setOutsourcingCostInput(String(costing.outsourcingCost ?? ""));
      setDeliveryCostInput(String(costing.deliveryCost ?? ""));
      setCostingNotes(costing.notes || "");
    }
  }, [costing]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearJobCardSuccessMessage());
      if (typeof id === "string") {
        dispatch(getJobCardByIdThunk(id));
        dispatch(getJobCardStageHistoryThunk(id));
      }
    }
    if (error) {
      toast.error(error);
      dispatch(clearJobCardError());
    }
  }, [successMessage, error, dispatch, id]);

  useEffect(() => {
    if (costingSuccessMessage) {
      toast.success(costingSuccessMessage);
      dispatch(clearCostingSuccessMessage());
      if (typeof id === "string") dispatch(getCostingByJobCardThunk(id));
    }
    if (costingError) {
      toast.error(costingError);
      dispatch(clearCostingError());
    }
  }, [costingSuccessMessage, costingError, dispatch, id]);

  useEffect(() => {
    if (reworkSuccessMessage) {
      toast.success(reworkSuccessMessage);
      dispatch(clearJobCardReworkSuccessMessage());
    }
    if (reworkError) {
      toast.error(reworkError);
      dispatch(clearJobCardReworkError());
    }
  }, [reworkSuccessMessage, reworkError, dispatch]);

  const roleOptions = roles.map((r: any) => ({ label: r.roleName, value: r._id }));
  const materialOptions = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}${m.materialGSM ? ` (${m.materialGSM}gsm)` : ""}`,
    value: m._id,
  }));
  // Only machines whose category matches the stage being advanced -- a Printer
  // machine can't be assigned to a Binder stage (the backend rejects this too).
  const machineOptions = machines
    .filter((m: any) => m.category === stage)
    .map((m: any) => ({ label: `${m.machineName} (${m.machineCode})`, value: m._id }));

  const handleStageChange = (v: any) => {
    setStage(v ? String(v.value) : "");
    setSelectedMachine(null);
    setQcResult(null);
    setDefectCategory(null);
    setDefectReason("");
    setFactoryUnitNumber("");
    setPasteingStatus("");
    setPiningStatus("");
    setRsFor("");
    setKantan("");
    setKantanDeckal("");
    setFactoryDeliveryDate("");
  };

  const handleAdvanceStage = () => {
    if (!stage || !stageStatus) {
      toast.error("Select a stage and status");
      return;
    }
    if (Number(wastedSheet) > 0 && (!wastageMaterial || !wastageRole || !wastageStaff)) {
      toast.error("Recording wastage requires a material and a Role/Staff selection");
      return;
    }
    if (typeof id !== "string") return;
    dispatch(
      advanceJobCardStageThunk({
        id,
        data: {
          stage,
          status: stageStatus,
          assignedTo: assignedTo?.value || undefined,
          remarks: remarks || undefined,
          machine: selectedMachine ? String(selectedMachine.value) : undefined,
          completedQty: completedQty ? Number(completedQty) : undefined,
          rejectedQty: rejectedQty ? Number(rejectedQty) : undefined,
          reworkQty: reworkQty ? Number(reworkQty) : undefined,
          qcResult: stage === "QC" && qcResult ? (qcResult.value as "Passed" | "Failed") : undefined,
          defectCategory: stage === "QC" && defectCategory ? defectCategory.value : undefined,
          defectReason: stage === "QC" && defectReason ? defectReason : undefined,
          unitNumber: stage === "Factory" && factoryUnitNumber ? Number(factoryUnitNumber) : undefined,
          pasteingStatus: stage === "Factory" && pasteingStatus ? pasteingStatus : undefined,
          piningStatus: stage === "Factory" && piningStatus ? piningStatus : undefined,
          rsFor: stage === "Factory" && rsFor ? rsFor : undefined,
          kantan: stage === "Factory" && kantan ? kantan : undefined,
          kantanDeckal: stage === "Factory" && kantanDeckal ? kantanDeckal : undefined,
          factoryDeliveryDate: stage === "Factory" && factoryDeliveryDate ? factoryDeliveryDate : undefined,
          wastedSheet: wastedSheet ? Number(wastedSheet) : undefined,
          wastageReason: wastageReason || undefined,
          wastageMaterial: wastageMaterial ? String(wastageMaterial.value) : undefined,
          wastageForRole: wastageRole ? String(wastageRole.value) : undefined,
          wastageForCompany: wastageStaff ? String(wastageStaff.value) : undefined,
        },
      })
    );
    setStageStatus("");
    setRemarks("");
    setSelectedMachine(null);
    setCompletedQty("");
    setRejectedQty("");
    setReworkQty("");
    setQcResult(null);
    setDefectCategory(null);
    setDefectReason("");
    setFactoryUnitNumber("");
    setPasteingStatus("");
    setPiningStatus("");
    setRsFor("");
    setKantan("");
    setKantanDeckal("");
    setFactoryDeliveryDate("");
    setWastedSheet("");
    setWastageReason("");
    setWastageMaterial(null);
    setWastageRole(null);
    setWastageStaff(null);
  };

  const handleCreateRework = () => {
    if (!reworkReason.trim()) {
      toast.error("A reason is required");
      return;
    }
    if (typeof id !== "string") return;
    dispatch(
      createReworkThunk({
        jobCardId: id,
        data: {
          reason: reworkReason,
          defectCategory: reworkDefectCategory?.value || undefined,
          quantity: reworkQuantity ? Number(reworkQuantity) : undefined,
          responsibleDepartment: reworkDepartment?.label || undefined,
          responsibleStaff: reworkStaff?.value || undefined,
          additionalMaterialNotes: reworkNotes || undefined,
          cost: reworkCost ? Number(reworkCost) : undefined,
        },
      })
    );
    setReworkDialogOpen(false);
    setReworkReason("");
    setReworkDefectCategory(null);
    setReworkQuantity("");
    setReworkDepartment(null);
    setReworkStaff(null);
    setReworkNotes("");
    setReworkCost("");
  };

  const handleReworkReject = () => {
    if (!rejectRemarks.trim()) {
      toast.error("A reason is required");
      return;
    }
    if (typeof id !== "string" || !rejectDialogFor) return;
    dispatch(rejectReworkThunk({ jobCardId: id, reworkId: rejectDialogFor, remarks: rejectRemarks }));
    setRejectDialogFor(null);
    setRejectRemarks("");
  };

  const handleRecordUsage = () => {
    if (!usageRole || !usageStaff || !usageMaterial || !usageQty || Number(usageQty) <= 0) {
      toast.error("Fill role, staff, material, and a positive quantity");
      return;
    }
    if (typeof id !== "string") return;
    dispatch(
      recordMaterialUsageThunk({
        id,
        data: {
          material: String(usageMaterial.value),
          quantityUsed: Number(usageQty),
          forRole: String(usageRole.value),
          forCompany: usageStaff.value,
        },
      })
    );
    setUsageMaterial(null);
    setUsageQty("");
  };

  const handleSaveLaborCost = () => {
    if (typeof id !== "string") return;
    dispatch(
      upsertLaborCostThunk({
        jobCardId: id,
        data: {
          laborCost: laborCostInput !== "" ? Number(laborCostInput) : undefined,
          overheadCost: overheadCostInput !== "" ? Number(overheadCostInput) : undefined,
          printingCost: printingCostInput !== "" ? Number(printingCostInput) : undefined,
          bindingCost: bindingCostInput !== "" ? Number(bindingCostInput) : undefined,
          finishingCost: finishingCostInput !== "" ? Number(finishingCostInput) : undefined,
          outsourcingCost: outsourcingCostInput !== "" ? Number(outsourcingCostInput) : undefined,
          deliveryCost: deliveryCostInput !== "" ? Number(deliveryCostInput) : undefined,
          notes: costingNotes || undefined,
        },
      })
    );
  };

  if (loading && !jc) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!jc) return null;

  const STAGES = stagesForCompany(jc.order?.companyName?.companyName);
  const activeStepIndex = jc.currentStage === "Done" ? STAGES.length : STAGES.indexOf(jc.currentStage);
  const sColor = statusColor[jc.status] || statusColor.Pending;

  return (
    <Box p={3}>
      <BackButton />
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {jc.jobCardNumber}
          </Typography>
          <ThemeChip label={jc.status} sx={{ background: sColor.bg, color: sColor.color, fontWeight: 600 }} />
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Build 5, sub-item 4 -- "Printer -> Return to Factory" module.
              No directly analogous existing Sakshi Creation flow was found
              after searching both repos for "return to factory"/"printer
              return" -- the generic Advance Stage panel below already lets
              any stage be selected out of sequence (advanceStage only
              checks the target stage is *in* this company's pipeline, not
              that it's next), so a Quality Packaging box job card at
              Printer could already be moved straight to Factory today.
              This button is a conservative, best-guess convenience layer
              on top of that: a single-purpose quick action (matching the
              existing "Assign To Printer ->"/"Assign to Binder ->" style
              buttons on Sakshi Creation's own per-stage pages) rather than
              a new workflow or backend endpoint. Flagged in the build
              report as best-guess and worth a user review. */}
          {jc.order?.companyName?.companyName === "Quality Packaging" &&
            jc.currentStage === "Printer" &&
            permissions?.edit && (
              <ThemeButton
                onClick={() => {
                  if (typeof id !== "string") return;
                  dispatch(
                    advanceJobCardStageThunk({
                      id,
                      data: { stage: "Factory", status: "Pending" },
                    })
                  );
                }}
              >
                Return to Factory
              </ThemeButton>
            )}
          <ThemeButton variant="outlined" onClick={() => router.push("/admin/job-card")}>
            Back to list
          </ThemeButton>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stepper activeStep={activeStepIndex} alternativeLabel={!isMobile} orientation={isMobile ? "vertical" : "horizontal"}>
          {STAGES.map((s) => (
            <Step key={s}>
              <StepLabel>{s}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Order" value={jc.order?.orderNumber} />
          <DetailRow label="Item" value={jc.productItem?.itemName} />
          <DetailRow label="Qty" value={jc.qty} />
          <DetailRow label="Priority" value={jc.priority} />
          <DetailRow label="Due Date" value={jc.dueDate ? new Date(jc.dueDate).toLocaleDateString() : "-"} />
          <DetailRow
            label="Assigned To"
            value={jc.assignedTo ? `${jc.assignedTo.firstName} ${jc.assignedTo.lastName}` : "-"}
          />
          <DetailRow label="Current Stage" value={jc.currentStage} />

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={600} mb={1}>
            Stage History
          </Typography>
          <Stack spacing={1}>
            {stageHistory.length === 0 && (
              <Typography fontSize={13} color="text.secondary">
                No stage activity yet.
              </Typography>
            )}
            {stageHistory.map((h) => (
              <Box key={h._id} sx={{ borderLeft: "2px solid #D0D5DD", pl: 1.5, py: 0.5 }}>
                <Typography fontSize={13} fontWeight={600}>
                  {h.stage} — {h.status}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {h.assignedTo ? `${h.assignedTo.firstName} ${h.assignedTo.lastName}` : "Unassigned"}
                  {h.completedAt ? ` · completed ${new Date(h.completedAt).toLocaleString()}` : ""}
                </Typography>
                {(h.completedQty != null || h.rejectedQty != null || h.reworkQty != null) && (
                  <Typography fontSize={12} color="text.secondary">
                    Completed: {h.completedQty ?? "-"} · Rejected: {h.rejectedQty ?? "-"} · Rework: {h.reworkQty ?? "-"}
                  </Typography>
                )}
                {h.qcResult && (
                  <Typography fontSize={12} fontWeight={600} color={h.qcResult === "Passed" ? "#027A48" : "#B42318"}>
                    QC: {h.qcResult}
                    {h.defectCategory ? ` — ${h.defectCategory}` : ""}
                    {h.defectReason ? ` (${h.defectReason})` : ""}
                  </Typography>
                )}
                {h.stage === "Factory" && (h.kantan || h.kantanDeckal || h.pasteingStatus || h.piningStatus || h.rsFor || h.unitNumber != null) && (
                  <Typography fontSize={12} color="text.secondary">
                    {h.unitNumber != null ? `Unit ${h.unitNumber} · ` : ""}
                    {h.pasteingStatus ? `Pasteing: ${h.pasteingStatus} · ` : ""}
                    {h.piningStatus ? `Pining: ${h.piningStatus} · ` : ""}
                    {h.rsFor ? `Rs For: ${h.rsFor} · ` : ""}
                    {h.kantan ? `Kantan: ${h.kantan}` : ""}
                    {h.kantanDeckal ? ` (Deckal: ${h.kantanDeckal})` : ""}
                    {h.factoryDeliveryDate ? ` · Delivery: ${new Date(h.factoryDeliveryDate).toLocaleDateString()}` : ""}
                  </Typography>
                )}
                {h.wastedSheet != null && (
                  <Typography fontSize={12} color="text.secondary">
                    Wasted sheets: {h.wastedSheet}
                    {h.wastageMaterial ? ` — ${h.wastageMaterial.materialName}` : ""}
                    {h.wastageReason ? ` (${h.wastageReason})` : ""}
                  </Typography>
                )}
                {h.machine && (
                  <Typography fontSize={12} color="text.secondary">
                    Machine: {h.machine.machineName} ({h.machine.machineCode})
                  </Typography>
                )}
                {h.remarks && (
                  <Typography fontSize={12} color="text.secondary">
                    {h.remarks}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={600} mb={1}>
            Suggested Routing
          </Typography>
          <Typography fontSize={12} color="text.secondary" mb={1}>
            Informational only -- stage progression above is unaffected.
          </Typography>
          {suggestedTemplate ? (
            <Box>
              <Typography fontSize={13} fontWeight={600}>
                {suggestedTemplate.templateName}
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                {(suggestedTemplate.stages || [])
                  .slice()
                  .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
                  .map((s: any) => s.processStage.stageName)
                  .join(" -> ") || "-"}
              </Typography>
            </Box>
          ) : (
            <Typography fontSize={13} color="text.secondary">
              No routing template configured for this item.
            </Typography>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Advance Stage
          </Typography>
          <Stack spacing={2}>
            <ThemeSelect
              label="Stage"
              options={STAGES.map((s) => ({ label: s, value: s }))}
              value={stage ? { label: stage, value: stage } : null}
              onChange={(_, v) => handleStageChange(v)}
              disabled={!permissions?.edit}
              required
            />
            <ThemeSelect
              label="Status"
              options={STAGE_STATUSES.map((s) => ({ label: s, value: s }))}
              value={stageStatus ? { label: stageStatus, value: stageStatus } : null}
              onChange={(_, v) => setStageStatus(v ? String(v.value) : "")}
              disabled={!permissions?.edit}
              required
            />
            {MACHINE_STAGES.includes(stage) && (
              <ThemeSelect
                label="Machine (optional)"
                options={machineOptions}
                value={selectedMachine}
                onChange={(_, v) => setSelectedMachine(v)}
                disabled={!permissions?.edit}
                placeholder={machineOptions.length ? "Select a machine" : `No ${stage} machines set up`}
              />
            )}
            <RoleStaffSelect
              label="Assign To"
              name="assignedTo"
              value={assignedTo}
              onChange={(_, v) => setAssignedTo(v)}
              roleFilter={stage}
              disabled={!permissions?.edit}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <ThemeInput
                labelName="Completed Qty"
                type="number"
                fullWidth
                value={completedQty}
                onChange={(e) => setCompletedQty(e.target.value)}
                disabled={!permissions?.edit}
              />
              <ThemeInput
                labelName="Rejected Qty"
                type="number"
                fullWidth
                value={rejectedQty}
                onChange={(e) => setRejectedQty(e.target.value)}
                disabled={!permissions?.edit}
              />
              <ThemeInput
                labelName="Rework Qty"
                type="number"
                fullWidth
                value={reworkQty}
                onChange={(e) => setReworkQty(e.target.value)}
                disabled={!permissions?.edit}
              />
            </Stack>

            {stage === "QC" && (
              <>
                <Typography fontSize={12} color="text.secondary" mt={-1}>
                  QC is advisory: a Failed result is recorded here but does not block the card from moving to
                  Delivery.
                </Typography>
                <ThemeSelect
                  label="QC Result"
                  options={[
                    { label: "Passed", value: "Passed" },
                    { label: "Failed", value: "Failed" },
                  ]}
                  value={qcResult}
                  onChange={(_, v) => setQcResult(v)}
                  disabled={!permissions?.edit}
                />
                {qcResult?.value === "Failed" && (
                  <>
                    <ThemeSelect
                      label="Defect Category"
                      options={DEFECT_CATEGORIES.map((c) => ({ label: c, value: c }))}
                      value={defectCategory}
                      onChange={(_, v) => setDefectCategory(v)}
                      disabled={!permissions?.edit}
                    />
                    <ThemeInput
                      labelName="Defect Reason"
                      fullWidth
                      value={defectReason}
                      onChange={(e) => setDefectReason(e.target.value)}
                      disabled={!permissions?.edit}
                    />
                  </>
                )}
              </>
            )}

            {stage === "Factory" && (
              <>
                <Typography fontSize={12} color="text.secondary" mt={-1}>
                  QP box-manufacturing Figma audit (2026-08-25): this is the Order-In screen's Factory checklist
                  (Unit / Pasteing / Pining / Rs For / Kantan / Kantan Deckal / Delivery Date). No formula backs
                  Kantan anywhere in the design either -- these are plain manual fields, recorded the same way
                  staff already write them down.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <ThemeInput
                    labelName="Unit"
                    type="number"
                    fullWidth
                    value={factoryUnitNumber}
                    onChange={(e) => setFactoryUnitNumber(e.target.value)}
                    disabled={!permissions?.edit}
                  />
                  <ThemeInput
                    labelName="Delivery Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={factoryDeliveryDate}
                    onChange={(e) => setFactoryDeliveryDate(e.target.value)}
                    disabled={!permissions?.edit}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <ThemeInput
                    labelName="Pasteing"
                    fullWidth
                    value={pasteingStatus}
                    onChange={(e) => setPasteingStatus(e.target.value)}
                    disabled={!permissions?.edit}
                  />
                  <ThemeInput
                    labelName="Pining"
                    fullWidth
                    value={piningStatus}
                    onChange={(e) => setPiningStatus(e.target.value)}
                    disabled={!permissions?.edit}
                  />
                </Stack>
                <ThemeInput
                  labelName="Rs For"
                  fullWidth
                  value={rsFor}
                  onChange={(e) => setRsFor(e.target.value)}
                  disabled={!permissions?.edit}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <ThemeInput
                    labelName="Kantan"
                    fullWidth
                    value={kantan}
                    onChange={(e) => setKantan(e.target.value)}
                    disabled={!permissions?.edit}
                  />
                  <ThemeInput
                    labelName="Kantan Deckal"
                    fullWidth
                    value={kantanDeckal}
                    onChange={(e) => setKantanDeckal(e.target.value)}
                    disabled={!permissions?.edit}
                  />
                </Stack>
              </>
            )}

            {NON_MATERIAL_STAGES.includes(stage) && (
              <Typography fontSize={12} color="text.secondary" mt={-1}>
                {stage} isn't a material-consuming stage -- leave this at 0 unless something genuinely was used or
                spoiled here.
              </Typography>
            )}
            <ThemeInput
              labelName="Wasted Sheets"
              type="number"
              fullWidth
              value={wastedSheet}
              onChange={(e) => setWastedSheet(e.target.value)}
              disabled={!permissions?.edit}
            />
            {Number(wastedSheet) > 0 && (
              <>
                <Typography fontSize={12} color="text.secondary" mt={-1}>
                  Recording wastage writes a real inventory movement, so it needs the material and who's
                  responsible.
                </Typography>
                <ThemeSelect
                  label="Wasted Material"
                  options={materialOptions}
                  value={wastageMaterial}
                  onChange={(_, v) => setWastageMaterial(v)}
                  disabled={!permissions?.edit}
                  required
                />
                <ThemeSelect
                  label="Wastage Role"
                  options={roleOptions}
                  value={wastageRole}
                  onChange={(_, v) => {
                    setWastageRole(v);
                    setWastageStaff(null);
                  }}
                  disabled={!permissions?.edit}
                  required
                />
                <RoleStaffSelect
                  label="Wastage Staff Member"
                  name="wastageStaff"
                  value={wastageStaff}
                  onChange={(_, v) => setWastageStaff(v)}
                  roleFilter={wastageRole?.label || ""}
                  disabled={!permissions?.edit || !wastageRole}
                  required
                />
                <ThemeInput
                  labelName="Wastage Reason"
                  fullWidth
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value)}
                  disabled={!permissions?.edit}
                />
              </>
            )}

            <ThemeInput
              labelName="Remarks"
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!permissions?.edit}
            />
            {permissions?.edit && (
              <ThemeButton onClick={handleAdvanceStage} disabled={loading} sx={{ background: "#175CD3" }}>
                Update Stage
              </ThemeButton>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={600} mb={2}>
            Record Material Usage
          </Typography>
          <Typography fontSize={12} color="text.secondary" mb={1}>
            Recording usage writes a real outward inventory entry against this material.
            {NON_MATERIAL_STAGES.includes(stage) && ` ${stage} isn't a material-consuming stage -- only fill this in if something was genuinely used here.`}
          </Typography>
          <Stack spacing={2}>
            <ThemeSelect
              label="Role"
              options={roleOptions}
              value={usageRole}
              onChange={(_, v) => {
                setUsageRole(v);
                setUsageStaff(null);
              }}
              required
              disabled={!permissions?.edit}
            />
            <RoleStaffSelect
              label="Staff Member"
              name="usageStaff"
              value={usageStaff}
              onChange={(_, v) => setUsageStaff(v)}
              roleFilter={usageRole?.label || ""}
              disabled={!permissions?.edit || !usageRole}
              required
            />
            <ThemeSelect
              label="Material"
              options={materialOptions}
              value={usageMaterial}
              onChange={(_, v) => setUsageMaterial(v)}
              required
              disabled={!permissions?.edit}
            />
            <ThemeInput
              labelName="Quantity Used"
              type="number"
              fullWidth
              value={usageQty}
              onChange={(e) => setUsageQty(e.target.value)}
              disabled={!permissions?.edit}
              required
            />
            {permissions?.edit && (
              <ThemeButton onClick={handleRecordUsage} disabled={loading} sx={{ background: "#12B76A" }}>
                Record Usage
              </ThemeButton>
            )}
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
          <Typography fontWeight={600}>Rework</Typography>
          {reworkPermissions?.create && (
            <ThemeButton onClick={() => setReworkDialogOpen(true)} sx={{ background: "#175CD3" }}>
              New Rework
            </ThemeButton>
          )}
        </Box>
        {reworkLoading && reworks.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={22} />
          </Box>
        ) : reworks.length === 0 ? (
          <Typography fontSize={13} color="text.secondary">
            No rework records for this job card.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {reworks.map((r) => {
              const rc = reworkStatusColor[r.status] || reworkStatusColor.Pending;
              return (
                <Box key={r._id} sx={{ border: "1px solid #F2F4F7", borderRadius: 1.5, p: 1.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box>
                      <Typography fontSize={14} fontWeight={600}>
                        {r.reason}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {r.defectCategory ? `${r.defectCategory} · ` : ""}
                        {r.jobCardStage ? `${r.jobCardStage.stage} stage · ` : ""}
                        {r.quantity != null ? `Qty ${r.quantity} · ` : ""}
                        {r.responsibleDepartment || "Unassigned department"}
                        {r.responsibleStaff ? ` (${r.responsibleStaff.firstName} ${r.responsibleStaff.lastName})` : ""}
                      </Typography>
                      {r.additionalMaterialNotes && (
                        <Typography fontSize={12} color="text.secondary">
                          {r.additionalMaterialNotes}
                        </Typography>
                      )}
                      {r.cost != null && (
                        <Typography fontSize={12} color="text.secondary">
                          Cost: {r.cost}
                        </Typography>
                      )}
                      {r.approvedBy && (
                        <Typography fontSize={12} color="text.secondary">
                          Approved by {r.approvedBy.firstName} {r.approvedBy.lastName}
                          {r.approvedAt ? ` · ${new Date(r.approvedAt).toLocaleString()}` : ""}
                        </Typography>
                      )}
                    </Box>
                    <ThemeChip label={r.status} sx={{ background: rc.bg, color: rc.color, fontWeight: 600, flexShrink: 0 }} />
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1.5}>
                    {r.status === "Pending" && reworkPermissions?.edit && (
                      <ThemeButton
                        size="small"
                        onClick={() => typeof id === "string" && dispatch(startReworkThunk({ jobCardId: id, reworkId: r._id }))}
                        sx={{ background: "#175CD3" }}
                      >
                        Start
                      </ThemeButton>
                    )}
                    {r.status === "In Progress" && reworkPermissions?.edit && (
                      <ThemeButton
                        size="small"
                        onClick={() => typeof id === "string" && dispatch(submitReworkForApprovalThunk({ jobCardId: id, reworkId: r._id }))}
                        sx={{ background: "#175CD3" }}
                      >
                        Submit for Approval
                      </ThemeButton>
                    )}
                    {r.status === "Pending Approval" && reworkPermissions?.approve && (
                      <>
                        <ThemeButton
                          size="small"
                          onClick={() => typeof id === "string" && dispatch(approveReworkThunk({ jobCardId: id, reworkId: r._id }))}
                          sx={{ background: "#12B76A" }}
                        >
                          Approve
                        </ThemeButton>
                        <ThemeButton
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                          onClick={() => setRejectDialogFor(r._id)}
                        >
                          Reject
                        </ThemeButton>
                      </>
                    )}
                    {r.status === "Rejected" && reworkPermissions?.edit && (
                      <ThemeButton
                        size="small"
                        onClick={() => typeof id === "string" && dispatch(startReworkThunk({ jobCardId: id, reworkId: r._id }))}
                        sx={{ background: "#175CD3" }}
                      >
                        Restart
                      </ThemeButton>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
        <Typography fontWeight={600} mb={2}>
          Costing
        </Typography>
        {costingLoading && !costing ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={22} />
          </Box>
        ) : costing ? (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box flex={1}>
              <DetailRow
                label="Material Cost"
                value={costing.hasFullMaterialRateData || costing.materialCost > 0 ? costing.materialCost : "No purchase rate data yet"}
              />
              <DetailRow label="Labor Cost" value={costing.laborCost} />
              <DetailRow label="Overhead Cost" value={costing.overheadCost} />
              <DetailRow label="Printing Cost" value={costing.printingCost} />
              <DetailRow label="Binding Cost" value={costing.bindingCost} />
              <DetailRow label="Finishing Cost" value={costing.finishingCost} />
              <DetailRow label="Outsourcing Cost" value={costing.outsourcingCost} />
              <DetailRow label="Delivery Cost" value={costing.deliveryCost} />
              <DetailRow label="Total Cost" value={costing.totalCost} />
              <DetailRow label="Estimated Cost (Quotation)" value={costing.estimatedCost !== null ? costing.estimatedCost : "No linked quotation"} />
              {costing.costVariance !== null && (
                <DetailRow
                  label="Cost Variance"
                  value={
                    <Typography component="span" fontSize={14} fontWeight={600} color={costing.costVariance <= 0 ? "#027A48" : "#B42318"}>
                      {costing.costVariance > 0 ? `+${costing.costVariance} over` : `${Math.abs(costing.costVariance)} under`}
                    </Typography>
                  }
                />
              )}
              <DetailRow label="Revenue" value={costing.revenue} />
              <DetailRow
                label="Profit"
                value={
                  <Typography component="span" fontSize={14} fontWeight={600} color={costing.profit >= 0 ? "#027A48" : "#B42318"}>
                    {costing.profit}
                  </Typography>
                }
              />
              <DetailRow label="Margin" value={costing.marginPct !== null ? `${costing.marginPct}%` : "-"} />
              {!costing.hasFullMaterialRateData && costing.materialCost === 0 && (
                <Typography fontSize={12} color="text.secondary" mt={1}>
                  Revenue is computed from invoices raised against this job card&apos;s order. Cost is computed live
                  from current material purchase rates plus the labor/overhead entered here -- it isn&apos;t a saved
                  snapshot, so it reflects today&apos;s rates even for an older job.
                </Typography>
              )}
            </Box>
            <Box flex={1}>
              <Typography fontSize={13} fontWeight={600} mb={1}>
                Cost Buckets
              </Typography>
              <Typography fontSize={12} color="text.secondary" mb={1}>
                No wage/rate data exists in the system, so every bucket below is entered manually per job card.
              </Typography>
              <Stack spacing={2}>
                <ThemeInput
                  labelName="Labor Cost"
                  type="number"
                  fullWidth
                  value={laborCostInput}
                  onChange={(e) => setLaborCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Overhead Cost"
                  type="number"
                  fullWidth
                  value={overheadCostInput}
                  onChange={(e) => setOverheadCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Printing Cost"
                  type="number"
                  fullWidth
                  value={printingCostInput}
                  onChange={(e) => setPrintingCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Binding Cost"
                  type="number"
                  fullWidth
                  value={bindingCostInput}
                  onChange={(e) => setBindingCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Finishing Cost"
                  type="number"
                  fullWidth
                  value={finishingCostInput}
                  onChange={(e) => setFinishingCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Outsourcing Cost"
                  type="number"
                  fullWidth
                  value={outsourcingCostInput}
                  onChange={(e) => setOutsourcingCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Delivery Cost"
                  type="number"
                  fullWidth
                  value={deliveryCostInput}
                  onChange={(e) => setDeliveryCostInput(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                <ThemeInput
                  labelName="Notes"
                  fullWidth
                  multiline
                  minRows={2}
                  value={costingNotes}
                  onChange={(e) => setCostingNotes(e.target.value)}
                  disabled={!costingPermissions?.edit}
                />
                {costingPermissions?.edit && (
                  <ThemeButton onClick={handleSaveLaborCost} disabled={costingLoading} sx={{ background: "#175CD3" }}>
                    Save Cost Buckets
                  </ThemeButton>
                )}
              </Stack>
            </Box>
          </Stack>
        ) : (
          <Typography fontSize={13} color="text.secondary">
            Costing data isn&apos;t available for this job card yet.
          </Typography>
        )}
      </Paper>

      <CustomDialog open={reworkDialogOpen} onClose={() => setReworkDialogOpen(false)} title="New Rework Record" maxWidth="xs">
        <Stack spacing={2} mt={1}>
          <ThemeInput
            labelName="Reason"
            fullWidth
            required
            multiline
            minRows={2}
            value={reworkReason}
            onChange={(e) => setReworkReason(e.target.value)}
          />
          <ThemeSelect
            label="Defect Category"
            options={DEFECT_CATEGORIES.map((c) => ({ label: c, value: c }))}
            value={reworkDefectCategory}
            onChange={(_, v) => setReworkDefectCategory(v)}
          />
          <ThemeInput
            labelName="Quantity"
            type="number"
            fullWidth
            value={reworkQuantity}
            onChange={(e) => setReworkQuantity(e.target.value)}
          />
          <ThemeSelect
            label="Responsible Department"
            options={roleOptions}
            value={reworkDepartment}
            onChange={(_, v) => {
              setReworkDepartment(v);
              setReworkStaff(null);
            }}
          />
          <RoleStaffSelect
            label="Responsible Staff"
            name="reworkStaff"
            value={reworkStaff}
            onChange={(_, v) => setReworkStaff(v)}
            roleFilter={reworkDepartment?.label || ""}
            disabled={!reworkDepartment}
          />
          <ThemeInput
            labelName="Additional Material Notes"
            fullWidth
            value={reworkNotes}
            onChange={(e) => setReworkNotes(e.target.value)}
          />
          <ThemeInput labelName="Cost" type="number" fullWidth value={reworkCost} onChange={(e) => setReworkCost(e.target.value)} />
        </Stack>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <ThemeButton variant="outlined" onClick={() => setReworkDialogOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton onClick={handleCreateRework} sx={{ background: "#175CD3" }}>
            Create
          </ThemeButton>
        </Box>
      </CustomDialog>

      <CustomDialog open={!!rejectDialogFor} onClose={() => setRejectDialogFor(null)} title="Reject Rework" maxWidth="xs">
        <ThemeInput
          labelName="Reason"
          fullWidth
          required
          multiline
          minRows={3}
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton variant="outlined" onClick={() => setRejectDialogFor(null)}>
            Cancel
          </ThemeButton>
          <ThemeButton sx={{ background: "#D92D20" }} onClick={handleReworkReject}>
            Confirm Reject
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default JobCardDetailPage;
