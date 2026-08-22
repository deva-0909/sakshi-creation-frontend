import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider, Stepper, Step, StepLabel } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllRolesThunk } from "@/store/slices/roleSlice";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { getAllMachinesThunk } from "@/store/slices/machineSlice";
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
import { toast } from "react-toastify";

const STAGES = ["Designer", "Printer", "Binder", "Booklet Binder", "Delivery"];
const STAGE_STATUSES = ["Pending", "In Progress", "Done"];
// Only these 3 stages run on physical equipment -- see machine.validator.js's
// category enum, which the backend also uses to reject a mismatched machine.
const MACHINE_STAGES = ["Printer", "Binder", "Booklet Binder"];

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
  const { id } = router.query;
  const { singleJobCard: jc, stageHistory, loading, error, successMessage } = useAppSelector((state) => state.jobCards);
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

  const permissions = user?.role?.permissions?.jobcard;
  const costingPermissions = user?.role?.permissions?.costing;

  // Advance-stage form state
  const [stage, setStage] = useState("");
  const [stageStatus, setStageStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [wastedSheet, setWastedSheet] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<{ label: string; value: string | number } | null>(null);

  // Material usage form state
  const [usageRole, setUsageRole] = useState<{ label: string; value: string | number } | null>(null);
  const [usageStaff, setUsageStaff] = useState<any>(null);
  const [usageMaterial, setUsageMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [usageQty, setUsageQty] = useState("");

  // Labor/overhead entry form -- no wage/rate data exists anywhere in the
  // system, so this is recorded by hand per job card (see the design plan).
  const [laborCostInput, setLaborCostInput] = useState("");
  const [overheadCostInput, setOverheadCostInput] = useState("");
  const [costingNotes, setCostingNotes] = useState("");

  useEffect(() => {
    if (typeof id === "string") {
      dispatch(getJobCardByIdThunk(id));
      dispatch(getJobCardStageHistoryThunk(id));
      dispatch(getCostingByJobCardThunk(id));
    }
    dispatch(getAllRolesThunk());
    dispatch(getAllMaterialsThunk());
    dispatch(getAllMachinesThunk(undefined));
    return () => {
      dispatch(clearSingleJobCard());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (jc) {
      setStage(jc.currentStage === "Done" ? STAGES[STAGES.length - 1] : jc.currentStage);
    }
  }, [jc]);

  useEffect(() => {
    if (costing) {
      setLaborCostInput(String(costing.laborCost ?? ""));
      setOverheadCostInput(String(costing.overheadCost ?? ""));
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
  };

  const handleAdvanceStage = () => {
    if (!stage || !stageStatus) {
      toast.error("Select a stage and status");
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
          wastedSheet: wastedSheet ? Number(wastedSheet) : undefined,
          machine: selectedMachine ? String(selectedMachine.value) : undefined,
        },
      })
    );
    setStageStatus("");
    setRemarks("");
    setWastedSheet("");
    setSelectedMachine(null);
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

  const activeStepIndex = jc.currentStage === "Done" ? STAGES.length : STAGES.indexOf(jc.currentStage);
  const sColor = statusColor[jc.status] || statusColor.Pending;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {jc.jobCardNumber}
          </Typography>
          <ThemeChip label={jc.status} sx={{ background: sColor.bg, color: sColor.color, fontWeight: 600 }} />
        </Box>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/job-card")}>
          Back to list
        </ThemeButton>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stepper activeStep={activeStepIndex} alternativeLabel>
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
                {h.wastedSheet != null && (
                  <Typography fontSize={12} color="text.secondary">
                    Wasted sheets: {h.wastedSheet}
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
            <ThemeInput
              labelName="Wasted Sheets"
              type="number"
              fullWidth
              value={wastedSheet}
              onChange={(e) => setWastedSheet(e.target.value)}
              disabled={!permissions?.edit}
            />
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
              <DetailRow label="Total Cost" value={costing.totalCost} />
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
                Labor / Overhead
              </Typography>
              <Typography fontSize={12} color="text.secondary" mb={1}>
                No wage/rate data exists in the system, so labor and overhead are entered manually per job card.
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
                    Save Labor / Overhead
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
    </Box>
  );
};

export default JobCardDetailPage;
