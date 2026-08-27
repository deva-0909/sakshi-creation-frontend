  "use client"
  import { useRef, useState, useEffect } from "react"
  import { Box, Typography, Paper, Button, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel } from "@mui/material"
  import ThemeInput from "@/component/common_component/themeinput"
  import ThemeButton from "@/component/common_component/themebutton"
  import BackButton from "@/component/common_component/BackButton"
  import StepperProgress from "@/component/common_component/stepperprogress"
  import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
  import FileUpload from "@/component/reusablecomponents/FileUpload"
  import { useRouter } from "next/router"
  import { useAppDispatch, useAppSelector } from "@/store"
  import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
  import { createJobCardThunk } from "@/store/slices/jobCardSlice"
  import DeliveryChallanPanel from "@/component/deliverychallanpanel"
  import { toast } from "react-toastify"
  import { useFormik } from "formik"
  import * as Yup from "yup"

  const activeStep = 0

  // QP order-process audit (2026-08-25): this page is the landing view for
  // every Quality Packaging order (see all-orders/index.tsx's getRouteByStatus,
  // which now always routes QP orders here rather than into any of Sakshi
  // Creation's legacy per-stage sub-pages). StepperProgress's default 6
  // steps and clickable Sakshi-only sub-page paths don't apply to QP, so it
  // gets its own read-only step list mirroring QUALITY_PACKAGING_STAGE_ORDER
  // (jobCard.controller.js) plus the Order Received/Completed bookends that
  // orders.status can also hold for QP (see the widened orders_status_check).
  const QP_STEPS = [
    { label: "Order Received", path: "" },
    { label: "Printer", path: "" },
    { label: "Binder", path: "" },
    { label: "Booklet Binder", path: "" },
    { label: "Factory", path: "" },
    { label: "Godown", path: "" },
    { label: "Completed", path: "" },
  ]
  const qpActiveStep = (status?: string) => {
    const index = QP_STEPS.findIndex((s) => s.label === status)
    return index === -1 ? 0 : index
  }

  interface FormValues {
    companyName: string
    partyName: string
    itemName: string
    size: string
    quantity: string
    number: string
    startNumber: string
    endNumber: string
    color: string
    pType: string
    customPType: string
    remarks: string
  }

  const ViewOrderPage = () => {
    const fileUploadRef = useRef<any>(null)
    const [openFilesDialog, setOpenFilesDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
    const router = useRouter()
    const dispatch = useAppDispatch()

    const { id: orderId } = router.query
    const { singleOrder } = useAppSelector((state: any) => state.orders)

    // Figma frame check follow-up (2026-08-27): Order Type (New Order / New
    // Pending Order / Ready) -- confirmed with the user as a pre-production
    // readiness state, manually set by staff, separate from the pipeline
    // status shown by StepperProgress above. Self-contained local state +
    // its own dispatch (not folded into the big page-submit formik above)
    // since it's a single-field, save-immediately control, the same shape
    // as a status dropdown rather than a multi-field form section.
    const [orderTypeSaving, setOrderTypeSaving] = useState(false)
    const handleOrderTypeChange = async (value: string) => {
      if (!orderId || typeof orderId !== "string") return
      setOrderTypeSaving(true)
      try {
        await dispatch(updateOrderThunk({ id: orderId, data: { orderType: value } })).unwrap()
        toast.success("Order type updated")
      } catch (error: any) {
        toast.error(error?.message || "Failed to update order type")
      } finally {
        setOrderTypeSaving(false)
      }
    }

    // QP order-to-factory Figma audit (2026-08-27): Delivery destination
    // (TO CLIENT / SAKSHI OFFICE / TO GODOWN) -- the Godown "New Order"
    // screen's Delivery field, confirmed with the user as a real field to
    // build. Self-contained local state + its own dispatch, same
    // save-immediately shape as Order Type above.
    const [deliveryDestinationSaving, setDeliveryDestinationSaving] = useState(false)
    const handleDeliveryDestinationChange = async (value: string) => {
      if (!orderId || typeof orderId !== "string") return
      setDeliveryDestinationSaving(true)
      try {
        await dispatch(updateOrderThunk({ id: orderId, data: { deliveryDestination: value } })).unwrap()
        toast.success("Delivery destination updated")
      } catch (error: any) {
        toast.error(error?.message || "Failed to update delivery destination")
      } finally {
        setDeliveryDestinationSaving(false)
      }
    }

    const formik = useFormik<FormValues>({
      initialValues: {
        companyName: "",
        partyName: "",
        itemName: "",
        size: "",
        quantity: "",
        number: "",
        startNumber: "",
        endNumber: "",
        color: "",
        pType: "",
        customPType: "",
        remarks: "",
      },
      validationSchema: Yup.object({
        size: Yup.string().required("Size is required"),
        number: Yup.string()
          .required("Number selection is required")
          .oneOf(["Yes", "No"], "Invalid number selection"),
        startNumber: Yup.string().when("number", {
          is: "Yes",
          then: (schema) => schema.required("Start Number is required when Number is Yes"),
          otherwise: (schema) => schema.notRequired(),
        }),
        endNumber: Yup.string().when("number", {
          is: "Yes",
          then: (schema) => schema.required("End Number is required when Number is Yes"),
          otherwise: (schema) => schema.notRequired(),
        }),
        color: Yup.string()
          .required("Color is required")
          .oneOf(["1", "2", "3", "4", "5", "6"], "Invalid color selection"),
        pType: Yup.string()
          .required("PType is required")
          .oneOf(["Offset", "Screen Printing", "Other"], "Invalid PType selection"),
        customPType: Yup.string().when("pType", {
          is: "Other",
          then: (schema) => schema.required("Custom PType is required when PType is Other"),
          otherwise: (schema) => schema.notRequired(),
        }),
      }),
      onSubmit: async (values) => {
        if (!orderId || typeof orderId !== "string") {
          toast.error("Order ID not found");
          return;
        }

        setLoading(true);
        try {
          let newFilePaths: any[] = [];
          if (fileUploadRef.current && typeof fileUploadRef.current.getSelectedFiles === "function") {
            const selectedFiles = fileUploadRef.current.getSelectedFiles() || [];
            if (selectedFiles.length > 0) {
              const uploadedFileResults = await fileUploadRef.current.uploadSelectedFiles();
              newFilePaths = uploadedFileResults.map((file: any) => ({
                path: file.path || `/${file.folder}/${file.filename}`, // Ensure path starts with /
                remark: "",
                uploadedAt: new Date(),
              }));
              setUploadedFiles((prev) => [...prev, ...newFilePaths]);
            }
          }

          const updateData = {
            size: values.size,
            number: values.number,
            startNumber: values.number === "Yes" ? values.startNumber : "",
            endNumber: values.number === "Yes" ? values.endNumber : "",
            color: values.color,
            pType: values.pType === "Other" ? values.customPType : values.pType,
            remarks: values.remarks,
            filePaths: [
              ...(Array.isArray(singleOrder?.filePaths)
                ? singleOrder.filePaths.map((f: any) => typeof f === 'string' ? f : f.path)
                : []),
              ...newFilePaths.map(f => f.path)
            ],
          };


          await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap();
          toast.success("Order updated successfully");
          router.push(`/admin/all-orders/view/designer?id=${orderId}`);
        } catch (error: any) {
          console.error("Error updating order:", error);
          toast.error(error.message || "Failed to update order");
        } finally {
          setLoading(false);
        }
      },

    })

    useEffect(() => {
      const fetchOrderData = async () => {
        if (!orderId || typeof orderId !== "string") {
          // toast.error("Invalid Order ID")
          setPageLoading(false)
          return
        }

        try {
          setPageLoading(true)
          const result = await dispatch(getOrderByIdThunk(orderId)).unwrap()
        } catch (err: any) {
          console.error("Failed to fetch order:", err)
          toast.error(err.message || "Failed to load order data")
        } finally {
          setPageLoading(false)
        }
      }

      fetchOrderData()
    }, [dispatch, orderId])

    useEffect(() => {
      if (singleOrder) {
        try {
          const pType = typeof singleOrder.pType === "string" && ["Offset", "Screen Printing"].includes(singleOrder.pType)
            ? singleOrder.pType
            : "Other"
          const customPType = typeof singleOrder.pType === "string" && !["Offset", "Screen Printing"].includes(singleOrder.pType)
            ? singleOrder.pType
            : ""
          const number = typeof singleOrder.number === "string" && ["Yes", "No"].includes(singleOrder.number)
            ? singleOrder.number
            : singleOrder.startNumber || singleOrder.endNumber
              ? "Yes"
              : "No"
          const color = typeof singleOrder.color === "string" && ["1", "2", "3", "4", "5", "6"].includes(singleOrder.color)
            ? singleOrder.color
            : ""

          formik.setValues({
            companyName: typeof singleOrder.companyName?.companyName === "string" ? singleOrder.companyName.companyName : "",
            partyName: typeof singleOrder.party?.partyName === "string" ? singleOrder.party.partyName : "",
            itemName: typeof singleOrder.productItem?.itemName === "string" ? singleOrder.productItem.itemName : "",
            size: typeof singleOrder.size === "string" ? singleOrder.size : "",
            quantity: typeof singleOrder.qty === "number" ? singleOrder.qty.toString() : "",
            number,
            startNumber: typeof singleOrder.startNumber === "string" ? singleOrder.startNumber : "",
            endNumber: typeof singleOrder.endNumber === "string" ? singleOrder.endNumber : "",
            color,
            pType,
            customPType,
            remarks: typeof singleOrder.remarks === "string" ? singleOrder.remarks : "",
          })
        } catch (error) {
          console.error("Error setting form values:", error)
          toast.error("Failed to initialize form values")
        }
      }
    }, [singleOrder])

    const handleViewFiles = () => {
      setOpenFilesDialog(true)
    }

    const handleCloseFilesDialog = () => {
      setOpenFilesDialog(false)
    }

    const handleFilesSelected = (files: File[]) => {
    }

    const handleUploadError = (error: string) => {
      console.error("Upload error:", error)
      toast.error(error)
    }

    const { user } = useAppSelector((state: any) => state.auth)
    const canCreateJobCard = user?.role?.permissions?.jobcard?.create
    const [creatingJobCard, setCreatingJobCard] = useState(false)

    const handleCreateJobCard = async () => {
      if (typeof orderId !== "string") return
      setCreatingJobCard(true)
      try {
        const jobCard = await dispatch(createJobCardThunk({ orderId, data: {} })).unwrap()
        toast.success("Job card created")
        router.push(`/admin/job-card/view/${(jobCard as any)._id}`)
      } catch (err: any) {
        toast.error(err?.message || err || "Failed to create job card")
      } finally {
        setCreatingJobCard(false)
      }
    }

    if (pageLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      )
    }

    return (
        <Box>
          <BackButton />
          {canCreateJobCard && (
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <ThemeButton
                onClick={handleCreateJobCard}
                disabled={creatingJobCard}
                sx={{ background: "#7F56D9", "&:hover": { background: "#53389E" } }}
              >
                {creatingJobCard ? "Creating Job Card..." : "Create Job Card"}
              </ThemeButton>
            </Box>
          )}
          {singleOrder?.companyName?.companyName === "Quality Packaging" ? (
            <StepperProgress
              activeStep={qpActiveStep(singleOrder?.status)}
              orderStatus={singleOrder?.status}
              steps={QP_STEPS}
              clickable={false}
            />
          ) : (
            <StepperProgress
              activeStep={0}
              orderStatus={singleOrder?.status}
            />
          )}

          {/* Flow-trace follow-up (2026-08-25): Quality Packaging's pipeline
              (Printer -> Binder -> Booklet Binder -> Factory -> Godown ->
              Completed) has no Delivery stage of its own -- unlike Sakshi
              Creation, whose legacy Delivery sub-page already mounts this
              exact panel. QP orders never route to that sub-page (see
              getRouteByStatus in all-orders/index.tsx), so without this a QP
              order could reach "Completed" with no vehicle/driver/package
              record and no proof-of-delivery ever entered anywhere. Shown
              directly on QP's own order-view page instead -- the panel is
              self-contained (fetches/dispatches its own data) and the
              backend's createDeliveryChallan has no company or stage gate,
              so this needed no backend change, only exposing it here. */}
          {singleOrder?.companyName?.companyName === "Quality Packaging" && typeof orderId === "string" && (
            <DeliveryChallanPanel orderId={orderId} orderQty={Number(singleOrder?.qty) || 0} />
          )}
          <Paper
            variant="outlined"
            sx={{
              borderColor: "#12B76A",
              borderWidth: 2,
              borderRadius: 2,
              p: 2,
              mb: 2,
              background: "#fff",
            }}
          >
            <Box display="flex" alignItems="center" borderBottom={1} pb={2} mb={2}>
              <Typography fontWeight={600} fontSize={16} mr={1}>
                Order Received
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                / Placed by {singleOrder?.createdBy?.firstName || "Unknown"} {singleOrder?.createdBy?.lastName || "Unknown"} [
                {singleOrder?.createdAt ? new Date(singleOrder.createdAt).toLocaleString() : "Unknown"}]
              </Typography>
              {singleOrder?.priority && singleOrder.priority !== "Normal" && (
                <Typography
                  fontSize={12}
                  fontWeight={600}
                  ml={1.5}
                  px={1}
                  py={0.3}
                  borderRadius={1}
                  sx={{
                    background: singleOrder.priority === "Urgent" ? "#FEE4E2" : singleOrder.priority === "High" ? "#FEF0C7" : "#F2F4F7",
                    color: singleOrder.priority === "Urgent" ? "#B42318" : singleOrder.priority === "High" ? "#B54708" : "#344054",
                  }}
                >
                  {singleOrder.priority}
                </Typography>
              )}
              {singleOrder?.customerPoNumber && (
                <Typography fontSize={12} color="text.secondary" ml={1.5}>
                  Customer PO: {singleOrder.customerPoNumber}
                </Typography>
              )}
              {singleOrder?.companyName?.companyName === "Quality Packaging" && (
                <FormControl size="small" sx={{ ml: 1.5, minWidth: 170 }}>
                  <InputLabel id="order-type-label">Order Type</InputLabel>
                  <Select
                    labelId="order-type-label"
                    label="Order Type"
                    value={singleOrder?.orderType || "New Order"}
                    disabled={orderTypeSaving}
                    onChange={(e) => handleOrderTypeChange(e.target.value as string)}
                  >
                    <MenuItem value="New Order">New Order</MenuItem>
                    <MenuItem value="New Pending Order">New Pending Order</MenuItem>
                    <MenuItem value="Ready">Ready</MenuItem>
                  </Select>
                </FormControl>
              )}
              {singleOrder?.companyName?.companyName === "Quality Packaging" && (
                <FormControl size="small" sx={{ ml: 1.5, minWidth: 170 }}>
                  <InputLabel id="delivery-destination-label">Delivery Destination</InputLabel>
                  <Select
                    labelId="delivery-destination-label"
                    label="Delivery Destination"
                    value={singleOrder?.deliveryDestination || "SAKSHI OFFICE"}
                    disabled={deliveryDestinationSaving}
                    onChange={(e) => handleDeliveryDestinationChange(e.target.value as string)}
                  >
                    <MenuItem value="TO CLIENT">TO CLIENT</MenuItem>
                    <MenuItem value="SAKSHI OFFICE">SAKSHI OFFICE</MenuItem>
                    <MenuItem value="TO GODOWN">TO GODOWN</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>

            <Box component="form" noValidate onSubmit={formik.handleSubmit}>
              <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={3}>
                <ThemeInput
                  labelName="Company Name"
                  value={formik.values.companyName}
                  name="companyName"
                  onChange={formik.handleChange}
                  sx={{ flex: 1 }}
                  disabled
                />
                <ThemeInput
                  labelName="Party Name"
                  value={formik.values.partyName}
                  name="partyName"
                  onChange={formik.handleChange}
                  sx={{ flex: 1 }}
                  disabled
                />
                <ThemeInput
                  labelName="Item Name"
                  value={formik.values.itemName}
                  name="itemName"
                  onChange={formik.handleChange}
                  sx={{ flex: 1 }}
                  disabled
                />
              <ThemeInput
                labelName="Size"
                value={formik.values.size}
                name="size"
                onChange={formik.handleChange}
                sx={{ flex: 1 }}
                error={formik.touched.size && Boolean(formik.errors.size)}
                helperText={formik.touched.size && formik.errors.size}
              />
              <ThemeInput
                labelName="Quantity"
                value={formik.values.quantity}
                name="quantity"
                onChange={formik.handleChange}
                sx={{ flex: 1 }}
                disabled
              />
              </Box>

              <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={3} flexWrap="wrap">
                
               
              <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} sx={{ width: "100%", alignItems: "flex-end" }}>
                <FormControl sx={{ flex: 1, minWidth: 120 }} error={formik.touched.number && Boolean(formik.errors.number)}>
                  <InputLabel id="number-label">Number</InputLabel>
                  <Select
                    labelId="number-label"
                    name="number"
                    value={formik.values.number}
                    onChange={formik.handleChange}
                    label="Number"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </Select>
                  {formik.touched.number && formik.errors.number && (
                    <Typography variant="caption" color="error">
                      {formik.errors.number}
                    </Typography>
                  )}
                </FormControl>
                {formik.values.number === "Yes" && (
                  <>
                    <ThemeInput
                      labelName="Start Number"
                      name="startNumber"
                      value={formik.values.startNumber}
                      onChange={formik.handleChange}
                      sx={{ flex: 1, minWidth: 120 }}
                      error={formik.touched.startNumber && Boolean(formik.errors.startNumber)}
                      helperText={formik.touched.startNumber && formik.errors.startNumber}
                    />
                    <ThemeInput
                      labelName="End Number"
                      name="endNumber"
                      value={formik.values.endNumber}
                      onChange={formik.handleChange}
                      sx={{ flex: 1, minWidth: 120 }}
                      error={formik.touched.endNumber && Boolean(formik.errors.endNumber)}
                      helperText={formik.touched.endNumber && formik.errors.endNumber}
                    />
                  </>
                )}
              </Box>
              <FormControl sx={{ flex: 1, minWidth: 120 }} error={formik.touched.color && Boolean(formik.errors.color)}>
                <InputLabel id="color-label">Color</InputLabel>
                <Select
                  labelId="color-label"
                  name="color"
                  value={formik.values.color}
                  onChange={formik.handleChange}
                  label="Color"
                >
                  <MenuItem value="">Select</MenuItem>
                  {/* Sakshi Creation order-process audit (2026-08-25): this only
                      rendered [1, 2, 4, 6], but the Yup schema above validates
                      the full ["1".."6"] range -- 3 and 5 were accepted by
                      validation yet unreachable from this dropdown. */}
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <MenuItem key={num} value={num.toString()}>
                      color - {num}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.color && formik.errors.color && (
                  <Typography variant="caption" color="error">
                    {formik.errors.color}
                  </Typography>
                )}
              </FormControl>
              <FormControl sx={{ flex: 1, minWidth: 120 }} error={formik.touched.pType && Boolean(formik.errors.pType)}>
                <InputLabel id="pType-label">PrinterType</InputLabel>
                <Select
                  labelId="pType-label"
                  name="pType"
                  value={formik.values.pType}
                  onChange={formik.handleChange}
                  label="PType"
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Offset">Offset</MenuItem>
                  <MenuItem value="Screen Printing">Screen Printing</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {formik.touched.pType && formik.errors.pType && (
                  <Typography variant="caption" color="error">
                    {formik.errors.pType}
                  </Typography>
                )}
              </FormControl>
              {formik.values.pType === "Other" && (
                <ThemeInput
                  labelName="Custom Pinting Type"
                  name="customPType"
                  value={formik.values.customPType}
                  onChange={formik.handleChange}
                  sx={{ flex: 1, minWidth: 120 }}
                  error={formik.touched.customPType && Boolean(formik.errors.customPType)}
                  helperText={formik.touched.customPType && formik.errors.customPType}
                />
              )}
              </Box>

              <Box mb={2}>
                <ThemeInput
                  labelName="Remarks"
                  value={formik.values.remarks}
                  placeholder="Enter Remarks"
                  name="remarks"
                  onChange={formik.handleChange}
                  sx={{ width: "100%" }}
                />
              </Box>

              <Box mb={2}>
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
                  helperText="Select order documents, images, or any related files "
                />
              </Box>

              <Box mb={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleViewFiles}
                  sx={{
                    color: "#344054",
                    borderColor: "#D0D5DD",
                    fontWeight: 600,
                    mb: 1,
                    textTransform: "none",
                    fontSize: 16,
                    py: 1.2,
                    background: "#fff",
                    "&:hover": { background: "#f6fef9", borderColor: "#D0D5DD" },
                  }}
                  startIcon={
                    <svg width="20" height="20" fill="none" style={{ marginRight: 4 }}>
                      <circle cx="10" cy="10" r="9" stroke="#98A2B3" strokeWidth="2" />
                      <circle cx="10" cy="10" r="3" fill="#98A2B3" />
                    </svg>
                  }
                >
                  View Files ({Array.isArray(singleOrder?.filePaths) ? singleOrder.filePaths.length : 0})
                </Button>
              </Box>

              <ThemeButton
                sx={{
                  background: "#12B76A",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  py: 1.2,
                  mt: 1,
                  "&:hover": { background: "#079455" },
                  width: "100%",
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Updating..." : "Save"}
              </ThemeButton>
          </Box>
        </Paper>

        <ViewFilesDialog
          open={openFilesDialog}
          onClose={handleCloseFilesDialog}
          files={
            Array.isArray(singleOrder?.filePaths) 
              ? singleOrder.filePaths.map((file: any) =>
                  typeof file === 'string'
                    ? file 
                    : file.path || `/${file.folder}/${file.filename}`
                )
              : []
          }
          title="Order Files"
          showDownload
          showView
          downloadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/filedownload/download`}
        />
      </Box>
    )
  }

  export default ViewOrderPage
