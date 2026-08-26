import React, { useState, useEffect } from "react";
import { Box, Typography, TableCell, IconButton } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeTabs, { TabItem } from "@/component/common_component/themetabs";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import { MdSwapHoriz, MdTune, MdLock } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { getAllWarehousesThunk } from "@/store/slices/warehouseSlice";
import { getAllRolesThunk } from "@/store/slices/roleSlice";
import {
  getAllStockTransfersThunk,
  createStockTransferThunk,
  getAllStockAdjustmentsThunk,
  createStockAdjustmentThunk,
  getAllStockReservationsThunk,
  createStockReservationThunk,
  updateReservationStatusThunk,
  deleteReservationThunk,
  clearStockMovementError,
  clearStockMovementSuccessMessage,
} from "@/store/slices/stockMovementSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Matches the lowercase category enum on `inventories` (see stockLedger page).
const CATEGORIES = [
  { label: "Printer", value: "printer" },
  { label: "Binder", value: "binder" },
  { label: "Booklet", value: "booklet" },
  { label: "Factory", value: "factory" },
  { label: "Godown", value: "godown" },
];

enum MovementTab {
  TRANSFER = "transfer",
  ADJUSTMENT = "adjustment",
  RESERVATION = "reservation",
}

const tabs: TabItem[] = [
  { label: "Stock Transfer", value: MovementTab.TRANSFER, icon: <MdSwapHoriz size={16} /> },
  { label: "Stock Adjustment", value: MovementTab.ADJUSTMENT, icon: <MdTune size={16} /> },
  { label: "Stock Reservation", value: MovementTab.RESERVATION, icon: <MdLock size={16} /> },
];

const reservationStatusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Consumed: { bg: "#E0E7FF", color: "#3730A3" },
  Cancelled: { bg: "#FEE4E2", color: "#B42318" },
};

const emptyRolePick: { label: string; value: string | number } | null = null;

