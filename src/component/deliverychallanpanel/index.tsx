"use client";
import { useEffect, useState } from "react";
import { Box, Typography, Stack, Divider, CircularProgress } from "@mui/material";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createDeliveryChallanThunk,
  getAllDeliveryChallansThunk,
  recordDeliveryChallanPodThunk,
  cancelDeliveryChallanThunk,
  clearDeliveryChallanError,
  clearDeliveryChallanSuccessMessage,
} from "@/store/slices/deliveryChallanSlice";
import { deliveryChallanService, DeliveryChallan } from "@/services/deliveryChallan.service";
import { fileUploadService } from "@/services/fileUpload.service";
import { toast } from "react-toastify";

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Dispatched":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Delivered":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

const StatusPill = ({ status }: { status: string }) => {
  const { bg, color } = statusColor(status);
  return (
    <Typography
      component="span"
      fontSize={12}
      fontWeight={700}
      px={1.2}
      py={0.4}
      borderRadius={999}
      sx={{ background: bg, color, display: "inline-block" }}
    >
      {status}
    </Typography>
  );
};

const VEHICLE_TYPES = ["Truck", "Tempo", "Mini Van", "Two Wheeler", "Other"];

interface DeliveryChallanPanelProps {
  orderId: string;
  orderQty: number;
}

