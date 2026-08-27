import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell, Chip } from "@mui/material";
import { Add, Edit, Delete, CheckCircle } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllRolesThunk } from "@/store/slices/roleSlice";
import {
  getAllComplaintsThunk,
  createComplaintThunk,
  updateComplaintThunk,
  deleteComplaintThunk,
  clearComplaintError,
  clearComplaintSuccessMessage,
} from "@/store/slices/complaintSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Two-company Phase 3 Part A (claude/two-company-gap-analysis.md): the "All
// Complains" nav item from the Figma reference's Quality Packaging dashboard.
// Party/Order linkage is exposed on the API but deliberately left out of this
// first-cut UI -- see the design note in complaint.controller.js and the
// Dye/Punch page's same Party-selection deferral.
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "info"> = {
  Open: "warning",
  "In Progress": "info",
  Resolved: "success",
  Closed: "default",
};

const PRIORITY_COLORS: Record<string, "default" | "warning" | "error" | "info"> = {
  Low: "default",
  Normal: "info",
  High: "warning",
  Urgent: "error",
};

interface ComplaintForm {
  subject: string;
  description: string;
  priority: string;
  status: string;
  companyName: { label: string; value: string } | null;
  party: { label: string; value: string } | null;
  assignedRole: { label: string; value: string | number } | null;
  assignedTo: { label: string; value: string | number } | null;
  resolutionNotes: string;
}

const emptyForm: ComplaintForm = {
  subject: "",
  description: "",
  priority: "Normal",
  status: "Open",
  companyName: null,
  party: null,
  assignedRole: null,
  assignedTo: null,
  resolutionNotes: "",
};

