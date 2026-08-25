import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, TableCell, Typography } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { FaChevronRight } from "react-icons/fa6"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import AddOrderDialog from "@/component/allorderdailog"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllOrdersThunk, getOrdersByStaffIdThunk, type Order } from "@/store/slices/orderSlice"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch } from "react-icons/fi"
import { InputBase } from "@mui/material"

const columns = [
  { id: "company", label: "Company" },
  { id: "party", label: "Party" },
  { id: "orderNumber", label: "Order No." },
  { id: "date", label: "Date" },
  { id: "item", label: "Item Name" },
  { id: "size", label: "Size" },
  { id: "remarks", label: "Remarks" },
  { id: "orderedBy", label: "Ordered By" },
  // Sakshi Creation order-process audit (2026-08-25): `priority` is a real
  // order field (used elsewhere, e.g. on delivery challans) that had no
  // column on this list at all -- reconfirmed as a known gap while auditing
  // this page, added here.
  { id: "priority", label: "Priority" },
  { id: "orderStatus", label: "Order Status" },
]

const PRIORITY_COLOR: Record<string, { bg: string; color: string }> = {
  Urgent: { bg: "#FEE4E2", color: "#B42318" },
  High: { bg: "#FEF0C7", color: "#B54708" },
  Normal: { bg: "#F2F4F7", color: "#344054" },
  Low: { bg: "#EFF8FF", color: "#175CD3" },
}

type OrderRow = Order & { id: string }

const AllOrdersPage = () => {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { orders, loading, error,totalCount, pagination } = useAppSelector((state) => state.orders)

  const { user } = useAppSelector((state) => state.auth)
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany)

  // Filter state
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [selectedFilterValues, setSelectedFilterValues] = useState<string[] | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
const [filters, setFilters] = useState<{ [key: string]: string[] }>({});

  const canViewGlobal = user?.role?.permissions?.all_orders?.view_global
  const canViewOwn = user?.role?.permissions?.all_orders?.view_own
  const canCreate = user?.role?.permissions?.all_orders?.create

  // Map filter labels to data properties (including nested paths)
  const filterFieldToKey: { [key: string]: string } = {
    "Company": "companyName.companyName",
    "Party": "party.partyName",
    "Order No.": "orderNumber",
    "Date": "createdAt",
    "Item Name": "productItem.itemName",
    "Size": "size",
    "Remarks": "remarks",
    "Ordered By": "createdBy",
    "Order Status": "status"
  }

  // Get unique values for the selected filter field
const getUniqueValues = useMemo(() => {
  if (!selectedFilterField) return [];
  const columnId = columns.find(col => col.label === selectedFilterField)?.id;
  if (!columnId) return [];

  const values = orders.map((order) => {
    let value: string | undefined;
    
    switch (columnId) {
      case "company":
        value = order.companyName?.companyName;
        break;
      case "party":
        value = order.party?.partyName;
        break;
      case "orderNumber":
        value = order.orderNumber;
        break;
      case "date":
        value = formatDate(order.createdAt);
        break;
      case "item":
        value = order.productItem?.itemName;
        break;
      case "size":
        value = order.size;
        break;
      case "remarks":
        value = order.remarks;
        break;
      case "orderedBy":
        value = order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : undefined;
        break;
      case "priority":
        value = (order as any).priority || "Normal";
        break;
      case "orderStatus":
        value = getDisplayStatus(order).text;
        break;
    }
      return value || "N/A";
  });

  return Array.from(new Set(values)).filter((v) => v !== "N/A").sort();
}, [selectedFilterField, orders]);

