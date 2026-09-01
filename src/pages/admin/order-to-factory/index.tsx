import React, { useEffect, useState, useMemo } from "react"
import { Box, IconButton, TableCell, Typography, InputBase } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import AddOrderDialog from "@/component/allorderdailog"
import OrderFormBatchDialog from "@/component/orderformbatchdialog"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllOrdersThunk, type Order } from "@/store/slices/orderSlice"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch } from "react-icons/fi"
import { displayOrderToFactoryStatus } from "@/utils/taskStatusDisplay"

// Order To Factory page (Build 4, Godown Manager role, 2026-08-27 Figma
// audit -- claude/full-figma-slide-scan.md, Slide 16 "Godown > Order To
// Factory"). Deliberately a thin, filtered relabel of the existing All
// Orders list (all-orders/index.tsx) rather than a separate data path:
// same thunk, same fetch/filter/pagination pattern, same AddOrderDialog --
// just scoped to Quality Packaging orders placed from the Godown
// (orderFrom === "GODOWN") and shown with the Figma frame's own column set
// instead of All Orders' fuller one. all-orders/index.tsx itself is not
// touched by this page at all.
const columns = [
  { id: "orderNumber", label: "Order No." },
  { id: "date", label: "Date" },
  { id: "size", label: "Size" },
  { id: "ply", label: "Ply" },
  { id: "party", label: "Party" },
  { id: "deckal", label: "Deckal" },
  { id: "rate", label: "Rate" },
  { id: "gsm", label: "GSM" },
  { id: "pcs", label: "PCS" },
  { id: "orderStatus", label: "Status" },
  // Figma "godown > order from" / "godown > order1" frames (node-ids
  // 261:9028 / 261:8352): each line item within an Order Form shows a
  // short status code alongside its full status chip -- "P" for Pending,
  // etc.
  { id: "st", label: "ST" },
  { id: "startDate", label: "Start Date" },
  { id: "deliveryDate", label: "Delivery Date" },
  // Already returned by order.controller.js's ORDER_SELECT (Patch 87/88)
  // but never surfaced on this list -- the Godown "New Order" / Order Form
  // Figma frames show both as their own columns.
  { id: "godownRemark", label: "Godown Remark" },
  { id: "factoryRemarks", label: "Factory Remarks" },
  // Figma shows an "AMOUNT??" column with no formula behind it anywhere in
  // the design or code (the audit's own note, restated in
  // qp-box-manufacturing-kantan-figma-audit.md) -- rather than reproduce a
  // meaningless placeholder, this uses the real (if, as of this patch,
  // always-null -- see orderSlice.ts's Order.estimatedBoxCost comment)
  // estimatedBoxCost field, clearly labeled as an estimate rather than a
  // real invoiced amount.
  { id: "estimatedBoxCost", label: "Est. Box Cost" },
]

type OrderRow = Order & { id: string }