const StockMovementsPage = () => {
  const dispatch = useAppDispatch();
  const { materials } = useAppSelector((state) => state.materials);
  const { warehouses } = useAppSelector((state) => state.warehouses);
  const { roles } = useAppSelector((state) => state.roles);
  const { user } = useAppSelector((state) => state.auth);
  const { transfers, adjustments, reservations, loading, error, successMessage } = useAppSelector((state) => state.stockMovements);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunks/controller
  // already supported companyName -- these list views just never passed it,
  // so all three tabs always mixed both companies' movements together.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  const transferPerms = user?.role?.permissions?.stocktransfer;
  const adjustmentPerms = user?.role?.permissions?.stockadjustment;
  const reservationPerms = user?.role?.permissions?.stockreservation;

  const [activeTab, setActiveTab] = useState<MovementTab>(MovementTab.TRANSFER);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Shared "who is this stock movement for" picker set, mirrors the
  // Role -> RoleStaffSelect pattern used on the GRN posting form.
  const [company, setCompany] = useState("");
  const [rolePick, setRolePick] = useState<{ label: string; value: string | number } | null>(emptyRolePick);
  const [staffPick, setStaffPick] = useState<any>(null);

  const [material, setMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [category, setCategory] = useState<{ label: string; value: string | number } | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Transfer-only
  const [fromWarehouse, setFromWarehouse] = useState<{ label: string; value: string | number } | null>(null);
  const [toWarehouse, setToWarehouse] = useState<{ label: string; value: string | number } | null>(null);
  const [transferDate, setTransferDate] = useState("");

  // Adjustment-only
  const [adjustmentWarehouse, setAdjustmentWarehouse] = useState<{ label: string; value: string | number } | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<{ label: string; value: string | number } | null>(null);
  const [reason, setReason] = useState("");

  // Reservation-only
  const [reservationWarehouse, setReservationWarehouse] = useState<{ label: string; value: string | number } | null>(null);
  const [reservedFor, setReservedFor] = useState("");

  useEffect(() => {
    dispatch(getAllMaterialsThunk({ companyName: activeCompanyId || undefined }));
    dispatch(getAllWarehousesThunk(undefined));
    dispatch(getAllRolesThunk());
  }, [dispatch, activeCompanyId]);

  useEffect(() => {
    if (activeTab === MovementTab.TRANSFER) dispatch(getAllStockTransfersThunk({ companyName: activeCompanyId || undefined }));
    if (activeTab === MovementTab.ADJUSTMENT) dispatch(getAllStockAdjustmentsThunk({ companyName: activeCompanyId || undefined }));
    if (activeTab === MovementTab.RESERVATION) dispatch(getAllStockReservationsThunk({ companyName: activeCompanyId || undefined }));
  }, [activeTab, activeCompanyId, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearStockMovementSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearStockMovementError());
    }
  }, [successMessage, error, dispatch]);

  const resetForm = () => {
    setCompany("");
    setRolePick(null);
    setStaffPick(null);
    setMaterial(null);
    setCategory(null);
    setQuantity("");
    setNotes("");
    setFromWarehouse(null);
    setToWarehouse(null);
    setTransferDate("");
    setAdjustmentWarehouse(null);
    setAdjustmentType(null);
    setReason("");
    setReservationWarehouse(null);
    setReservedFor("");
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string | number) => {
    setActiveTab(newValue as MovementTab);
    resetForm();
  };

  const materialOptions = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}`,
    value: m._id,
  }));
  const warehouseOptions = warehouses.map((w: any) => ({ label: w.warehouseName, value: w._id }));
  const roleOptions = roles.map((r: any) => ({ label: r.roleName, value: r._id }));

  const commonReady = company && rolePick && staffPick && material && category && Number(quantity) > 0;

  const handleSaveTransfer = async () => {
    if (!commonReady || !toWarehouse) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await dispatch(
        createStockTransferThunk({
          materialId: String(material!.value),
          quantity: Number(quantity),
          category: String(category!.value),
          fromWarehouse: fromWarehouse ? String(fromWarehouse.value) : undefined,
          toWarehouse: String(toWarehouse.value),
          companyName: company,
          forRole: String(rolePick!.value),
          forCompany: staffPick.value,
          transferDate: transferDate || undefined,
          notes: notes || undefined,
        })
      ).unwrap();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      // error toast handled above
    }
  };

  const handleSaveAdjustment = async () => {
    if (!commonReady || !adjustmentType || !reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await dispatch(
        createStockAdjustmentThunk({
          materialId: String(material!.value),
          warehouse: adjustmentWarehouse ? String(adjustmentWarehouse.value) : undefined,
          category: String(category!.value),
          adjustmentType: String(adjustmentType.value) as "Increase" | "Decrease",
          quantity: Number(quantity),
          reason,
          companyName: company,
          forRole: String(rolePick!.value),
          forCompany: staffPick.value,
        })
      ).unwrap();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      // error toast handled above
    }
  };

  const handleSaveReservation = async () => {
    if (!company || !rolePick || !staffPick || !material || Number(quantity) <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await dispatch(
        createStockReservationThunk({
          materialId: String(material!.value),
          warehouse: reservationWarehouse ? String(reservationWarehouse.value) : undefined,
          category: category ? String(category.value) : undefined,
          quantity: Number(quantity),
          reservedFor: reservedFor || undefined,
          notes: notes || undefined,
          companyName: company,
          forRole: String(rolePick!.value),
          forCompany: staffPick.value,
        })
      ).unwrap();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      // error toast handled above
    }
  };

  const handleReservationStatus = (id: string, status: "Consumed" | "Cancelled") => {
    Swal.fire({
      title: `Mark reservation as ${status}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${status.toLowerCase()} it`,
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(updateReservationStatusThunk({ id, status }));
      }
    });
  };

  const handleDeleteReservation = (id: string) => {
    Swal.fire({
      title: "Delete this reservation?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteReservationThunk(id));
      }
    });
  };

  const canCreate =
    (activeTab === MovementTab.TRANSFER && transferPerms?.create) ||
    (activeTab === MovementTab.ADJUSTMENT && adjustmentPerms?.create) ||
    (activeTab === MovementTab.RESERVATION && reservationPerms?.create);

  const dialogTitle =
    activeTab === MovementTab.TRANSFER ? "New Stock Transfer" : activeTab === MovementTab.ADJUSTMENT ? "New Stock Adjustment" : "New Stock Reservation";

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Stock Movements
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Move stock between warehouses, correct on-hand quantities, or hold stock against a Sales Order/Job Card
            without moving it yet.
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New
          </Button>
        )}
      </Box>

      <Box mb={2}>
        <ThemeTabs value={activeTab} onChange={handleTabChange} tabs={tabs} />
      </Box>

      {activeTab === MovementTab.TRANSFER && (
        <BasicTable
          showFillter={false}
          showDatePicker={false}
          showSearch={false}
          tableHeader={[
            { id: "transferNumber", label: "Transfer #" },
            { id: "material", label: "Material" },
            { id: "quantity", label: "Qty" },
            { id: "category", label: "Category" },
            { id: "from", label: "From" },
            { id: "to", label: "To" },
            { id: "date", label: "Date" },
          ]}
          rowData={transfers.map((t: any) => ({ ...t, id: t._id }))}
          csvColumns={[
            { id: "transferNumber", label: "Transfer #", value: (row: any) => row.transferNumber },
            { id: "material", label: "Material", value: (row: any) => row.material?.materialName || "-" },
            { id: "quantity", label: "Qty", value: (row: any) => row.quantity },
            { id: "category", label: "Category", value: (row: any) => row.category },
            { id: "from", label: "From", value: (row: any) => row.fromWarehouse?.warehouseName || "Unassigned" },
            { id: "to", label: "To", value: (row: any) => row.toWarehouse?.warehouseName || "-" },
            { id: "date", label: "Date", value: (row: any) => (row.transferDate ? new Date(row.transferDate).toLocaleDateString() : "-") },
          ]}
          exportFilename="stock-transfers"
          renderRow={(row: any) => (
            <>
              <TableCell>{row.transferNumber}</TableCell>
              <TableCell>{row.material?.materialName || "-"}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>{row.fromWarehouse?.warehouseName || "Unassigned"}</TableCell>
              <TableCell>{row.toWarehouse?.warehouseName || "-"}</TableCell>
              <TableCell>{row.transferDate ? new Date(row.transferDate).toLocaleDateString() : "-"}</TableCell>
            </>
          )}
        />
      )}

      {activeTab === MovementTab.ADJUSTMENT && (
        <BasicTable
          showFillter={false}
          showDatePicker={false}
          showSearch={false}
          tableHeader={[
            { id: "adjustmentNumber", label: "Adjustment #" },
            { id: "material", label: "Material" },
            { id: "type", label: "Type" },
            { id: "quantity", label: "Qty" },
            { id: "warehouse", label: "Warehouse" },
            { id: "reason", label: "Reason" },
            { id: "date", label: "Date" },
          ]}
          rowData={adjustments.map((a: any) => ({ ...a, id: a._id }))}
          csvColumns={[
            { id: "adjustmentNumber", label: "Adjustment #", value: (row: any) => row.adjustmentNumber },
            { id: "material", label: "Material", value: (row: any) => row.material?.materialName || "-" },
            { id: "type", label: "Type", value: (row: any) => row.adjustmentType },
            { id: "quantity", label: "Qty", value: (row: any) => row.quantity },
            { id: "warehouse", label: "Warehouse", value: (row: any) => row.warehouse?.warehouseName || "-" },
            { id: "reason", label: "Reason", value: (row: any) => row.reason },
            { id: "date", label: "Date", value: (row: any) => (row.adjustmentDate ? new Date(row.adjustmentDate).toLocaleDateString() : "-") },
          ]}
          exportFilename="stock-adjustments"
          renderRow={(row: any) => (
            <>
              <TableCell>{row.adjustmentNumber}</TableCell>
              <TableCell>{row.material?.materialName || "-"}</TableCell>
              <TableCell>
                <ThemeChip
                  label={row.adjustmentType}
                  sx={{
                    background: row.adjustmentType === "Increase" ? "#D1FADF" : "#FEE4E2",
                    color: row.adjustmentType === "Increase" ? "#027A48" : "#B42318",
                    fontWeight: 600,
                  }}
                />
              </TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{row.warehouse?.warehouseName || "-"}</TableCell>
              <TableCell>{row.reason}</TableCell>
              <TableCell>{row.adjustmentDate ? new Date(row.adjustmentDate).toLocaleDateString() : "-"}</TableCell>
            </>
          )}
        />
      )}

      {activeTab === MovementTab.RESERVATION && (
        <BasicTable
          showFillter={false}
          showDatePicker={false}
          showSearch={false}
          tableHeader={[
            { id: "reservationNumber", label: "Reservation #" },
            { id: "material", label: "Material" },
            { id: "quantity", label: "Qty" },
            { id: "warehouse", label: "Warehouse" },
            { id: "reservedFor", label: "Reserved For" },
            { id: "status", label: "Status" },
            { id: "action", label: "Actions" },
          ]}
          rowData={reservations.map((r: any) => ({ ...r, id: r._id }))}
          csvColumns={[
            { id: "reservationNumber", label: "Reservation #", value: (row: any) => row.reservationNumber },
            { id: "material", label: "Material", value: (row: any) => row.material?.materialName || "-" },
            { id: "quantity", label: "Qty", value: (row: any) => row.quantity },
            { id: "warehouse", label: "Warehouse", value: (row: any) => row.warehouse?.warehouseName || "-" },
            { id: "reservedFor", label: "Reserved For", value: (row: any) => row.reservedFor || "-" },
            { id: "status", label: "Status", value: (row: any) => row.status },
          ]}
          exportFilename="stock-reservations"
          renderRow={(row: any) => (
            <>
              <TableCell>{row.reservationNumber}</TableCell>
              <TableCell>{row.material?.materialName || "-"}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{row.warehouse?.warehouseName || "-"}</TableCell>
              <TableCell>{row.reservedFor || "-"}</TableCell>
              <TableCell>
                <ThemeChip
                  label={row.status}
                  sx={{ background: reservationStatusColor[row.status]?.bg, color: reservationStatusColor[row.status]?.color, fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                {row.status === "Active" && reservationPerms?.edit && (
                  <>
                    <Button size="small" variant="text" onClick={() => handleReservationStatus(row._id, "Consumed")} sx={{ mr: 1, textTransform: "none" }}>
                      Consume
                    </Button>
                    <Button size="small" variant="text" onClick={() => handleReservationStatus(row._id, "Cancelled")} sx={{ textTransform: "none", color: "#B42318" }}>
                      Cancel
                    </Button>
                  </>
                )}
                {reservationPerms?.delete && (
                  <IconButton color="error" size="small" onClick={() => handleDeleteReservation(row._id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </>
          )}
        />
      )}

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={dialogTitle} maxWidth="sm" fullWidth>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mt={1} mb={2}>
          <Select label="Material" options={materialOptions} value={material} onChange={(_, v) => setMaterial(v)} required />
          <Select
            label="Category"
            options={CATEGORIES}
            value={category}
            onChange={(_, v) => setCategory(v)}
            required={activeTab !== MovementTab.RESERVATION}
          />
          <Input labelName="Quantity" type="number" value={quantity} onChange={(e: any) => setQuantity(e.target.value)} required fullWidth />

          {activeTab === MovementTab.TRANSFER && (
            <>
              <Select label="From Warehouse (optional)" options={warehouseOptions} value={fromWarehouse} onChange={(_, v) => setFromWarehouse(v)} />
              <Select label="To Warehouse" options={warehouseOptions} value={toWarehouse} onChange={(_, v) => setToWarehouse(v)} required />
              <Input labelName="Transfer Date" type="date" value={transferDate} onChange={(e: any) => setTransferDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </>
          )}

          {activeTab === MovementTab.ADJUSTMENT && (
            <>
              <Select label="Warehouse (optional)" options={warehouseOptions} value={adjustmentWarehouse} onChange={(_, v) => setAdjustmentWarehouse(v)} />
              <Select
                label="Adjustment Type"
                options={[
                  { label: "Increase", value: "Increase" },
                  { label: "Decrease", value: "Decrease" },
                ]}
                value={adjustmentType}
                onChange={(_, v) => setAdjustmentType(v)}
                required
              />
            </>
          )}

          {activeTab === MovementTab.RESERVATION && (
            <>
              <Select label="Warehouse (optional)" options={warehouseOptions} value={reservationWarehouse} onChange={(_, v) => setReservationWarehouse(v)} />
              <Input labelName="Reserved For (e.g. SO/Job Card ref)" value={reservedFor} onChange={(e: any) => setReservedFor(e.target.value)} fullWidth />
            </>
          )}

          <Box sx={{ gridColumn: "1 / -1" }}>
            <CompanySelect label="Company" name="companyName" value={company} onChange={(_, v) => setCompany(v)} />
          </Box>
          <Select
            label="Role"
            options={roleOptions}
            value={rolePick}
            onChange={(_, v) => {
              setRolePick(v);
              setStaffPick(null);
            }}
            required
          />
          <RoleStaffSelect label="Staff Member" name="staffPick" value={staffPick} onChange={(_, v) => setStaffPick(v)} roleFilter={rolePick?.label || ""} disabled={!rolePick} required />

          {activeTab === MovementTab.ADJUSTMENT && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Input labelName="Reason" value={reason} onChange={(e: any) => setReason(e.target.value)} fullWidth multiline rows={2} required />
            </Box>
          )}
          {activeTab !== MovementTab.ADJUSTMENT && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Input labelName="Notes (optional)" value={notes} onChange={(e: any) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            </Box>
          )}
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, borderColor: "#A409F8", color: "#A409F8", "&:hover": { borderColor: "#7B06C2", color: "#7B06C2" } }}>
            Close
          </Button>
          <Button
            onClick={activeTab === MovementTab.TRANSFER ? handleSaveTransfer : activeTab === MovementTab.ADJUSTMENT ? handleSaveAdjustment : handleSaveReservation}
            variant="contained"
            sx={{ borderRadius: 2, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default StockMovementsPage;