const DeliveryChallanPanel: React.FC<DeliveryChallanPanelProps> = ({ orderId, orderQty }) => {
  const dispatch = useAppDispatch();
  const { deliveryChallans, loading, error, successMessage } = useAppSelector((state) => state.deliveryChallans);

  const [form, setForm] = useState({
    quantityDelivered: "",
    vehicleNumber: "",
    vehicleType: null as { label: string; value: string | number } | null,
    driverName: "",
    driverContact: "",
    packageCount: "",
    packageWeight: "",
    deliveryDate: "",
    notes: "",
  });

  const [podDialogChallan, setPodDialogChallan] = useState<DeliveryChallan | null>(null);
  const [podForm, setPodForm] = useState({ podReceivedBy: "", podDesignation: "", podNotes: "" });
  const [podFile, setPodFile] = useState<File | null>(null);
  const [podSubmitting, setPodSubmitting] = useState(false);

  const [cancelDialogChallan, setCancelDialogChallan] = useState<DeliveryChallan | null>(null);
  const [cancelRemarks, setCancelRemarks] = useState("");

  useEffect(() => {
    if (orderId) dispatch(getAllDeliveryChallansThunk({ orderId }));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearDeliveryChallanSuccessMessage());
      dispatch(getAllDeliveryChallansThunk({ orderId }));
    }
    if (error) {
      toast.error(error);
      dispatch(clearDeliveryChallanError());
    }
  }, [successMessage, error, dispatch, orderId]);

  const activeChallans = deliveryChallans.filter((c) => c.status !== "Cancelled");
  const alreadyDelivered = activeChallans.reduce((sum, c) => sum + (c.quantityDelivered || 0), 0);
  const remaining = Math.max(orderQty - alreadyDelivered, 0);

  const resetForm = () =>
    setForm({
      quantityDelivered: "",
      vehicleNumber: "",
      vehicleType: null,
      driverName: "",
      driverContact: "",
      packageCount: "",
      packageWeight: "",
      deliveryDate: "",
      notes: "",
    });

  const handleCreateChallan = async () => {
    const qty = Number(form.quantityDelivered);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (qty > remaining) {
      toast.error(`Quantity exceeds remaining deliverable quantity (${remaining})`);
      return;
    }
    await dispatch(
      createDeliveryChallanThunk({
        orderId,
        quantityDelivered: qty,
        vehicleNumber: form.vehicleNumber || undefined,
        vehicleType: form.vehicleType?.value !== undefined ? String(form.vehicleType.value) : undefined,
        driverName: form.driverName || undefined,
        driverContact: form.driverContact || undefined,
        packageCount: form.packageCount ? Number(form.packageCount) : undefined,
        packageWeight: form.packageWeight ? Number(form.packageWeight) : undefined,
        deliveryDate: form.deliveryDate || undefined,
        notes: form.notes || undefined,
      })
    );
    resetForm();
  };

  const openPodDialog = (challan: DeliveryChallan) => {
    setPodDialogChallan(challan);
    setPodForm({ podReceivedBy: "", podDesignation: "", podNotes: "" });
    setPodFile(null);
  };

  const handleRecordPod = async () => {
    if (!podDialogChallan) return;
    if (!podForm.podReceivedBy.trim()) {
      toast.error("Receiver name is required");
      return;
    }
    setPodSubmitting(true);
    try {
      let podSignatureUrl: string | undefined;
      if (podFile) {
        const uploadRes = await fileUploadService.uploadSingleFile(podFile, "delivery-pod");
        if (uploadRes.success && uploadRes.data) {
          podSignatureUrl = uploadRes.data.url || uploadRes.data.path;
        } else {
          toast.error(uploadRes.message || "Failed to upload signature/photo");
        }
      }
      await dispatch(
        recordDeliveryChallanPodThunk({
          id: podDialogChallan._id,
          podReceivedBy: podForm.podReceivedBy,
          podDesignation: podForm.podDesignation || undefined,
          podNotes: podForm.podNotes || undefined,
          podSignatureUrl,
        })
      ).unwrap();
      setPodDialogChallan(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record proof of delivery");
    } finally {
      setPodSubmitting(false);
    }
  };

  const handleCancelChallan = async () => {
    if (!cancelDialogChallan) return;
    if (!cancelRemarks.trim()) {
      toast.error("Enter a reason for cancellation");
      return;
    }
    await dispatch(cancelDeliveryChallanThunk({ id: cancelDialogChallan._id, remarks: cancelRemarks }));
    setCancelDialogChallan(null);
    setCancelRemarks("");
  };

  const handleDownloadPdf = async (challan: DeliveryChallan) => {
    try {
      const blob = await deliveryChallanService.getDeliveryChallanPdf(challan._id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to download delivery challan PDF");
    }
  };

  return (
    <Box mt={2} border="2px solid #12B76A" borderRadius={2} p={2} bgcolor="#fff">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontWeight={600} fontSize={16}>
          Delivery Challans
        </Typography>
        <Typography fontSize={13} color="#667085">
          Delivered {alreadyDelivered} of {orderQty} &middot; Remaining {remaining}
        </Typography>
      </Box>

      {loading && deliveryChallans.length === 0 ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : deliveryChallans.length > 0 ? (
        <Stack spacing={1.5} mb={2}>
          {deliveryChallans.map((c) => (
            <Box key={c._id} border="1px solid #EAECF0" borderRadius={2} p={1.5}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography fontWeight={600} fontSize={14}>
                    {c.challanNumber}
                  </Typography>
                  <StatusPill status={c.status} />
                </Box>
                <Stack direction="row" spacing={1}>
                  {c.status === "Dispatched" && (
                    <>
                      <ThemeButton variant="outlined" size="small" onClick={() => openPodDialog(c)}>
                        Record POD
                      </ThemeButton>
                      <ThemeButton
                        variant="outlined"
                        size="small"
                        sx={{ color: "#B42318", borderColor: "#FDA29B" }}
                        onClick={() => setCancelDialogChallan(c)}
                      >
                        Cancel
                      </ThemeButton>
                    </>
                  )}
                  <ThemeButton variant="outlined" size="small" onClick={() => handleDownloadPdf(c)}>
                    Download PDF
                  </ThemeButton>
                </Stack>
              </Box>
              <Stack direction="row" spacing={3} mt={1} flexWrap="wrap">
                <Typography fontSize={13} color="#667085">
                  Qty: <b>{c.quantityDelivered}</b>
                </Typography>
                {c.vehicleNumber && (
                  <Typography fontSize={13} color="#667085">
                    Vehicle: {c.vehicleNumber} {c.vehicleType ? `(${c.vehicleType})` : ""}
                  </Typography>
                )}
                {c.driverName && (
                  <Typography fontSize={13} color="#667085">
                    Driver: {c.driverName} {c.driverContact ? `(${c.driverContact})` : ""}
                  </Typography>
                )}
                {c.deliveryDate && (
                  <Typography fontSize={13} color="#667085">
                    Date: {new Date(c.deliveryDate).toLocaleDateString()}
                  </Typography>
                )}
                {c.status === "Delivered" && c.podReceivedBy && (
                  <Typography fontSize={13} color="#027A48">
                    Received by: {c.podReceivedBy} {c.podDesignation ? `(${c.podDesignation})` : ""}
                  </Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography fontSize={13} color="#667085" mb={2}>
          No delivery challans created yet.
        </Typography>
      )}

      <Divider sx={{ mb: 2 }} />

      {remaining > 0 ? (
        <>
          <Typography fontWeight={600} fontSize={14} mb={1.5}>
            Create Challan
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <ThemeInput
                labelName={`Quantity (max ${remaining})`}
                type="number"
                fullWidth
                value={form.quantityDelivered}
                onChange={(e: any) => setForm((f) => ({ ...f, quantityDelivered: e.target.value }))}
              />
              <ThemeInput
                labelName="Vehicle Number"
                fullWidth
                value={form.vehicleNumber}
                onChange={(e: any) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
              />
              <ThemeSelect
                label="Vehicle Type"
                options={VEHICLE_TYPES.map((v) => ({ label: v, value: v }))}
                value={form.vehicleType}
                onChange={(_, val) => setForm((f) => ({ ...f, vehicleType: val }))}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <ThemeInput
                labelName="Driver Name"
                fullWidth
                value={form.driverName}
                onChange={(e: any) => setForm((f) => ({ ...f, driverName: e.target.value }))}
              />
              <ThemeInput
                labelName="Driver Contact"
                fullWidth
                value={form.driverContact}
                onChange={(e: any) => setForm((f) => ({ ...f, driverContact: e.target.value }))}
              />
              <ThemeInput
                labelName="Delivery Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.deliveryDate}
                onChange={(e: any) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <ThemeInput
                labelName="Package Count"
                type="number"
                fullWidth
                value={form.packageCount}
                onChange={(e: any) => setForm((f) => ({ ...f, packageCount: e.target.value }))}
              />
              <ThemeInput
                labelName="Package Weight (kg)"
                type="number"
                fullWidth
                value={form.packageWeight}
                onChange={(e: any) => setForm((f) => ({ ...f, packageWeight: e.target.value }))}
              />
            </Stack>
            <ThemeInput
              labelName="Notes"
              placeholder="Optional notes"
              multiline
              rows={2}
              fullWidth
              value={form.notes}
              onChange={(e: any) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <ThemeButton
              sx={{ background: "#12B76A", color: "#fff", fontWeight: 600, "&:hover": { background: "#079455" } }}
              onClick={handleCreateChallan}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Challan"}
            </ThemeButton>
          </Stack>
        </>
      ) : (
        <Typography fontSize={13} color="#027A48" fontWeight={600}>
          Full order quantity has been delivered.
        </Typography>
      )}

      {/* Record POD dialog */}
      <CustomDialog open={!!podDialogChallan} onClose={() => setPodDialogChallan(null)} title="Record Proof of Delivery">
        <Stack spacing={2} mt={1}>
          <ThemeInput
            labelName="Received By"
            required
            fullWidth
            value={podForm.podReceivedBy}
            onChange={(e: any) => setPodForm((f) => ({ ...f, podReceivedBy: e.target.value }))}
          />
          <ThemeInput
            labelName="Designation"
            fullWidth
            value={podForm.podDesignation}
            onChange={(e: any) => setPodForm((f) => ({ ...f, podDesignation: e.target.value }))}
          />
          <ThemeInput
            labelName="Notes"
            multiline
            rows={2}
            fullWidth
            value={podForm.podNotes}
            onChange={(e: any) => setPodForm((f) => ({ ...f, podNotes: e.target.value }))}
          />
          <Box>
            <Typography fontWeight={700} fontSize={14} color="#344054" mb={0.5}>
              Signature / Photo (optional)
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPodFile(e.target.files?.[0] || null)}
            />
          </Box>
          <ThemeButton
            sx={{ background: "#12B76A", color: "#fff", fontWeight: 600, "&:hover": { background: "#079455" } }}
            onClick={handleRecordPod}
            disabled={podSubmitting}
          >
            {podSubmitting ? "Saving..." : "Save Proof of Delivery"}
          </ThemeButton>
        </Stack>
      </CustomDialog>

      {/* Cancel challan dialog */}
      <CustomDialog open={!!cancelDialogChallan} onClose={() => setCancelDialogChallan(null)} title="Cancel Delivery Challan">
        <Stack spacing={2} mt={1}>
          <ThemeInput
            labelName="Reason"
            required
            multiline
            rows={2}
            fullWidth
            value={cancelRemarks}
            onChange={(e: any) => setCancelRemarks(e.target.value)}
          />
          <ThemeButton
            sx={{ background: "#B42318", color: "#fff", fontWeight: 600, "&:hover": { background: "#912018" } }}
            onClick={handleCancelChallan}
            disabled={loading}
          >
            Confirm Cancellation
          </ThemeButton>
        </Stack>
      </CustomDialog>
    </Box>
  );
};

export default DeliveryChallanPanel;
