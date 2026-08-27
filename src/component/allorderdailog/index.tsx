"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Box, Stack, CircularProgress, FormControlLabel, Checkbox, FormControl, FormLabel, RadioGroup, Radio } from "@mui/material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import FileUpload, { type FileUploadRef } from "../reusablecomponents/FileUpload"
import CompanySelect from "../reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAccountMasterByCompanyAndPartyThunk } from "@/store/slices/accountMasterSlice"
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice"
import { createOrderThunk, clearOrderError, clearOrderSuccessMessage } from "@/store/slices/orderSlice"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface AddOrderDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<FileUploadRef>(null)

  // Redux state
  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { singleAccountMaster, loading: accountLoading } = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)
  // Two-company Phase 1 (claude/two-company-gap-analysis.md): CompanySelect
  // (below) already fetches this list into state.company -- reused here
  // just to resolve the selected company's name for the Qty/PCS label.
  const { companies } = useAppSelector((state) => state.company)
  // Box-costing follow-up (2026-08-27): the paper-material picker for the
  // Kantan-length/estimated-cost calculation below reuses the same
  // Material Master list already populated elsewhere in the app (e.g.
  // Purchase) -- no new endpoint needed.
  const { materials } = useAppSelector((state) => state.materials)

  const [formData, setFormData] = useState({
    companyName: "",
    partyName: "",
    personName: "",
    whatsapp: "",
    itemName: "",
    qty: "",
    gst: "",
    remarks: "",
    size: "", // New field
    rate: "", // New field
    rateType: "new", // New field: default to "new"
    // QP box-manufacturing Figma audit (2026-08-25) + flow-trace follow-up:
    // Ply/Deckal/GSM, shown on every Quality Packaging order screen in the
    // design alongside Size, but only meaningful for QP box orders -- shown
    // conditionally below. GSM already existed as a DB column (set from
    // SC's per-stage pages) but had no way to be entered on QP's own order
    // intake form, the only place the design actually shows it.
    ply: "",
    deckal: "",
    gsm: "",
    // Module 12: Sales Order commercial fields.
    customerPoNumber: "",
    priority: "Normal",
    // Module 14: powers the Delayed Jobs report.
    expectedDeliveryDate: "",
    // QP "New Order" Figma match (2026-08-27): the reference design for
    // Quality Packaging's own order-intake screen (as filled in by the
    // production manager) adds an order Date, an Order From (Factory/
    // Godown -- same pair PurchaseDialog already uses for QP's "purpose"),
    // a DYE number/size/sheet size/remark row, and separate Godown Remark
    // / Factory Remarks fields -- all QP-only, shown conditionally below
    // alongside Ply/Deckal/GSM.
    orderDate: "",
    orderFrom: "",
    dyeNumber: "",
    dyeSize: "",
    dyeSheetSize: "",
    dyeRemark: "",
    godownRemark: "",
    factoryRemarks: "",
    // Box-costing follow-up (2026-08-27): the QP box-manufacturing/Kantan/
    // costing audit found no working Kantan-length or box-cost formula
    // anywhere in the design or code -- both were confirmed directly with
    // the user: Kantan length (cm) = 2x(length+width); estimated box cost
    // = surface area(m2) x GSM x ply x the selected paper material's
    // purchase rate. These three feed both formulas server-side; the
    // computed values themselves are read-only (see the preview below) and
    // always come back from the API, never sent by the client.
    boxLengthCm: "",
    boxWidthCm: "",
    boxHeightCm: "",
    paperMaterial: "",
    // Figma frame check follow-up (2026-08-27): Order Type, confirmed with
    // the user as a pre-production readiness state (New Order / New
    // Pending Order / Ready), manually set by staff -- defaults to "New
    // Order" to match the design's own starting state for a freshly
    // placed order (the backend defaults the same way if this is omitted).
    orderType: "New Order",
  })

  const [gstNotApplicable, setGstNotApplicable] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemOptions, setItemOptions] = useState<OptionType[]>([])

  // Clear messages when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
      setGstNotApplicable(false)
    }
  }, [open, dispatch])

  // Handle success message
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearOrderSuccessMessage())
    }
  }, [successMessage, dispatch])

  // Handle error message
  useEffect(() => {
    if (orderError) {
      toast.error(orderError)
      dispatch(clearOrderError())
    }
  }, [orderError, dispatch])

  // Fetch product items when dialog opens, or when the selected company
  // changes (two-company Phase 1: scopes the picker to that company's own
  // items plus every unscoped/shared item -- see productItem.controller.js).
  useEffect(() => {
    if (open) {
      dispatch(getAllProductItemsThunk(formData.companyName ? { companyName: formData.companyName } : undefined))
    }
  }, [open, formData.companyName, dispatch])

  // Box-costing follow-up (2026-08-27): fetch the Material Master list once
  // the dialog opens, scoped to the selected company the same way product
  // items already are -- the paper-material picker below only needs
  // materials visible to that company.
  useEffect(() => {
    if (open) {
      dispatch(getAllMaterialsThunk(formData.companyName ? { companyName: formData.companyName } : undefined))
    }
  }, [open, formData.companyName, dispatch])

  // Set item options when product items are loaded
  useEffect(() => {
    if (productItems && productItems.length > 0) {
      const options = productItems.map((item) => ({
        label: item.itemName,
        value: item._id,
      }))
      setItemOptions(options)
    }
  }, [productItems])

  // Auto-fill form when account master data is loaded
  useEffect(() => {
    if (singleAccountMaster && (singleAccountMaster as any).accountMaster) {
      const accountData = (singleAccountMaster as any).accountMaster

      setFormData((prev) => ({
        ...prev,
        personName: accountData.party?.contactPerson || "",
        whatsapp: accountData.party?.personWhatsAppNo || "",
        gst: accountData.party?.GSTNo || "",
      }))
    }
  }, [singleAccountMaster])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGstCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGstNotApplicable(event.target.checked)
  }

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : ""
    handleChange("companyName", companyId)

    // Clear party name and auto-filled fields when company changes
    handleChange("partyName", "")
    handleChange("personName", "")
    handleChange("whatsapp", "")
    handleChange("gst", "")
    setGstNotApplicable(false)
    // Two-company Phase 1 (claude/two-company-gap-analysis.md): the item
    // picker is refetched scoped to the new company below, so a previously
    // selected item may no longer be in that list -- clear it rather than
    // silently submitting an item from the wrong company's catalog.
    handleChange("itemName", "")
  }

  const handlePartyChange = async (event: any, newValue: any) => {
    const partyId = newValue ? newValue.value : ""
    handleChange("partyName", partyId)

    if (formData.companyName && partyId) {
      try {
        await dispatch(
          getAccountMasterByCompanyAndPartyThunk({
            companyId: formData.companyName,
            partyId: partyId,
          })
        ).unwrap()
      } catch (error) {
        console.error("Failed to fetch account master data:", error)
        toast.error("Failed to load party details")
      }
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleUploadError = (error: string) => {
    toast.error(error)
  }

  // QP box-manufacturing Figma audit (2026-08-25): same lookup pattern as
  // quantityLabel below, hoisted above handleSubmit so both the submit
  // payload and the conditional Ply/Deckal fields can use it.
  const isQP = companies.find((c: any) => c._id === formData.companyName)?.companyName?.trim().toLowerCase() === "quality packaging"

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.partyName || !formData.itemName || !formData.qty) {
      toast.error("Please fill all required fields")
      return
    }

    if (Number.parseInt(formData.qty) <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    setIsSubmitting(true)

    try {
      let filePaths: string[] = []

      if (selectedFiles.length > 0 && fileUploadRef.current) {
        const uploadedFiles = await fileUploadRef.current.uploadSelectedFiles()
        filePaths = uploadedFiles.map((file) => file.path || file.url)
      }

      const orderData = {
        companyName: formData.companyName,
        party: formData.partyName,
        productItem: formData.itemName,
        qty: Number.parseInt(formData.qty),
        remarks: formData.remarks || "",
        filePaths: filePaths,
        gstStatus: gstNotApplicable ? "Not Applicable" : "Applicable",
        gstNumber: gstNotApplicable ? "" : formData.gst,
        isGst: !gstNotApplicable,
        size: formData.size || "", // Include size
        rate: formData.rate ? Number.parseFloat(formData.rate) : undefined, // Include rate (optional)
        rateType: formData.rate ? formData.rateType : undefined, // Include rateType only if rate is provided
        customerPoNumber: formData.customerPoNumber || undefined,
        priority: formData.priority || undefined,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        ply: isQP && formData.ply ? Number.parseFloat(formData.ply) : undefined,
        deckal: isQP && formData.deckal ? Number.parseFloat(formData.deckal) : undefined,
        gsm: isQP && formData.gsm ? Number.parseFloat(formData.gsm) : undefined,
        orderDate: isQP && formData.orderDate ? formData.orderDate : undefined,
        orderFrom: isQP && formData.orderFrom ? formData.orderFrom : undefined,
        dyeNumber: isQP && formData.dyeNumber ? formData.dyeNumber : undefined,
        dyeSize: isQP && formData.dyeSize ? formData.dyeSize : undefined,
        dyeSheetSize: isQP && formData.dyeSheetSize ? formData.dyeSheetSize : undefined,
        dyeRemark: isQP && formData.dyeRemark ? formData.dyeRemark : undefined,
        godownRemark: isQP && formData.godownRemark ? formData.godownRemark : undefined,
        factoryRemarks: isQP && formData.factoryRemarks ? formData.factoryRemarks : undefined,
        boxLengthCm: isQP && formData.boxLengthCm ? Number.parseFloat(formData.boxLengthCm) : undefined,
        boxWidthCm: isQP && formData.boxWidthCm ? Number.parseFloat(formData.boxWidthCm) : undefined,
        boxHeightCm: isQP && formData.boxHeightCm ? Number.parseFloat(formData.boxHeightCm) : undefined,
        paperMaterial: isQP && formData.paperMaterial ? formData.paperMaterial : undefined,
        orderType: isQP ? formData.orderType : undefined,
      }

      await dispatch(createOrderThunk(orderData)).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      console.error("Order creation error:", error)
      toast.error(error?.message || "Failed to create order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      companyName: "",
      partyName: "",
      personName: "",
      whatsapp: "",
      itemName: "",
      qty: "",
      gst: "",
      remarks: "",
      size: "",
      rate: "",
      rateType: "new",
      customerPoNumber: "",
      priority: "Normal",
      expectedDeliveryDate: "",
      orderType: "New Order",
      ply: "",
      deckal: "",
      gsm: "",
      orderDate: "",
      orderFrom: "",
      dyeNumber: "",
      dyeSize: "",
      dyeSheetSize: "",
      dyeRemark: "",
      godownRemark: "",
      factoryRemarks: "",
      boxLengthCm: "",
      boxWidthCm: "",
      boxHeightCm: "",
      paperMaterial: "",
    })
    setGstNotApplicable(false)
    setSelectedFiles([])
    if (fileUploadRef.current) {
      fileUploadRef.current.clearSelectedFiles()
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null
  }

  // Two-company Phase 1 (claude/two-company-gap-analysis.md): the Figma
  // reference labels this field "Qty" for Sakshi Creation (printed items)
  // and "PCS" for Quality Packaging (boxes, piece-counted). Matched by
  // name rather than a fixed id since company_names has no "type" column
  // to key off instead -- falls back to "Qty" for any other/future company.
  const quantityLabel = isQP ? "PCS" : "Qty"

  // Box-costing follow-up (2026-08-27): a client-side preview only, using
  // the exact same two formulas order.controller.js computes and stores
  // server-side (lib/boxCalculations.js) -- purely so the production
  // manager sees a live estimate while typing box dimensions, before
  // submitting. The value actually saved always comes back from the create
  // response, never from this preview.
  const boxLength = Number.parseFloat(formData.boxLengthCm)
  const boxWidth = Number.parseFloat(formData.boxWidthCm)
  const previewKantanLengthCm =
    boxLength > 0 && boxWidth > 0 ? Number((2 * (boxLength + boxWidth)).toFixed(2)) : null
  // Estimated box cost also needs the paper material's purchase rate,
  // which this dialog doesn't load (Purchase, not Material Master, tracks
  // rate) -- deliberately left out of this live preview rather than
  // faked from something else, so nothing shown here is ever a fabricated
  // number. The real figure comes back from the create response once
  // saved, computed server-side from the actual rate.

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="Place New Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={formData.companyName}
            onChange={handleCompanyChange}
            hasParties={true}
            required
            showPartyName={true}
            partyName={formData.partyName}
            onPartyChange={handlePartyChange}
          />
        </Box>

        {isQP && (
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeInput
              labelName="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.orderDate}
              onChange={(e) => handleChange("orderDate", e.target.value)}
            />
            <ThemeSelect
              label="Order From"
              value={formData.orderFrom ? { label: formData.orderFrom, value: formData.orderFrom } : null}
              options={[
                { label: "FACTORY", value: "FACTORY" },
                { label: "GODOWN", value: "GODOWN" },
              ]}
              onChange={(_, v) => handleChange("orderFrom", v ? v.value : "")}
            />
          </Stack>
        )}

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Person Name"
            placeholder="Person"
            fullWidth
            value={formData.personName}
            onChange={(e) => handleChange("personName", e.target.value)}
            disabled={!!singleAccountMaster}
            sx={{
              "& .MuiInputBase-input": {
                backgroundColor: singleAccountMaster ? "#f5f5f5" : "transparent",
              },
            }}
          />
          <ThemeInput
            labelName="WhatsApp no."
            placeholder="98233-12342"
            fullWidth
            value={formData.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            disabled={!!singleAccountMaster}
            sx={{
              "& .MuiInputBase-input": {
                backgroundColor: singleAccountMaster ? "#f5f5f5" : "transparent",
              },
            }}
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="Item Name"
            value={getSelectedOption(formData.itemName, itemOptions)}
            options={itemOptions}
            onChange={(_, v) => handleChange("itemName", v ? v.value : "")}
            disabled={productLoading}
            required
          />
          <ThemeInput
            labelName={quantityLabel}
            placeholder="200"
            fullWidth
            type="number"
            value={formData.qty}
            onChange={(e) => handleChange("qty", e.target.value)}
            required
          />
          <ThemeInput
            labelName="Size"
            placeholder="Enter size (e.g., A4)"
            fullWidth
            value={formData.size}
            onChange={(e) => handleChange("size", e.target.value)}
          />
        </Stack>

        {isQP && (
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeInput
              labelName="Ply"
              placeholder="Enter ply"
              fullWidth
              type="number"
              value={formData.ply}
              onChange={(e) => handleChange("ply", e.target.value)}
            />
            <ThemeInput
              labelName="GSM"
              placeholder="Enter GSM"
              fullWidth
              type="number"
              value={formData.gsm}
              onChange={(e) => handleChange("gsm", e.target.value)}
            />
            <ThemeInput
              labelName="Deckal"
              placeholder="Enter deckal"
              fullWidth
              type="number"
              value={formData.deckal}
              onChange={(e) => handleChange("deckal", e.target.value)}
            />
          </Stack>
        )}

        {isQP && (
          <>
            <Stack direction="row" spacing={2} mb={2}>
              <ThemeInput
                labelName="Box Length (cm)"
                placeholder="20"
                fullWidth
                type="number"
                value={formData.boxLengthCm}
                onChange={(e) => handleChange("boxLengthCm", e.target.value)}
              />
              <ThemeInput
                labelName="Box Width (cm)"
                placeholder="20"
                fullWidth
                type="number"
                value={formData.boxWidthCm}
                onChange={(e) => handleChange("boxWidthCm", e.target.value)}
              />
              <ThemeInput
                labelName="Box Height (cm)"
                placeholder="23"
                fullWidth
                type="number"
                value={formData.boxHeightCm}
                onChange={(e) => handleChange("boxHeightCm", e.target.value)}
              />
              <ThemeSelect
                label="Paper Material"
                value={
                  formData.paperMaterial
                    ? {
                        label: materials.find((m) => m._id === formData.paperMaterial)?.materialName || "",
                        value: formData.paperMaterial,
                      }
                    : null
                }
                options={materials.map((m) => ({ label: m.materialName, value: m._id }))}
                onChange={(_, v) => handleChange("paperMaterial", v ? v.value : "")}
              />
            </Stack>
            {previewKantanLengthCm !== null && (
              <Box sx={{ mb: 2, mt: -1, fontSize: 13, color: "#667085" }}>
                Estimated Kantan length: <strong>{previewKantanLengthCm} cm</strong> (2 × (length + width)). Estimated
                cost will be calculated and shown on the order once saved.
              </Box>
            )}
          </>
        )}

        <Stack direction="row" spacing={2} mb={2}>
          <Box sx={{ width: "100%" }}>
            <ThemeInput
              labelName="Rate"
              placeholder="Enter rate"
              fullWidth
              type="number"
              value={formData.rate}
              onChange={(e) => handleChange("rate", e.target.value)}
            />
            {formData.rate && (
              <FormControl component="fieldset" sx={{ mt: 1 }}>
                <FormLabel component="legend">Rate Type</FormLabel>
                <RadioGroup
                  row
                  value={formData.rateType}
                  onChange={(e) => handleChange("rateType", e.target.value)}
                >
                  <FormControlLabel value="old" control={<Radio />} label="Old Rate" />
                  <FormControlLabel value="new" control={<Radio />} label="New Rate" />
                </RadioGroup>
              </FormControl>
            )}
          </Box>
          <Box sx={{ width: "100%" }}>
            <ThemeInput
              labelName="GST Number"
              placeholder="Enter GST number"
              fullWidth
              value={gstNotApplicable ? "Not Applicable" : formData.gst}
              onChange={(e) => {}}
              disabled={true}
              sx={{
                "& .MuiInputBase-input": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            />
          </Box>
        </Stack>

        {isQP && (
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeInput
              labelName="DYE Number"
              placeholder="Enter DYE number"
              fullWidth
              value={formData.dyeNumber}
              onChange={(e) => handleChange("dyeNumber", e.target.value)}
            />
            <ThemeInput
              labelName="DYE Size"
              placeholder="Enter DYE size"
              fullWidth
              value={formData.dyeSize}
              onChange={(e) => handleChange("dyeSize", e.target.value)}
            />
            <ThemeInput
              labelName="DYE Sheet Size"
              placeholder="Enter DYE sheet size"
              fullWidth
              value={formData.dyeSheetSize}
              onChange={(e) => handleChange("dyeSheetSize", e.target.value)}
            />
            <ThemeInput
              labelName="DYE Remark"
              placeholder="Enter DYE remark"
              fullWidth
              value={formData.dyeRemark}
              onChange={(e) => handleChange("dyeRemark", e.target.value)}
            />
          </Stack>
        )}

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Customer PO Number"
            placeholder="Customer's own purchase order reference (optional)"
            fullWidth
            value={formData.customerPoNumber}
            onChange={(e) => handleChange("customerPoNumber", e.target.value)}
          />
          <ThemeSelect
            label="Priority"
            value={{ label: formData.priority, value: formData.priority }}
            options={[
              { label: "Low", value: "Low" },
              { label: "Normal", value: "Normal" },
              { label: "High", value: "High" },
              { label: "Urgent", value: "Urgent" },
            ]}
            onChange={(_, v) => handleChange("priority", v ? v.value : "Normal")}
          />
          {isQP && (
            <ThemeSelect
              label="Order Type"
              value={{ label: formData.orderType, value: formData.orderType }}
              options={[
                { label: "New Order", value: "New Order" },
                { label: "New Pending Order", value: "New Pending Order" },
                { label: "Ready", value: "Ready" },
              ]}
              onChange={(_, v) => handleChange("orderType", v ? v.value : "New Order")}
            />
          )}
        </Stack>

        {isQP && (
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeInput
              labelName="Godown Remark"
              placeholder="Enter godown remark"
              fullWidth
              value={formData.godownRemark}
              onChange={(e) => handleChange("godownRemark", e.target.value)}
            />
            <ThemeInput
              labelName="Factory Remarks"
              placeholder="Enter factory remarks"
              fullWidth
              value={formData.factoryRemarks}
              onChange={(e) => handleChange("factoryRemarks", e.target.value)}
            />
          </Stack>
        )}

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            // QP's Figma reference labels this field "Delivery"; Sakshi
            // Creation's own order form keeps the fuller "Expected Delivery
            // Date" label -- same underlying expectedDeliveryDate field and
            // API contract either way, just the label the production
            // manager sees changes with the active company.
            labelName={isQP ? "Delivery" : "Expected Delivery Date"}
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.expectedDeliveryDate}
            onChange={(e) => handleChange("expectedDeliveryDate", e.target.value)}
          />
        </Stack>

        <ThemeInput
          labelName="Remarks"
          placeholder="Enter Remarks"
          fullWidth
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <FileUpload
            ref={fileUploadRef}
            folder="orders"
            multiple={true}
            accept="*/*"
            variant="dropzone"
            onFilesSelected={handleFilesSelected}
            onUploadError={handleUploadError}
            showPreview={false}
            showUploadButton={false}
            autoUpload={false}
            label="Attach Order Files"
            helperText="Select order documents, images, or any related files"
          />
        </Box>

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || accountLoading || productLoading || orderLoading}
          sx={{
            background: "#12B76A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#079455" },
            "&:disabled": {
              background: "#ccc",
              color: "#666",
            },
          }}
        >
          {isSubmitting || orderLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating Order...
            </Box>
          ) : accountLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Loading Party Details...
            </Box>
          ) : (
            "Place New Order"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddOrderDialog