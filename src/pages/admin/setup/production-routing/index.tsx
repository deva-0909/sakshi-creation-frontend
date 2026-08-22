import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell, Tabs, Tab, Checkbox, FormControlLabel, List, ListItem, ListItemText, Chip } from "@mui/material";
import { Add, Edit, Delete, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllProcessStagesThunk,
  createProcessStageThunk,
  updateProcessStageThunk,
  deleteProcessStageThunk,
  getAllRoutingTemplatesThunk,
  createRoutingTemplateThunk,
  updateRoutingTemplateThunk,
  deleteRoutingTemplateThunk,
  clearRoutingError,
  clearRoutingSuccessMessage,
} from "@/store/slices/routingSlice";
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface StageForm {
  stageName: string;
  stageOrder: string;
  description: string;
  status: string;
}
const emptyStageForm: StageForm = { stageName: "", stageOrder: "", description: "", status: "Active" };

interface TemplateForm {
  templateName: string;
  productItemId: string;
  isDefault: boolean;
  status: string;
  stageIds: string[];
}
const emptyTemplateForm: TemplateForm = { templateName: "", productItemId: "", isDefault: false, status: "Active", stageIds: [] };

const stageColumns = [
  { id: "id", label: "ID" },
  { id: "stageName", label: "Stage Name" },
  { id: "stageOrder", label: "Order" },
  { id: "description", label: "Description" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const templateColumns = [
  { id: "id", label: "ID" },
  { id: "templateName", label: "Template Name" },
  { id: "productItem", label: "Product Item" },
  { id: "stages", label: "Stages" },
  { id: "isDefault", label: "Default" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

// Module 10 (scope §13): a configurable, advisory routing reference. The
// hardcoded job-card STAGE_ORDER and its DB CHECK constraint are untouched --
// a routing template only feeds the "Suggested Routing" panel on the job card.
const ProductionRoutingPage = () => {
  const dispatch = useAppDispatch();
  const { processStages, routingTemplates, loading, error, successMessage } = useAppSelector((state) => state.routing);
  const { productItems } = useAppSelector((state) => state.productItems);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.routing;

  const [tab, setTab] = useState(0);

  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editStageId, setEditStageId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState<StageForm>(emptyStageForm);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplateForm);

  useEffect(() => {
    dispatch(getAllProcessStagesThunk(undefined));
    dispatch(getAllRoutingTemplatesThunk(undefined));
    dispatch(getAllProductItemsThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearRoutingSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearRoutingError());
    }
  }, [successMessage, error, dispatch]);

  // -- Process Stage handlers --
  const handleOpenStageDialog = (stage?: any) => {
    if (stage) {
      setEditStageId(stage._id);
      setStageForm({
        stageName: stage.stageName,
        stageOrder: String(stage.stageOrder ?? ""),
        description: stage.description || "",
        status: stage.status,
      });
    } else {
      setEditStageId(null);
      setStageForm(emptyStageForm);
    }
    setStageDialogOpen(true);
  };

  const handleSaveStage = async () => {
    if (!stageForm.stageName.trim()) {
      toast.error("Stage name is required");
      return;
    }
    const payload = {
      stageName: stageForm.stageName,
      stageOrder: stageForm.stageOrder === "" ? undefined : Number(stageForm.stageOrder),
      description: stageForm.description || undefined,
      status: stageForm.status,
    };
    try {
      if (editStageId) {
        await dispatch(updateProcessStageThunk({ id: editStageId, data: payload })).unwrap();
      } else {
        await dispatch(createProcessStageThunk(payload)).unwrap();
      }
      setStageDialogOpen(false);
      setStageForm(emptyStageForm);
      setEditStageId(null);
    } catch (err: any) {
      // handled by effect
    }
  };

  const handleDeleteStage = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete stage "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) dispatch(deleteProcessStageThunk(id));
    });
  };

  // -- Routing Template handlers --
  const handleOpenTemplateDialog = (template?: any) => {
    if (template) {
      setEditTemplateId(template._id);
      setTemplateForm({
        templateName: template.templateName,
        productItemId: template.productItem?._id || "",
        isDefault: !!template.isDefault,
        status: template.status,
        stageIds: (template.stages || [])
          .slice()
          .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
          .map((s: any) => s.processStage._id),
      });
    } else {
      setEditTemplateId(null);
      setTemplateForm(emptyTemplateForm);
    }
    setTemplateDialogOpen(true);
  };

  const toggleStageInTemplate = (stageId: string) => {
    setTemplateForm((f) => {
      const exists = f.stageIds.includes(stageId);
      return { ...f, stageIds: exists ? f.stageIds.filter((id) => id !== stageId) : [...f.stageIds, stageId] };
    });
  };

  const moveStageInTemplate = (index: number, direction: -1 | 1) => {
    setTemplateForm((f) => {
      const next = [...f.stageIds];
      const target = index + direction;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, stageIds: next };
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (templateForm.stageIds.length === 0) {
      toast.error("Select at least one process stage");
      return;
    }
    const payload = {
      templateName: templateForm.templateName,
      productItemId: templateForm.productItemId || undefined,
      isDefault: templateForm.isDefault,
      status: templateForm.status,
      stageIds: templateForm.stageIds,
    };
    try {
      if (editTemplateId) {
        await dispatch(updateRoutingTemplateThunk({ id: editTemplateId, data: payload })).unwrap();
      } else {
        await dispatch(createRoutingTemplateThunk(payload)).unwrap();
      }
      setTemplateDialogOpen(false);
      setTemplateForm(emptyTemplateForm);
      setEditTemplateId(null);
    } catch (err: any) {
      // handled by effect
    }
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete template "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) dispatch(deleteRoutingTemplateThunk(id));
    });
  };

  const stageNameById = (id: string) => processStages.find((s: any) => s._id === id)?.stageName || id;

  return (
    <Box p={3}>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Production Routing
        </Typography>
        <Typography fontSize={14} color="text.secondary">
          Reference process stages and per-product suggested routing sequences. This is advisory only -- job card stage progression is unaffected.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Process Stages" />
        <Tab label="Routing Templates" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            {permissions?.create && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenStageDialog()}
                sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
              >
                New Stage
              </Button>
            )}
          </Box>
          <BasicTable
            showFillter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={stageColumns}
            rowData={processStages.map((s: any) => ({ ...s, id: s._id }))}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{row.stageName}</TableCell>
                <TableCell>{row.stageOrder ?? "-"}</TableCell>
                <TableCell>{row.description || "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: statusColor[row.status]?.bg, color: statusColor[row.status]?.color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  {permissions?.edit && (
                    <IconButton color="primary" onClick={() => handleOpenStageDialog(row)}>
                      <Edit />
                    </IconButton>
                  )}
                  {permissions?.delete && (
                    <IconButton color="error" onClick={() => handleDeleteStage(row._id, row.stageName)}>
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </>
            )}
          />
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            {permissions?.create && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenTemplateDialog()}
                sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
              >
                New Template
              </Button>
            )}
          </Box>
          <BasicTable
            showFillter={false}
            showDatePicker={false}
            showSearch={false}
            tableHeader={templateColumns}
            rowData={routingTemplates.map((t: any) => ({ ...t, id: t._id }))}
            renderRow={(row: any, idx: number) => (
              <>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{row.templateName}</TableCell>
                <TableCell>{row.productItem?.itemName || "Any product"}</TableCell>
                <TableCell>
                  {(row.stages || [])
                    .slice()
                    .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
                    .map((s: any) => s.processStage.stageName)
                    .join(" -> ") || "-"}
                </TableCell>
                <TableCell>{row.isDefault ? "Yes" : "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: statusColor[row.status]?.bg, color: statusColor[row.status]?.color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  {permissions?.edit && (
                    <IconButton color="primary" onClick={() => handleOpenTemplateDialog(row)}>
                      <Edit />
                    </IconButton>
                  )}
                  {permissions?.delete && (
                    <IconButton color="error" onClick={() => handleDeleteTemplate(row._id, row.templateName)}>
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </>
            )}
          />
        </Box>
      )}

      {/* Process Stage dialog */}
      <CustomDialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)} title={editStageId ? "Edit Process Stage" : "New Process Stage"} maxWidth="xs" fullWidth>
        <Input labelName="Stage Name" value={stageForm.stageName} onChange={(e: any) => setStageForm((f) => ({ ...f, stageName: e.target.value }))} fullWidth required sx={{ mb: 2, mt: 1 }} />
        <Input
          labelName="Order (optional)"
          type="number"
          value={stageForm.stageOrder}
          onChange={(e: any) => setStageForm((f) => ({ ...f, stageOrder: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Description (optional)"
          value={stageForm.description}
          onChange={(e: any) => setStageForm((f) => ({ ...f, description: e.target.value }))}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        <Box mb={2}>
          <Select
            label="Status"
            options={STATUSES.map((s) => ({ label: s, value: s }))}
            value={stageForm.status ? { label: stageForm.status, value: stageForm.status } : null}
            onChange={(_, v) => setStageForm((f) => ({ ...f, status: v ? String(v.value) : "Active" }))}
          />
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={() => setStageDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, borderColor: "#A409F8", color: "#A409F8", "&:hover": { borderColor: "#7B06C2", color: "#7B06C2" } }}>
            Close
          </Button>
          <Button onClick={handleSaveStage} variant="contained" sx={{ borderRadius: 2, background: "#A409F8", "&:hover": { background: "#7B06C2" } }} disabled={loading}>
            Save
          </Button>
        </Box>
      </CustomDialog>

      {/* Routing Template dialog */}
      <CustomDialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} title={editTemplateId ? "Edit Routing Template" : "New Routing Template"} maxWidth="sm" fullWidth>
        <Input
          labelName="Template Name"
          value={templateForm.templateName}
          onChange={(e: any) => setTemplateForm((f) => ({ ...f, templateName: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Box mb={2}>
          <Select
            label="Product Item (optional -- leave blank to use as the default fallback)"
            options={(productItems || []).map((p: any) => ({ label: p.itemName, value: p._id }))}
            value={
              templateForm.productItemId
                ? { label: (productItems || []).find((p: any) => p._id === templateForm.productItemId)?.itemName || "", value: templateForm.productItemId }
                : null
            }
            onChange={(_, v) => setTemplateForm((f) => ({ ...f, productItemId: v ? String(v.value) : "" }))}
          />
        </Box>
        <FormControlLabel
          control={<Checkbox checked={templateForm.isDefault} onChange={(e) => setTemplateForm((f) => ({ ...f, isDefault: e.target.checked }))} />}
          label="Default fallback template (used when no product-specific match exists)"
          sx={{ mb: 1 }}
        />
        <Box mb={2}>
          <Select
            label="Status"
            options={STATUSES.map((s) => ({ label: s, value: s }))}
            value={templateForm.status ? { label: templateForm.status, value: templateForm.status } : null}
            onChange={(_, v) => setTemplateForm((f) => ({ ...f, status: v ? String(v.value) : "Active" }))}
          />
        </Box>

        <Typography fontWeight={700} fontSize={14} color="#344054" mb={0.5}>
          Stages <span style={{ color: "red" }}>*</span>
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
          {processStages.map((s: any) => (
            <Chip
              key={s._id}
              label={s.stageName}
              color={templateForm.stageIds.includes(s._id) ? "secondary" : "default"}
              onClick={() => toggleStageInTemplate(s._id)}
              variant={templateForm.stageIds.includes(s._id) ? "filled" : "outlined"}
            />
          ))}
        </Box>
        {templateForm.stageIds.length > 0 && (
          <List dense sx={{ mb: 2, background: "#F9FAFB", borderRadius: 2 }}>
            {templateForm.stageIds.map((id, idx) => (
              <ListItem
                key={id}
                secondaryAction={
                  <>
                    <IconButton size="small" onClick={() => moveStageInTemplate(idx, -1)} disabled={idx === 0}>
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveStageInTemplate(idx, 1)} disabled={idx === templateForm.stageIds.length - 1}>
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </>
                }
              >
                <ListItemText primary={`${idx + 1}. ${stageNameById(id)}`} />
              </ListItem>
            ))}
          </List>
        )}

        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={() => setTemplateDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, borderColor: "#A409F8", color: "#A409F8", "&:hover": { borderColor: "#7B06C2", color: "#7B06C2" } }}>
            Close
          </Button>
          <Button onClick={handleSaveTemplate} variant="contained" sx={{ borderRadius: 2, background: "#A409F8", "&:hover": { background: "#7B06C2" } }} disabled={loading}>
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default ProductionRoutingPage;
