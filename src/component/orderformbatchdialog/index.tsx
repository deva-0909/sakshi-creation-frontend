"use client"

// Order Form batch-entry dialog (Godown Manager Figma audit, Patch 108).
//
// The Figma "godown > order from" / "godown > order1" frames (node-ids
// 261:9028 / 261:8352, file 9lOtphfOV3O6p6TPuVExtv) show one Order Form
// (e.g. "QP-001") grouping several individual order rows entered together
// via a multi-row inline Save/Cancel form. This reuses the exact field set
// AddOrderDialog's QP-conditional branch already collects (Party, Item,
// Qty, Size, Ply/Deckal/GSM, Rate, the DYE row, Godown Remark/Factory
// Remarks, Delivery Destination) -- just as N repeating rows under one
// company/Order From instead of one dialog per order. Field definitions
// themselves aren't duplicated: this is the same shape AddOrderDialog
// sends per order, just collected N times before a single batch submit.
import type React from "react"
import { useEffect, useState } from "react"
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material"
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { getPartiesByCompanyThunk } from "@/store/slices/partySlice"
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice"
import { createOrderFormThunk, clearOrderError, clearOrderSuccessMessage } from "@/store/slices/orderSlice"
import type { CreateOrderFormRow } from "@/services/order.service"
import { toast } from "react-toastify"

interface OrderFormBatchDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
  // Locked for every row in the form -- this grouping is Godown/QP-
  // specific, so the whole batch shares one company and one Order From,
  // same as AddOrderDialog's own defaultOrderFrom lock on this page.
  companyId: string
  defaultOrderFrom?: string
}

type RowState = CreateOrderFormRow & { key: string }

let rowKeySeq = 0
const blankRow = (defaultOrderFrom?: string): RowState => ({
  key: `row-${++rowKeySeq}`,
  party: "",
  productItem: "",
  qty: 0,
  size: "",
  rate: undefined,
  rateType: "new",
  ply: undefined,
  deckal: undefined,
  gsm: undefined,
  orderFrom: defaultOrderFrom || "",
  orderDate: "",
  dyeNumber: "",
  dyeSize: "",
  dyeSheetSize: "",
  dyeRemark: "",
  godownRemark: "",
  factoryRemarks: "",
  deliveryDestination: "SAKSHI OFFICE",
  orderType: "New Order",
})