// Full Figma slide scan Phase 1 (claude/full-figma-slide-scan.md, Theme 8):
// added Complain Date, Party, Resolve Description, and Resolved Date --
// all data the backend already carried (createdAt/party_id/
// resolution_notes existed from Phase 3 Part A; resolved_at is new, see
// complaint.controller.js).
const columns = [
  { id: "id", label: "ID" },
  { id: "complaintNumber", label: "Complaint No." },
  { id: "complainDate", label: "Complain Date" },
  { id: "subject", label: "Subject" },
  { id: "party", label: "Party" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
  { id: "assignedTo", label: "Assigned To" },
  { id: "companyName", label: "Company" },
  { id: "resolutionNotes", label: "Resolve Description" },
  { id: "resolvedAt", label: "Resolved Date" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "complaintNumber", label: "Complaint No.", value: (row: any) => row.complaintNumber },
  { id: "complainDate", label: "Complain Date", value: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-") },
  { id: "subject", label: "Subject", value: (row: any) => row.subject },
  { id: "party", label: "Party", value: (row: any) => row.party?.partyName || "-" },
  { id: "priority", label: "Priority", value: (row: any) => row.priority },
  { id: "status", label: "Status", value: (row: any) => row.status },
  {
    id: "assignedTo",
    label: "Assigned To",
    value: (row: any) => (row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : "-"),
  },
  { id: "companyName", label: "Company", value: (row: any) => row.companyName?.companyName || "-" },
  { id: "resolutionNotes", label: "Resolve Description", value: (row: any) => row.resolutionNotes || "-" },
  { id: "resolvedAt", label: "Resolved Date", value: (row: any) => (row.resolvedAt ? new Date(row.resolvedAt).toLocaleDateString() : "-") },
];

const ComplaintsPage = () => {
  const dispatch = useAppDispatch();
  const { complaints, loading, error, successMessage } = useAppSelector((state) => state.complaints);
  const { roles } = useAppSelector((state) => state.roles);
  const { user } = useAppSelector((state) => state.auth);
  // Full Figma slide scan Phase 1 (claude/full-figma-slide-scan.md, Theme
  // 8/9): this list never respected the global company toggle every other
  // scoped list page (Purchase, Account Master, All Orders) already reacts
  // to -- it always fetched every complaint across both companies with a
  // per-row Company column as the only differentiator. Wired to the same
  // activeCompanyId pattern those pages use.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const permissions = user?.role?.permissions?.complaint;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ComplaintForm>(emptyForm);

  const roleOptions = roles.map((r: any) => ({ label: r.roleName, value: r._id }));

  useEffect(() => {
    dispatch(getAllComplaintsThunk(activeCompanyId ? { companyName: activeCompanyId } : undefined));
    dispatch(getAllRolesThunk());
  }, [dispatch, activeCompanyId]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearComplaintSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearComplaintError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (complaint?: any) => {
    if (complaint) {
      setEditId(complaint._id);
      setForm({
        subject: complaint.subject,
        description: complaint.description || "",
        priority: complaint.priority || "Normal",
        status: complaint.status || "Open",
        companyName: complaint.companyName ? { label: complaint.companyName.companyName, value: complaint.companyName._id } : null,
        party: complaint.party ? { label: complaint.party.partyName, value: complaint.party._id } : null,
        assignedRole: null,
        assignedTo: complaint.assignedTo
          ? { label: `${complaint.assignedTo.firstName} ${complaint.assignedTo.lastName}`, value: complaint.assignedTo._id }
          : null,
        resolutionNotes: complaint.resolutionNotes || "",
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    const payload: any = {
      subject: form.subject,
      description: form.description || undefined,
      priority: form.priority || undefined,
      companyName: form.companyName?.value || undefined,
      party: form.party?.value || undefined,
      assignedTo: form.assignedTo?.value ? String(form.assignedTo.value) : undefined,
    };

    if (editId) {
      payload.status = form.status || undefined;
      payload.resolutionNotes = form.resolutionNotes || undefined;
    }

    try {
      if (editId) {
        await dispatch(updateComplaintThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createComplaintThunk(payload)).unwrap();
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err: any) {
      // error toast already handled by the effect above
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteComplaintThunk(id));
      }
    });
  };

  // Full Figma slide scan Phase 1 (claude/full-figma-slide-scan.md, Theme
  // 8): the design shows a dedicated Resolve action on the Resolved view --
  // previously the only way to resolve a complaint was opening the full
  // Edit dialog and changing Status manually. This is a thin wrapper over
  // the same updateComplaint call, prompting for the resolution notes the
  // backend already stores.
  const handleResolve = async (complaint: any) => {
    const { value: notes, isConfirmed } = await Swal.fire({
      title: `Resolve ${complaint.complaintNumber}`,
      input: "textarea",
      inputLabel: "Resolve Description",
      inputPlaceholder: "How was this complaint resolved?",
      inputValue: complaint.resolutionNotes || "",
      showCancelButton: true,
      confirmButtonText: "Mark Resolved",
    });
    if (!isConfirmed) return;
    try {
      await dispatch(
        updateComplaintThunk({ id: complaint._id, data: { status: "Resolved", resolutionNotes: notes || undefined } })
      ).unwrap();
    } catch (err: any) {
      // error toast already handled by the effect above
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            All Complains
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Track and resolve customer complaints across both companies.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#7F56D9", "&:hover": { background: "#53389E" } }}
          >
            New Complaint
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={complaints.map((c: any) => ({ ...c, id: c._id }))}
        csvColumns={csvColumns}
        exportFilename="complaints"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.complaintNumber}</TableCell>
            <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</TableCell>
            <TableCell>{row.subject}</TableCell>
            <TableCell>{row.party?.partyName || "-"}</TableCell>
            <TableCell>
              <Chip size="small" label={row.priority} color={PRIORITY_COLORS[row.priority] || "default"} />
            </TableCell>
            <TableCell>
              <Chip size="small" label={row.status} color={STATUS_COLORS[row.status] || "default"} />
            </TableCell>
            <TableCell>{row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : "-"}</TableCell>
            <TableCell>{row.companyName?.companyName || "-"}</TableCell>
            <TableCell>{row.resolutionNotes || "-"}</TableCell>
            <TableCell>{row.resolvedAt ? new Date(row.resolvedAt).toLocaleDateString() : "-"}</TableCell>
            <TableCell>
              {permissions?.edit && row.status !== "Resolved" && row.status !== "Closed" && (
                <IconButton color="success" onClick={() => handleResolve(row)} title="Resolve">
                  <CheckCircle />
                </IconButton>
              )}
              {permissions?.edit && (
                <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                  <Edit />
                </IconButton>
              )}
              {permissions?.delete && (
                <IconButton color="error" onClick={() => handleDelete(row._id, row.complaintNumber)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Complaint" : "New Complaint"} maxWidth="xs" fullWidth>
        <Input
          labelName="Subject"
          value={form.subject}
          onChange={(e: any) => setForm((f) => ({ ...f, subject: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Description (optional)"
          value={form.description}
          onChange={(e: any) => setForm((f) => ({ ...f, description: e.target.value }))}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        <Box mb={2}>
          <Select
            label="Priority"
            options={PRIORITIES.map((p) => ({ label: p, value: p }))}
            value={form.priority ? { label: form.priority, value: form.priority } : null}
            onChange={(_, v) => setForm((f) => ({ ...f, priority: v ? String(v.value) : "Normal" }))}
          />
        </Box>
        {editId && (
          <Box mb={2}>
            <Select
              label="Status"
              options={STATUSES.map((s) => ({ label: s, value: s }))}
              value={form.status ? { label: form.status, value: form.status } : null}
              onChange={(_, v) => setForm((f) => ({ ...f, status: v ? String(v.value) : "Open" }))}
            />
          </Box>
        )}
        <Box mb={2}>
          {/* Full Figma slide scan Phase 1 (claude/full-figma-slide-scan.md,
              Theme 8): party_id was accepted end-to-end by the backend since
              Phase 3 Part A but this dialog never offered a way to pick one
              -- showPartyName is the same proven pattern already used on
              Assign Task/Add New Party/Place New Order. */}
          <CompanySelect
            label="Company"
            name="companyName"
            value={form.companyName}
            onChange={(_, v) => setForm((f) => ({ ...f, companyName: v, party: null }))}
            showPartyName
            partyName={form.party || undefined}
            onPartyChange={(_, v) => setForm((f) => ({ ...f, party: v }))}
          />
        </Box>
        <Box mb={2}>
          <Select
            label="Assign To -- Role (optional)"
            options={roleOptions}
            value={form.assignedRole}
            onChange={(_, v) => setForm((f) => ({ ...f, assignedRole: v, assignedTo: null }))}
          />
        </Box>
        <Box mb={2}>
          <RoleStaffSelect
            label="Assign To -- Staff (optional)"
            name="assignedTo"
            value={form.assignedTo}
            onChange={(_, v) => setForm((f) => ({ ...f, assignedTo: v }))}
            roleFilter={form.assignedRole?.label || ""}
            disabled={!form.assignedRole}
          />
        </Box>
        {editId && (
          <Input
            labelName="Resolution Notes (optional)"
            value={form.resolutionNotes}
            onChange={(e: any) => setForm((f) => ({ ...f, resolutionNotes: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
        )}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "#7F56D9", color: "#7F56D9", "&:hover": { borderColor: "#53389E", color: "#53389E" } }}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 2, background: "#7F56D9", "&:hover": { background: "#53389E" } }}
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default ComplaintsPage;