const OrderToFactoryPage = () => {
  const [open, setOpen] = React.useState(false)
  // Order Form batch-entry dialog (Godown Manager Figma audit, Patch 108):
  // separate open state from the existing single "+ Place New Order"
  // dialog above -- the two are independent entry points onto the same
  // list.
  const [batchOpen, setBatchOpen] = React.useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { orders, loading, error } = useAppSelector((state) => state.orders)

  const { user } = useAppSelector((state) => state.auth)
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany)
  const { companies } = useAppSelector((state) => state.company)
  // This page only ever deals in Quality Packaging/Godown orders (see the
  // orderFrom: "GODOWN" filter below) -- resolve QP's own company id by
  // name the same way AddOrderDialog's isQP check does, falling back to
  // whatever company is active in the global toggle.
  const qpCompanyId =
    companies.find((c: any) => c.companyName?.trim().toLowerCase() === "quality packaging")?._id ||
    activeCompanyId ||
    ""

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({})

  // Patch 116: the Godown Manager role is scoped to only "order_to_factory"
  // (not "all_orders" itself, which would also surface the separate "All
  // Orders" nav item) -- see Dashboard/index.tsx's matching permissionMapping
  // comment and Patch 115's backend authorizeView widening. Checks either
  // key so every existing caller relying on "all_orders" is unaffected.
  const canViewGlobal =
    user?.role?.permissions?.all_orders?.view_global || user?.role?.permissions?.order_to_factory?.view_global
  const canViewOwn =
    user?.role?.permissions?.all_orders?.view_own || user?.role?.permissions?.order_to_factory?.view_own
  // Functional audit fix: "+ Place New Order" had no permission check at
  // all (unlike canViewGlobal/canViewOwn just above), so any staff member
  // who could merely view this list could also create orders through it.
  // Mirrors the same all_orders/order_to_factory OR pattern used above.
  const canCreate =
    user?.role?.permissions?.all_orders?.create || user?.role?.permissions?.order_to_factory?.create

  const filterFieldToKey: { [key: string]: string } = {
    "Order No.": "orderNumber",
    Date: "createdAt",
    Size: "size",
    Ply: "ply",
    Party: "party.partyName",
    Deckal: "deckal",
    Rate: "rate",
    GSM: "gsm",
    PCS: "qty",
    Status: "orderStatus",
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "N/A"
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })
  }

  // Fetch Quality Packaging orders placed from the Godown. `orderFrom` is
  // an additive server-side filter added alongside this page (see
  // order.controller.js's getAllOrders) -- every other caller of this same
  // thunk/endpoint that omits it keeps behaving exactly as before.
  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/login")
      return
    }

    if (canViewGlobal) {
      dispatch(
        getAllOrdersThunk({
          limit: 100,
          companyName: activeCompanyId || undefined,
          orderFrom: "GODOWN",
        })
      )
    } else if (canViewOwn) {
      // view_own staff still only see orders the backend's own
      // viewOwnFilter scopes to them -- orderFrom narrows that same result
      // further to Godown-originated orders.
      dispatch(getAllOrdersThunk({ limit: 100, orderFrom: "GODOWN" }))
    }
  }, [dispatch, router, canViewGlobal, canViewOwn, activeCompanyId])

  // Godown orders only exist for Quality Packaging today, but this filters
  // defensively on orderFrom regardless of company in case that ever
  // changes, and covers any stale client-side cache from before the
  // server-side filter existed.
  const godownOrders = useMemo(
    () => orders.filter((order) => (order as any).orderFrom === "GODOWN"),
    [orders]
  )

  const getUniqueValues = useMemo(() => {
    if (!selectedFilterField) return []
    const columnId = columns.find((col) => col.label === selectedFilterField)?.id
    if (!columnId) return []

    const values = godownOrders.map((order) => {
      switch (columnId) {
        case "orderNumber":
          return order.orderNumber
        case "date":
          return formatDate(order.createdAt)
        case "size":
          return order.size
        case "ply":
          return (order as any).ply !== undefined && (order as any).ply !== null ? String((order as any).ply) : undefined
        case "party":
          return order.party?.partyName
        case "deckal":
          return (order as any).deckal !== undefined && (order as any).deckal !== null ? String((order as any).deckal) : undefined
        case "rate":
          return order.rate !== undefined && order.rate !== null ? String(order.rate) : undefined
        case "gsm":
          return order.gsm !== undefined && order.gsm !== null ? String(order.gsm) : undefined
        case "pcs":
          return order.qty !== undefined && order.qty !== null ? String(order.qty) : undefined
        case "orderStatus":
          return displayOrderToFactoryStatus(order.status)
        default:
          return undefined
      }
    })

    return Array.from(new Set(values.filter((v): v is string => !!v && v !== "N/A"))).sort()
  }, [selectedFilterField, godownOrders])

  const filteredOrders = useMemo(() => {
    return godownOrders.filter((order) => {
      const matchesDateRange =
        (!startDate || new Date(order.createdAt).getTime() >= new Date(startDate).setHours(0, 0, 0, 0)) &&
        (!endDate || new Date(order.createdAt).getTime() <= new Date(endDate).setHours(23, 59, 59, 999))

      const matchesSearch = searchQuery
        ? order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      const matchesFilters = Object.keys(filters).every((columnId) => {
        if (filters[columnId].length === 0) return true
        let value: string | undefined
        switch (columnId) {
          case "orderNumber":
            value = order.orderNumber
            break
          case "date":
            value = formatDate(order.createdAt)
            break
          case "size":
            value = order.size
            break
          case "ply":
            value = (order as any).ply !== undefined && (order as any).ply !== null ? String((order as any).ply) : undefined
            break
          case "party":
            value = order.party?.partyName
            break
          case "deckal":
            value = (order as any).deckal !== undefined && (order as any).deckal !== null ? String((order as any).deckal) : undefined
            break
          case "rate":
            value = order.rate !== undefined && order.rate !== null ? String(order.rate) : undefined
            break
          case "gsm":
            value = order.gsm !== undefined && order.gsm !== null ? String(order.gsm) : undefined
            break
          case "pcs":
            value = order.qty !== undefined && order.qty !== null ? String(order.qty) : undefined
            break
          case "orderStatus":
            value = displayOrderToFactoryStatus(order.status)
            break
        }
        return value !== undefined && filters[columnId].includes(value)
      })

      return matchesDateRange && matchesSearch && matchesFilters
    })
  }, [godownOrders, startDate, endDate, searchQuery, filters])

  // Order Form grouping (Godown Manager Figma audit, Patch 108): the Figma
  // "godown > order from" frame groups several order rows under one Order
  // Form (e.g. "QP-001"). Orders with no form (the common case -- this
  // grouping is Godown/QP-batch-entry-specific) stay flat, exactly where
  // filteredOrders already puts them. Grouped orders are clustered
  // together -- even if other ungrouped rows fall between them by date --
  // under one header row inserted at the position of the group's first
  // (most recent) member, so a whole form always reads as one block.
  type GroupedRow = { kind: "header"; id: string; formNumber: string } | { kind: "order"; id: string; order: OrderRow }
  const groupedRows: GroupedRow[] = useMemo(() => {
    const seenForms = new Set<string>()
    const result: GroupedRow[] = []
    filteredOrders.forEach((order) => {
      const formId = order.orderForm?.id
      const formNumber = order.orderForm?.orderFormNumber
      if (formId && formNumber) {
        if (!seenForms.has(formId)) {
          seenForms.add(formId)
          result.push({ kind: "header", id: `form-header-${formId}`, formNumber })
          // Pull every member of this form in from the full filtered list,
          // in their own list order, right after the header -- keeps the
          // group contiguous regardless of where each member's createdAt
          // placed it in the overall date-sorted list.
          filteredOrders
            .filter((o) => o.orderForm?.id === formId)
            .forEach((o) => result.push({ kind: "order", id: o._id, order: { ...o, id: o._id } }))
        }
        // else: already emitted as part of the group above
      } else {
        result.push({ kind: "order", id: order._id, order: { ...order, id: order._id } })
      }
    })
    return result
  }, [filteredOrders])

  const handleRowClick = (row: OrderRow) => {
    router.push(`/admin/all-orders/view?id=${row._id}`)
  }

  const StatusChip = ({ row }: { row: OrderRow }) => {
    const text = displayOrderToFactoryStatus(row.status)
    const CHIP_COLOR: Record<string, { bg: string; color: string }> = {
      Hold: { bg: "#FEE4E2", color: "#B42318" },
      "In-Progress": { bg: "#FEF0C7", color: "#B54708" },
      Order: { bg: "#D1FADF", color: "#027A48" },
    }
    const { bg, color } = CHIP_COLOR[text] || CHIP_COLOR["In-Progress"]
    return (
      <Box
        component="span"
        sx={{
          display: "inline-block",
          px: 1.25,
          py: 0.375,
          borderRadius: 1,
          fontSize: 12,
          fontWeight: 600,
          bgcolor: bg,
          color,
        }}
      >
        {text}
      </Box>
    )
  }

  if (loading) return <Typography>Loading orders...</Typography>
  if (error) return <Typography color="error">Error: {error}</Typography>

  // BasicTable's rowData is now GroupedRow[] (header pseudo-rows + order
  // rows, see groupedRows above) rather than a flat OrderRow[] -- these
  // accessors read through `row.order` and blank out header rows so CSV
  // export still lists one line per real order.
  const csvColumns = [
    { id: "orderFormNumber", label: "Order Form", value: (row: GroupedRow) => (row.kind === "order" ? row.order.orderForm?.orderFormNumber || "" : "") },
    { id: "orderNumber", label: "Order No.", value: (row: GroupedRow) => (row.kind === "order" ? row.order.orderNumber || "N/A" : "") },
    { id: "date", label: "Date", value: (row: GroupedRow) => (row.kind === "order" ? formatDate(row.order.createdAt) : "") },
    { id: "size", label: "Size", value: (row: GroupedRow) => (row.kind === "order" ? row.order.size || "N/A" : "") },
    { id: "ply", label: "Ply", value: (row: GroupedRow) => (row.kind === "order" ? (row.order as any).ply ?? "N/A" : "") },
    { id: "party", label: "Party", value: (row: GroupedRow) => (row.kind === "order" ? row.order.party?.partyName || "N/A" : "") },
    { id: "deckal", label: "Deckal", value: (row: GroupedRow) => (row.kind === "order" ? (row.order as any).deckal ?? "N/A" : "") },
    { id: "rate", label: "Rate", value: (row: GroupedRow) => (row.kind === "order" ? row.order.rate ?? "N/A" : "") },
    { id: "gsm", label: "GSM", value: (row: GroupedRow) => (row.kind === "order" ? row.order.gsm ?? "N/A" : "") },
    { id: "pcs", label: "PCS", value: (row: GroupedRow) => (row.kind === "order" ? row.order.qty ?? "N/A" : "") },
    { id: "orderStatus", label: "Status", value: (row: GroupedRow) => (row.kind === "order" ? displayOrderToFactoryStatus(row.order.status) : "") },
    { id: "st", label: "ST", value: (row: GroupedRow) => (row.kind === "order" && row.order.status ? row.order.status.charAt(0).toUpperCase() : "") },
    { id: "startDate", label: "Start Date", value: (row: GroupedRow) => (row.kind === "order" ? formatDate((row.order as any).orderDate) : "") },
    { id: "deliveryDate", label: "Delivery Date", value: (row: GroupedRow) => (row.kind === "order" ? formatDate(row.order.expectedDeliveryDate) : "") },
    { id: "godownRemark", label: "Godown Remark", value: (row: GroupedRow) => (row.kind === "order" ? row.order.godownRemark || "N/A" : "") },
    { id: "factoryRemarks", label: "Factory Remarks", value: (row: GroupedRow) => (row.kind === "order" ? row.order.factoryRemarks || "N/A" : "") },
    { id: "estimatedBoxCost", label: "Est. Box Cost", value: (row: GroupedRow) => (row.kind === "order" ? (row.order as any).estimatedBoxCost ?? "N/A" : "") },
  ]

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date)}
            onEndDateChange={(date) => setEndDate(date)}
          />
          <ThemeButton
            onClick={() => {
              setStartDate(null)
              setEndDate(null)
            }}
          >
            Clear Date Range
          </ThemeButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              px: 1.5,
              width: { xs: "100%", sm: 200 },
              height: 35,
            }}
          >
            <IconButton size="small" sx={{ color: "#98A2B3" }}>
              <FiSearch size={18} />
            </IconButton>
            <InputBase
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ ml: 1, fontSize: 14 }}
            />
          </Box>
          <FilterDropdown
            filterOptions={columns.map((col) => col.label)}
            uniqueValues={selectedFilterField ? getUniqueValues : []}
            onFiltersChange={(newFilters) => {
              const idBasedFilters: { [key: string]: string[] } = {}
              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = columns.find((col) => col.label === label)?.id
                if (columnId) idBasedFilters[columnId] = values
              })
              setFilters(idBasedFilters)
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = columns.find((col) => col.id === columnId)?.label
              if (columnLabel) acc[columnLabel] = filters[columnId]
              return acc
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          {canCreate && <ThemeButton onClick={() => setOpen(true)}>+ Place New Order</ThemeButton>}
          {/* Order Form batch-entry dialog (Godown Manager Figma audit,
              Patch 108): a separate entry point from the single-order
              dialog above -- opens the multi-row inline form that creates
              one Order Form (e.g. "QP-001") grouping N orders together.
              Also gated on canCreate -- it creates orders the same as the
              button above, so it had the same missing-permission-check gap. */}
          {canCreate && (
            <ThemeButton
              onClick={() => setBatchOpen(true)}
              sx={{ background: "#fff", color: "#12B76A", border: "1px solid #12B76A" }}
            >
              + New Order Form
            </ThemeButton>
          )}
        </Box>
      </Box>

      <Box px={2} py={2}>
        <BasicTable
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          rowData={groupedRows}
          csvColumns={csvColumns}
          exportFilename="order-to-factory"
          renderRow={(gRow: GroupedRow) => {
            if (gRow.kind === "header") {
              return (
                <TableCell colSpan={columns.length} sx={{ bgcolor: "#F9FAFB", borderBottom: "1px solid #EAECF0" }}>
                  <Typography fontWeight={700} fontSize="13px" color="#344054">
                    Order Form: {gRow.formNumber}
                  </Typography>
                </TableCell>
              )
            }

            const row = gRow.order

            return (
              <>
                <TableCell>
                  <Typography
                    fontWeight={600}
                    fontSize="14px"
                    color="#111827"
                    sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                    onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                  >
                    {row.orderNumber || "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {formatDate(row.createdAt)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.size || "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {(row as any).ply ?? "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.party?.partyName || "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {(row as any).deckal ?? "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.rate ?? "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.gsm ?? "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.qty ?? "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <StatusChip row={row} />
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.status ? row.status.charAt(0).toUpperCase() : "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {formatDate((row as any).orderDate)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {formatDate(row.expectedDeliveryDate)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.godownRemark || "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {row.factoryRemarks || "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography fontSize="14px" color="#6B7280">
                    {(row as any).estimatedBoxCost ?? "N/A"}
                  </Typography>
                </TableCell>
              </>
            )
          }}
        />
      </Box>

      {/* Godown-scoped entry point: same dialog every other "+ Add New
          Order" button opens, just with Order From pre-filled and locked
          to GODOWN (see allorderdailog/index.tsx's defaultOrderFrom prop). */}
      <AddOrderDialog open={open} onClose={() => setOpen(false)} defaultOrderFrom="GODOWN" />

      {/* Order Form batch-entry dialog (Patch 108): groups N order rows
          entered together into one Order Form, locked to QP/GODOWN same as
          the single-order dialog above. */}
      <OrderFormBatchDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        companyId={qpCompanyId}
        defaultOrderFrom="GODOWN"
      />
    </>
  )
}

export default OrderToFactoryPage