// Filter orders based on search query, date range, and selected filters
const filteredOrders = useMemo(() => {
  return orders.filter((order) => {
    const matchesDateRange =
      (!startDate || new Date(order.createdAt).getTime() >= new Date(startDate).setHours(0, 0, 0, 0)) &&
      (!endDate || new Date(order.createdAt).getTime() <= new Date(endDate).setHours(23, 59, 59, 999));

    const matchesSearch = searchQuery
      ? order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.companyName?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productItem?.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesFilters = Object.keys(filters).every((columnId) => {
      if (filters[columnId].length === 0) return true;
      let value: string | undefined;
      switch (columnId) {
        case "company":
          value = order.companyName?.companyName;
          break;
        case "party":
          value = order.party?.partyName;
          break;
        case "orderNumber":
          value = order.orderNumber;
          break;
        case "date":
          value = formatDate(order.createdAt);
          break;
        case "item":
          value = order.productItem?.itemName;
          break;
        case "size":
          value = order.size;
          break;
        case "remarks":
          value = order.remarks;
          break;
        case "orderedBy":
          value = order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : undefined;
          break;
        case "priority":
          value = (order as any).priority || "Normal";
          break;
        case "orderStatus":
          value = getDisplayStatus(order).text;
          break;
      }
      return value && filters[columnId].includes(value);
    });

    return matchesDateRange && matchesSearch && matchesFilters;
  });
}, [orders, startDate, endDate, searchQuery, filters]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (canViewGlobal) {
      // Two-company support (claude/two-company-gap-analysis.md, Phase 0):
      // scope to the globally-selected company so switching the toggle
      // re-fetches this list for the other company. activeCompanyId is
      // undefined until CompanyToggle loads the company list (or when
      // only one company exists), in which case this falls back to the
      // pre-toggle "all companies" behavior.
      dispatch(getAllOrdersThunk({ limit: 100, companyName: activeCompanyId || undefined }));
    } else if (canViewOwn && user?.id) {
      dispatch(getOrdersByStaffIdThunk(user.id));
    }
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id, activeCompanyId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getRouteByStatus = (row: Order): string => {
    const { designer, printer, binder, bookletBinder } = row;
    const status = row.status as string;
    // QP order-process audit (2026-08-25): Quality Packaging's status
    // vocabulary now overlaps with Sakshi Creation's on purpose ("Printer"/
    // "Binder" are shared stage names -- see orders_status_check), but a QP
    // order must NEVER fall into the switch below, since every one of those
    // routes is the legacy printer-task/binder-task-style flow reading
    // designerStatus/printerStatus/etc. fields that QP orders never
    // populate (QP's real progress lives in job_cards/job_card_stages
    // instead). Every QP order goes to the base order-view page, regardless
    // of its status string.
    if (row.companyName?.companyName === "Quality Packaging") {
      return `/admin/all-orders/view?id=${row._id}`;
    }
    switch (status) {
      case "Received":
        return `/admin/all-orders/view?id=${row._id}`;
      case "Designer":
        return `/admin/all-orders/view/designer?id=${row._id}`;
      case "Printer":
        return `/admin/all-orders/view/printers?id=${row._id}`;
      case "Binder":
        return `/admin/all-orders/view/binder?id=${row._id}`;
      case "Booklet & Folder Binder":
        return `/admin/all-orders/view/booklet-folder?id=${row._id}`;
      case "Delivery":
        return `/admin/all-orders/view/dilevery?id=${row._id}`;
      case "Hold":
        if (bookletBinder) {
          return `/admin/all-orders/view/booklet-folder?id=${row._id}`;
        } else if (binder) {
          return `/admin/all-orders/view/binder?id=${row._id}`;
        } else if (printer) {
          return `/admin/all-orders/view/printers?id=${row._id}`;
        } else if (designer) {
          return `/admin/all-orders/view/designer?id=${row._id}`;
        } else {
          return `/admin/all-orders/view?id=${row._id}`;
        }
      default:
        return `/admin/all-orders/view?id=${row._id}`;
    }
  };

// QP order-process audit (2026-08-25): Quality Packaging's own job-card-
// driven status values, in the same order as QUALITY_PACKAGING_STAGE_ORDER
// (jobCard.controller.js) -- kept in one place here rather than duplicated
// inline below.
const QP_STATUS_LABELS: Record<string, string> = {
  Received: "Order Received",
  Printer: "Printing",
  Binder: "Binding",
  "Booklet Binder": "Booklet Binding",
  Factory: "At Factory",
  Godown: "At Godown",
  Completed: "Completed",
  Hold: "On Hold",
};

const getDisplayStatus = (row: Order): { text: string; isHold: boolean } => {
  const { designerStatus, printerStatus, binderStatus, bookletBinderStatus, designer, binder, bookletBinder } = row;
  const status = row.status as string;
  const staffMap = {
    designer: designer,
    binder: binder,
    bookletBinder: bookletBinder,
  };

  // QP order-process audit (2026-08-25): must be checked before the Hold
  // branch and the Sakshi-only switch below -- QP's status vocabulary
  // shares string values with Sakshi's ("Printer"/"Binder"/"Hold") but has
  // no designerStatus/printerStatus/etc. sub-status or staff data to show,
  // so it needs its own display mapping entirely rather than falling
  // through into logic built for the legacy per-stage fields.
  if (row.companyName?.companyName === "Quality Packaging") {
    return { text: QP_STATUS_LABELS[status] || status || "Order Received", isHold: status === "Hold" };
  }

  if (status === "Hold") {
    const { designer, printer, binder, bookletBinder } = row;
    let holdStage = "Order";
    if (bookletBinder) holdStage = "Booklet Binding";
    else if (binder) holdStage = "Binding";
    else if (printer) holdStage = "Printing";
    else if (designer) holdStage = "Designing";
    return { text: holdStage, isHold: true };
  }

  let mainStatusText: string = status || "Order Received";
  let subStatusText = "";
  let staffName = "";

  switch (status) {
    case "Designer":
      mainStatusText = "Designing";
      subStatusText = designerStatus || "Pending";
      staffName = designer && designer.firstName && designer.lastName
        ? `${designer.firstName} ${designer.lastName}`
        : "Unknown Designer";
      break;
    case "Printer":
      mainStatusText = "Printing";
      subStatusText = printerStatus || "Pending";
      break;
    case "Binder":
      mainStatusText = "Binding";
      subStatusText = binderStatus || "Pending";
      staffName = binder && binder.firstName && binder.lastName
        ? `${binder.firstName} ${binder.lastName}`
        : "Unknown Binder";
      break;
    case "Booklet & Folder Binder":
      mainStatusText = "Booklet Binding";
      subStatusText = bookletBinderStatus || "Pending";
      staffName = bookletBinder && bookletBinder.firstName && bookletBinder.lastName
        ? `${bookletBinder.firstName} ${bookletBinder.lastName}`
        : "Unknown Booklet Binder";
      break;
    case "Delivery":
      mainStatusText = "Ready for Delivery";
      break;
    case "Received":
      mainStatusText = "Order Received";
      break;
    default:
      break;
  }

  const displayText = staffName ? `${mainStatusText} (${subStatusText}) by ${staffName}` : subStatusText ? `${mainStatusText} (${subStatusText})` : mainStatusText;
  return { text: displayText, isHold: false };
};

  const handleRowClick = (row: OrderRow) => {
    const route = getRouteByStatus(row);
    router.push(route);
  };

  const StatusBadge = ({ row }: { row: OrderRow }) => {
    const { text, isHold } = getDisplayStatus(row);
    if (isHold) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            {text}
          </Typography>
          <Box
            sx={{
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 600,
              borderRadius: "4px",
              px: 1,
              py: 0.25,
              textTransform: "uppercase",
            }}
          >
            HOLD
          </Box>
        </Box>
      );
    }

    return (
      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
        {text}
      </Typography>
    );
  };

  const getAvatarUrl = (row: Order) => {
     if (row.companyName && (row.companyName as any).avatar) {
    return (row.companyName as any).avatar;
  }
  };

  if (loading) return <Typography>Loading orders...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  const csvColumns = [
    { id: "company", label: "Company", value: (row: OrderRow) => row.companyName?.companyName || "N/A" },
    { id: "party", label: "Party", value: (row: OrderRow) => row.party?.partyName || "N/A" },
    { id: "orderNumber", label: "Order No.", value: (row: OrderRow) => row.orderNumber || "N/A" },
    { id: "date", label: "Date", value: (row: OrderRow) => formatDate(row.createdAt) },
    { id: "item", label: "Item Name", value: (row: OrderRow) => row.productItem?.itemName || "N/A" },
    { id: "size", label: "Size", value: (row: OrderRow) => row.size || "N/A" },
    { id: "remarks", label: "Remarks", value: (row: OrderRow) => row.remarks || "None" },
    { id: "orderedBy", label: "Ordered By", value: (row: OrderRow) => `${row.createdBy?.firstName || "N/A"} ${row.createdBy?.lastName || "N/A"}` },
    { id: "priority", label: "Priority", value: (row: OrderRow) => (row as any).priority || "Normal" },
    { id: "orderStatus", label: "Order Status", value: (row: OrderRow) => getDisplayStatus(row).text },
  ];

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date)}
            onEndDateChange={(date) => setEndDate(date)}
          />
          <ThemeButton
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Clear Date Range
          </ThemeButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              px: 1.5,
              width: 200,
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
            filterOptions={columns
              .filter((col) => col.id !== "action")
              .map((col) => col.label)}
            uniqueValues={selectedFilterField ? 
              getUniqueValues : 
              []}
            onFiltersChange={(newFilters) => {
              // Convert label-based filters to id-based filters
              const idBasedFilters: { [key: string]: string[] } = {};
              
              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = columns.find(col => col.label === label)?.id;
                if (columnId) {
                  idBasedFilters[columnId] = values;
                }
              });
              
              setFilters(idBasedFilters);
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = columns.find(col => col.id === columnId)?.label;
              if (columnLabel) {
                acc[columnLabel] = filters[columnId];
              }
              return acc;
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
           <ThemeButton onClick={() => setOpen(true)}>+ Add New Order</ThemeButton>
        </Box>
      </Box>
      <Box px={2} py={2}>
        <BasicTable
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          rowData={filteredOrders.map((order): OrderRow => ({ ...order, id: order._id }))}
          totalCount={totalCount} // Pass totalCount from Redux
          pagination={pagination} // Pass pagination from Redux
          csvColumns={csvColumns}
          exportFilename="all-orders"
          renderRow={(row: OrderRow) => (
            <>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                   <Avatar 
                    src={getAvatarUrl(row)} 
                    sx={{ width: 32, height: 32 }} 
                    alt={row.companyName?.companyName || "Company"}
                  />
                  <Typography
                    fontWeight={600}
                    fontSize="14px"
                    color="#111827"
                    sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                    onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                  >
                    {row.companyName?.companyName || "N/A"}
                  </Typography>
                </Box>
              </TableCell>

              {/* Party */}
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.party?.partyName || "N/A"}
                </Typography>
              </TableCell>

              {/* Order Number */}
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderNumber || "N/A"}
                </Typography>
              </TableCell>

              {/* Date */}
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {formatDate(row.createdAt)}
                </Typography>
              </TableCell>

              {/* Item Name */}
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.productItem?.itemName || "N/A"}
                </Typography>
              </TableCell>

              {/* Size */}
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.size || "N/A"}
                </Typography>
              </TableCell>

              {/* Remarks */}
              <TableCell>
                <Typography
                  fontSize="14px"
                  color="#6B7280"
                  sx={{
                    maxWidth: "150px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.remarks || "None"}
                </Typography>
              </TableCell>

              {/* Ordered By */}
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.createdBy?.firstName || "N/A"} {row.createdBy?.lastName || "N/A"}
                </Typography>
              </TableCell>

              {/* Priority */}
              <TableCell>
                {(() => {
                  const priority = (row as any).priority || "Normal"
                  const { bg, color } = PRIORITY_COLOR[priority] || PRIORITY_COLOR.Normal
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
                      {priority}
                    </Box>
                  )
                })()}
              </TableCell>

              {/* Order Status */}
              <TableCell>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                  onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                >
                  <StatusBadge row={row} />
                  <FaChevronRight
                    style={{
                      fontSize: 14,
                      color: "#9CA3AF",
                      marginLeft: 8,
                    }}
                  />
                </Box>
              </TableCell>
            </>
          )}
        />
      </Box>

      <AddOrderDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default AllOrdersPage;