const OrderFormBatchDialog: React.FC<OrderFormBatchDialogProps> = ({
  open,
  onClose,
  refreshData,
  companyId,
  defaultOrderFrom,
}) => {
  const dispatch = useAppDispatch()
  const { parties, loading: partyLoading } = useAppSelector((state) => state.party)
  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)

  const [rows, setRows] = useState<RowState[]>([blankRow(defaultOrderFrom)])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
      setRows([blankRow(defaultOrderFrom)])
      if (companyId) {
        dispatch(getPartiesByCompanyThunk(companyId))
        dispatch(getAllProductItemsThunk({ companyName: companyId }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearOrderSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (orderError) {
      toast.error(orderError)
      dispatch(clearOrderError())
    }
  }, [orderError, dispatch])

  const partyOptions = parties.map((p: any) => ({ label: p.partyName, value: p._id }))
  const itemOptions = productItems.map((i: any) => ({ label: i.itemName, value: i._id }))

  const updateRow = (key: string, field: keyof CreateOrderFormRow, value: any) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const addRow = () => setRows((prev) => [...prev, blankRow(defaultOrderFrom)])

  const removeRow = (key: string) => setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev))

  const handleCancel = () => {
    setRows([blankRow(defaultOrderFrom)])
    onClose()
  }

  const handleSave = async () => {
    if (!companyId) {
      toast.error("No company selected")
      return
    }
    const invalidIndex = rows.findIndex((row) => !row.party || !row.productItem || !row.qty || Number(row.qty) <= 0)
    if (invalidIndex !== -1) {
      toast.error(`Row ${invalidIndex + 1}: Party, Item, and Qty (greater than 0) are required`)
      return
    }

    setIsSubmitting(true)
    try {
      const orders: CreateOrderFormRow[] = rows.map((row) => {
        const { key, ...rest } = row
        return {
          ...rest,
          qty: Number(rest.qty),
          rate: rest.rate !== undefined && rest.rate !== ("" as any) ? Number(rest.rate) : undefined,
          ply: rest.ply !== undefined && rest.ply !== ("" as any) ? Number(rest.ply) : undefined,
          deckal: rest.deckal !== undefined && rest.deckal !== ("" as any) ? Number(rest.deckal) : undefined,
          gsm: rest.gsm !== undefined && rest.gsm !== ("" as any) ? Number(rest.gsm) : undefined,
        }
      })

      await dispatch(createOrderFormThunk({ companyName: companyId, orders })).unwrap()

      if (refreshData) refreshData()
      setRows([blankRow(defaultOrderFrom)])
      onClose()
    } catch (error: any) {
      console.error("Order form creation error:", error)
      toast.error(error?.message || "Failed to create order form")
    } finally {
      setIsSubmitting(false)
    }
  }

  const cellSx = { minWidth: 130, verticalAlign: "top", py: 1, px: 0.75 }

  return (
    <CustomDialog open={open} onClose={handleCancel} maxWidth="xl" title="New Order Form">
      <Box sx={{ p: 1 }}>
        <Typography sx={{ mb: 1.5, fontSize: 13, color: "#667085" }}>
          Add one or more order rows below, then Save to create them together as a single Order Form.
        </Typography>

        <TableContainer sx={{ maxHeight: "55vh", border: "1px solid #EAECF0", borderRadius: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={cellSx}>Party</TableCell>
                <TableCell sx={cellSx}>Item</TableCell>
                <TableCell sx={cellSx}>PCS</TableCell>
                <TableCell sx={cellSx}>Size</TableCell>
                <TableCell sx={cellSx}>Ply</TableCell>
                <TableCell sx={cellSx}>Deckal</TableCell>
                <TableCell sx={cellSx}>GSM</TableCell>
                <TableCell sx={cellSx}>Rate</TableCell>
                <TableCell sx={cellSx}>Order Date</TableCell>
                <TableCell sx={cellSx}>DYE No.</TableCell>
                <TableCell sx={cellSx}>DYE Size</TableCell>
                <TableCell sx={cellSx}>DYE Sheet Size</TableCell>
                <TableCell sx={cellSx}>DYE Remark</TableCell>
                <TableCell sx={cellSx}>Godown Remark</TableCell>
                <TableCell sx={cellSx}>Factory Remarks</TableCell>
                <TableCell sx={cellSx}>Delivery</TableCell>
                <TableCell sx={{ ...cellSx, minWidth: 48 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell sx={cellSx}>
                    <ThemeSelect
                      options={partyOptions}
                      value={partyOptions.find((o) => o.value === row.party) || null}
                      onChange={(_, v) => updateRow(row.key, "party", v ? v.value : "")}
                      disabled={partyLoading}
                      size="small"
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeSelect
                      options={itemOptions}
                      value={itemOptions.find((o) => o.value === row.productItem) || null}
                      onChange={(_, v) => updateRow(row.key, "productItem", v ? v.value : "")}
                      disabled={productLoading}
                      size="small"
                      sx={{ minWidth: 150 }}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput type="number" size="small" value={row.qty || ""} onChange={(e) => updateRow(row.key, "qty", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.size || ""} onChange={(e) => updateRow(row.key, "size", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput type="number" size="small" value={row.ply ?? ""} onChange={(e) => updateRow(row.key, "ply", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput type="number" size="small" value={row.deckal ?? ""} onChange={(e) => updateRow(row.key, "deckal", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput type="number" size="small" value={row.gsm ?? ""} onChange={(e) => updateRow(row.key, "gsm", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput type="number" size="small" value={row.rate ?? ""} onChange={(e) => updateRow(row.key, "rate", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={row.orderDate || ""}
                      onChange={(e) => updateRow(row.key, "orderDate", e.target.value)}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.dyeNumber || ""} onChange={(e) => updateRow(row.key, "dyeNumber", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.dyeSize || ""} onChange={(e) => updateRow(row.key, "dyeSize", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.dyeSheetSize || ""} onChange={(e) => updateRow(row.key, "dyeSheetSize", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.dyeRemark || ""} onChange={(e) => updateRow(row.key, "dyeRemark", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.godownRemark || ""} onChange={(e) => updateRow(row.key, "godownRemark", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeInput size="small" value={row.factoryRemarks || ""} onChange={(e) => updateRow(row.key, "factoryRemarks", e.target.value)} />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <ThemeSelect
                      options={[
                        { label: "TO CLIENT", value: "TO CLIENT" },
                        { label: "SAKSHI OFFICE", value: "SAKSHI OFFICE" },
                        { label: "TO GODOWN", value: "TO GODOWN" },
                      ]}
                      value={row.deliveryDestination ? { label: row.deliveryDestination, value: row.deliveryDestination } : null}
                      onChange={(_, v) => updateRow(row.key, "deliveryDestination", v ? v.value : "SAKSHI OFFICE")}
                      size="small"
                      sx={{ minWidth: 140 }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...cellSx, minWidth: 48 }}>
                    <IconButton size="small" onClick={() => removeRow(row.key)} disabled={rows.length === 1} title="Remove row">
                      <AiOutlineClose size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 1.5 }}>
          <ThemeButton onClick={addRow} startIcon={<AiOutlinePlus />} sx={{ background: "#fff", color: "#12B76A", border: "1px solid #12B76A" }}>
            Add Row
          </ThemeButton>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2.5 }}>
          <ThemeButton
            onClick={handleCancel}
            sx={{ background: "#fff", color: "#344054", border: "1px solid #D0D5DD", flex: 1 }}
          >
            Cancel
          </ThemeButton>
          <ThemeButton
            onClick={handleSave}
            disabled={isSubmitting || orderLoading}
            sx={{
              background: "#12B76A",
              color: "#fff",
              fontWeight: 600,
              flex: 1,
              "&:hover": { background: "#079455" },
              "&:disabled": { background: "#ccc", color: "#666" },
            }}
          >
            {isSubmitting || orderLoading ? (
              <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                <CircularProgress size={18} color="inherit" />
                Saving...
              </Box>
            ) : (
              `Save (${rows.length} order${rows.length > 1 ? "s" : ""})`
            )}
          </ThemeButton>
        </Box>
      </Box>
    </CustomDialog>
  )
}

export default OrderFormBatchDialog
