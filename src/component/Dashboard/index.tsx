import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  ListItem,
  Collapse,
  useTheme,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  MdDashboard,
  MdAssignment,
  MdSettings,
  MdWork,
  MdGroup,
  MdInventory,
  MdShoppingCart,
  MdPeople,
  MdLibraryBooks,
  MdExpandMore,
  MdExpandLess,
  MdMenu,
  MdLogout,
  MdBuild,
  MdReceiptLong,
  MdFactCheck,
  MdTrendingUp,
  MdStraighten,
  MdPercent,
  MdAccountBalance,
  MdBadge,
  MdTune,
  MdFormatListNumbered,
  MdAltRoute,
  MdHistory,
  MdWarehouse,
  MdSwapHoriz,
} from "react-icons/md";
import { IoChevronBack } from "react-icons/io5";
import { useRouter } from "next/router";
import Loader from "@/component/common_component/loader";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearAuth, fetchUserThunk } from "@/store/slices/authSlice";
import { authService } from "@/services/auth.service";
import Slide from "@mui/material/Slide";
import NotificationBell from "@/component/notificationbell";
import CompanyToggle from "@/component/reusablecomponents/CompanyToggle";

const permissionMapping: { [key: string]: string } = {
  "Account Master": "account_master",
  "Assign Task": "assign_task",
  "Party call": "party_call",
  "All Orders": "all_orders",
  "Quality Packaging": "quality_packaging",
  // Two-company Phase 3 Part A: "All Complains" top-level nav item, per the
  // Figma reference's confirmed-differences table (two-company-gap-analysis.md).
  "All Complains": "complaint",
  "Performance invoice": "proforma_invoice",
  Reports: "reports",
  Inventory: "inventory",
  Purchase: "purchase",
  Task: "task",
  History: "history",
  "Designer-Task": "designer_task",
  "Printer-Task": "printer_task",
  "Binder-Task": "blinder_task",
  "Booklet-Binder-Task": "booklet_blinder_task",
  Setup: "setup",
  // Sub-menu items for Reports
  Designer: "reports.designer",
  Printers: "reports.printers",
  Binder: "reports.binder",
  "Booklet & Folder Intention": "reports.booklet-and-binder",
  Staff: "reports.staff",
  // Sub-menu items for Setup
  "Add Role": "setup.role",
  Products: "setup.products",
  "Paper Material": "setup.paper-material",
  "Company Name": "setup.company-name",
  "Bill of Materials": "setup.bom",
  Quotation: "quotation",
  "CRM Pipeline": "opportunity",
  "Job Card": "jobcard",
  "Wastage Report": "jobcard",
  Machines: "machine",
  "Dye / Punch": "dye_punch",
  "Godown Box Receipt": "godown_box_receipt",
  "Stock Ledger": "inventory",
  "Stock Movements": "inventory",
  RFQs: "rfq",
  "Purchase Requisitions": "purchaserequisition",
  "Purchase Orders": "purchaseorder",
  Invoices: "invoice",
  "Vendor Payments": "vendorpayment",
  // Module 9: Finance depth
  "Customer Ledger": "receipt",
  "Customer Ageing": "receipt",
  "Vendor Ledger": "vendorpayment",
  "Vendor Ageing": "vendorpayment",
  "Credit Notes": "creditnote",
  "Debit Notes": "debitnote",
};

const menuItems = [
  { label: "Dashboard", icon: <MdDashboard size={18} />, path: "/" },
  { label: "Pending Approvals", icon: <MdFactCheck size={18} />, path: "/admin/approvals" },
  { label: "Account Master", icon: <MdAssignment size={18} />, path: "/admin/account-master" },
  { label: "Assign Task", icon: <MdWork size={18} />, path: "/admin/assign-task" },
  { label: "Party call", icon: <MdGroup size={18} />, path: "/admin/party-call" },
  { label: "All Orders", icon: <MdAssignment size={18} />, path: "/admin/all-orders" },
  { label: "Quotation", icon: <MdLibraryBooks size={18} />, path: "/admin/quotation" },
  { label: "CRM Pipeline", icon: <MdTrendingUp size={18} />, path: "/admin/crm/opportunities" },
  { label: "Job Card", icon: <MdWork size={18} />, path: "/admin/job-card" },
  { label: "Wastage Report", icon: <MdAssignment size={18} />, path: "/admin/job-card/wastage-report" },
  { label: "Quality Packaging", icon: <MdSettings size={18} />, path: "/admin/quality-packageing" },
  { label: "All Complains", icon: <MdFactCheck size={18} />, path: "/admin/complaints" },
  { label: "Performance invoice", icon: <MdSettings size={18} />, path: "/admin/performance-invoice" },
  {
    label: "Reports",
    icon: <MdLibraryBooks size={18} />,
    path: "/admin/reports",
    children: [
      { label: "Designer", path: "/admin/reports/designer", icon: <MdPeople size={18} /> },
      { label: "Printers", path: "/admin/reports/printers", icon: <MdPeople size={18} /> },
      { label: "Binder", path: "/admin/reports/binder", icon: <MdPeople size={18} /> },
      { label: "Booklet & Folder Intention", path: "/admin/reports/booklet-and-binder", icon: <MdLibraryBooks size={18} /> },
      { label: "Staff", path: "/admin/reports/staff", icon: <MdGroup size={18} /> },
      { label: "Delayed Jobs", path: "/admin/reports/delayed-jobs", icon: <MdAssignment size={18} /> },
      { label: "Customer Performance", path: "/admin/reports/customer-performance", icon: <MdTrendingUp size={18} /> },
      { label: "Salesperson Performance", path: "/admin/reports/salesperson-performance", icon: <MdTrendingUp size={18} /> },
      { label: "Purchase Rate Trend", path: "/admin/reports/purchase-rate-trend", icon: <MdShoppingCart size={18} /> },
    ],
  },
  { label: "Inventory", icon: <MdInventory size={18} />, path: "/admin/inventory" },
  { label: "Stock Ledger", icon: <MdInventory size={18} />, path: "/admin/inventory/stock-ledger" },
  { label: "Stock Movements", icon: <MdSwapHoriz size={18} />, path: "/admin/inventory/stock-movements" },
  { label: "Purchase", icon: <MdShoppingCart size={18} />, path: "/admin/purchase" },
  {
    label: "Procurement",
    icon: <MdShoppingCart size={18} />,
    path: "/admin/procurement/rfq",
    children: [
      { label: "RFQs", path: "/admin/procurement/rfq", icon: <MdLibraryBooks size={18} /> },
      { label: "Purchase Requisitions", path: "/admin/procurement/purchase-requisitions", icon: <MdAssignment size={18} /> },
      { label: "Purchase Orders", path: "/admin/procurement/purchase-orders", icon: <MdShoppingCart size={18} /> },
    ],
  },
  {
    label: "Accounting",
    icon: <MdReceiptLong size={18} />,
    path: "/admin/accounting/invoices",
    children: [
      { label: "Invoices", path: "/admin/accounting/invoices", icon: <MdReceiptLong size={18} /> },
      { label: "Vendor Payments", path: "/admin/accounting/vendor-payments", icon: <MdShoppingCart size={18} /> },
      { label: "Customer Ledger", path: "/admin/accounting/customer-ledger", icon: <MdReceiptLong size={18} /> },
      { label: "Customer Ageing", path: "/admin/accounting/customer-ageing", icon: <MdReceiptLong size={18} /> },
      { label: "Vendor Ledger", path: "/admin/accounting/vendor-ledger", icon: <MdShoppingCart size={18} /> },
      { label: "Vendor Ageing", path: "/admin/accounting/vendor-ageing", icon: <MdShoppingCart size={18} /> },
      { label: "Credit Notes", path: "/admin/accounting/credit-notes", icon: <MdReceiptLong size={18} /> },
      { label: "Debit Notes", path: "/admin/accounting/debit-notes", icon: <MdShoppingCart size={18} /> },
    ],
  },
  { label: "Task", icon: <MdShoppingCart size={18} />, path: "/admin/task" },
  { label: "History", icon: <MdShoppingCart size={18} />, path: "/admin/history" },
  // Full Figma slide scan Phase 6 (Theme 10, Slide 87): "my own orders" --
  // exempted from the permission-key filter below the same way Dashboard
  // is, since it's a personal view (this staff member's own assignments),
  // not a module with its own permission category.
  { label: "My Orders", icon: <MdAssignment size={18} />, path: "/admin/my-orders" },
  // Full Figma slide scan Phase 9 (Theme 4, Slide 85): Support/Settings are
  // personal, self-service pages (same as My Orders above) -- exempted from
  // the permission-key filter below rather than gated on a module permission,
  // since every logged-in staff member should be able to reach them.
  { label: "Support", icon: <MdFactCheck size={18} />, path: "/admin/support" },
  { label: "Settings", icon: <MdSettings size={18} />, path: "/admin/settings" },
  {
    label: "Setup",
    icon: <MdSettings size={18} />,
    path: "/admin/setup",
  },
];

const Dashboard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [selectedItem, setSelectedItem] = useState("");
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [activeSubSidebar, setActiveSubSidebar] = useState<string | null>(
    router.pathname.startsWith("/admin/setup") ? "setup" : null
  );
  const [filteredMenuItems, setFilteredMenuItems] = useState(menuItems);
  const transitionDuration = 300;
  const transitionEasing = "cubic-bezier(0.4, 0, 0.2, 1)";

  // Function to get current page title
  const getCurrentPageTitle = () => {
    // First check if we're in setup submenu
    if (activeSubSidebar === "setup") {
      const setupItem = setupSubMenuItems.find(item => 
        router.pathname === item.path || router.pathname.startsWith(item.path + "/")
      );
      if (setupItem) return setupItem.label;
      return "Setup";
    }

    // Check main menu items
    for (const item of filteredMenuItems) {
      // Exact match
      if (router.pathname === item.path) return item.label;
      
      // Parent path match (for nested routes)
      if (item.path && router.pathname.startsWith(item.path + "/")) {
        return item.label;
      }

      // Check children
      if (item.children) {
        const childItem = item.children.find(child => 
          router.pathname === child.path || router.pathname.startsWith(child.path + "/")
        );
        if (childItem) return childItem.label;
      }
    }

    return "Dashboard";
  };

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getUser();

    if (token && !user && !loading && storedUser?.id) {
      dispatch(fetchUserThunk({ token, userId: storedUser.id }));
    }

    if (!token || (!user && !loading)) {
      router.push("/login");
    }

    // Set selected item based on current path
    const currentPath = router.pathname;
    setSelectedItem(currentPath);

    // Open parent menu if child is active
    const parentItem = menuItems.find(item => 
      item.children && item.children.some(child => 
        currentPath === child.path || currentPath.startsWith(child.path + "/")
      )
    );
    if (parentItem) {
      setOpenMenus(prev => [...prev, parentItem.label]);
    }

    // Filter menu items based on permissions
    if (storedUser?.role?.permissions) {
      const permissions = storedUser.role.permissions;

      const filteredItems = menuItems
        .map((item) => {
          if (item.label === "Dashboard" || item.label === "My Orders" || item.label === "Support" || item.label === "Settings") return item;

          // Not a view_global/view_own module -- shown only to staff whose
          // role can actually approve something (the same eligibility the
          // backend's approval.controller.js itself enforces), so the menu
          // entry never appears for someone who'd just see an empty inbox.
          if (item.label === "Pending Approvals") {
            const canApprove = permissions.quotation?.approve === true || permissions.purchaseorder?.approve === true;
            return canApprove ? item : null;
          }

          const permKey = permissionMapping[item.label] || item.label.toLowerCase().replace(/\s+/g, "_");
          const hasPermission = permissions[permKey]?.view_global || permissions[permKey]?.view_own;

          if (item.label === "Reports" || item.label === "Setup") {
            return hasPermission ? item : null;
          }

          if (item.children) {
            const filteredChildren = item.children.filter((child) => {
              const childPermKey = permissionMapping[child.label] || child.label.toLowerCase().replace(/\s+/g, "_");
              return permissions[childPermKey]?.view_global || permissions[childPermKey]?.view_own;
            });

            if (hasPermission || filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }
            return null;
          }

          return hasPermission ? item : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      setFilteredMenuItems(filteredItems);
    }

    const interval = setInterval(() => setDateTime(new Date()), 1000);
    setDateTime(new Date());
    return () => clearInterval(interval);
  }, [router, user, loading, dispatch]);

  const handleNavigation = async (path: string) => {
    if (path === selectedItem) return;

    if (path === "/login") {
      dispatch(clearAuth());
      authService.clearAuth();
      router.push("/login");
      return;
    }

    setDrawerOpen(false);
    await new Promise(resolve => setTimeout(resolve, transitionDuration));
    setPageLoading(true);
    await router.push(path);
    setPageLoading(false);
  };

  const toggleSubmenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleDrawer = async () => {
    setDrawerOpen((prev) => !prev);
    if (!drawerOpen) {
      await new Promise((resolve) => setTimeout(resolve, transitionDuration));
    }
  };

  const handleMouseEnter = () => {
    if (!drawerOpen) setDrawerOpen(true);
  };

  const handleMouseLeave = () => {
    if (drawerOpen) setDrawerOpen(false);
  };

  const setupSubMenuItems = [
    {
      label: "Add Role",
      path: "/admin/setup/role",
      icon: <MdPeople size={18} />,
    },
    {
      label: "Staff",
      path: "/admin/setup/staff",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Products",
      path: "/admin/setup/products",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Paper Material",
      path: "/admin/setup/paper-material",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Bill of Materials",
      path: "/admin/setup/bom",
      icon: <MdLibraryBooks size={18} />,
    },
    {
      label: "Machines",
      path: "/admin/setup/machines",
      icon: <MdBuild size={18} />,
    },
    {
      label: "Dye / Punch",
      path: "/admin/setup/dye-punch",
      icon: <MdBuild size={18} />,
    },
    {
      label: "Godown Box Receipt",
      path: "/admin/setup/godown-box-receipt",
      icon: <MdBuild size={18} />,
    },
    // {
    //   label: "Department Company",
    //   path: "/admin/setup/department-company",
    //   icon: <MdGroup size={18} />,
    // },
    {
      label: "Company Name",
      path: "/admin/setup/company-name",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Vendor Name",
      path: "/admin/setup/vendor-name",
      icon: <MdGroup size={18} />,
    },
    {
      label: "Units of Measure",
      path: "/admin/setup/uom",
      icon: <MdStraighten size={18} />,
    },
    {
      label: "Tax Rates",
      path: "/admin/setup/tax-rates",
      icon: <MdPercent size={18} />,
    },
    {
      label: "Branches",
      path: "/admin/setup/branches",
      icon: <MdAccountBalance size={18} />,
    },
    {
      label: "Warehouses",
      path: "/admin/setup/warehouses",
      icon: <MdWarehouse size={18} />,
    },
    {
      label: "Designations",
      path: "/admin/setup/designations",
      icon: <MdBadge size={18} />,
    },
    {
      label: "Production Routing",
      path: "/admin/setup/production-routing",
      icon: <MdAltRoute size={18} />,
    },
    {
      label: "General Settings",
      path: "/admin/setup/general-settings",
      icon: <MdTune size={18} />,
    },
    {
      label: "Numbering Configuration",
      path: "/admin/setup/numbering-configuration",
      icon: <MdFormatListNumbered size={18} />,
    },
    {
      label: "Login History",
      path: "/admin/setup/login-history",
      icon: <MdHistory size={18} />,
    },
  ];

  return (
    <Box display="flex" fontFamily="Inter, sans-serif" minHeight="100vh" bgcolor="#FBFBFB" p={1}>
      <Box
        sx={{
          width: drawerOpen ? 260 : 60,
          minWidth: drawerOpen ? 260 : 60,
          maxWidth: drawerOpen ? 260 : 60,
          bgcolor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          p: 1,
          mr: 1.5,
          boxShadow: "4px 0 6px -1px rgba(0, 0, 0, 0.1)",
          borderRadius: 1,
          flexDirection: "column",
          transition: `width ${transitionDuration}ms ${transitionEasing}, min-width ${transitionDuration}ms ${transitionEasing}, max-width ${transitionDuration}ms ${transitionEasing}`,
          overflowX: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 1200,
          flexShrink: 0,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sidebar content */}
        <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
          {drawerOpen && user && activeSubSidebar !== "setup" && (
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.firstName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontSize={14} fontWeight={600}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          )}
          <Tooltip title={drawerOpen ? "Collapse menu" : "Expand menu"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                toggleDrawer();
              }}
              size="small"
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                zIndex: 1,
                backgroundColor: "rgba(255,255,255,0.8)",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
              }}
            >
              <MdMenu />
            </IconButton>
          </Tooltip>
        </Box>

        <List dense>
          <Slide direction="right" in={activeSubSidebar === "setup"} mountOnEnter unmountOnExit>
            <Box>
              {activeSubSidebar === "setup" && (
                <>
                  <Tooltip title={!drawerOpen ? "Back" : ""} placement="right">
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={async () => {
                          setActiveSubSidebar(null);
                          setDrawerOpen(false);
                          await new Promise((resolve) => setTimeout(resolve, transitionDuration));
                          await handleNavigation("/admin/setup");
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 0.75,
                          px: drawerOpen ? 1 : 1.5,
                          justifyContent: drawerOpen ? "flex-start" : "center",
                          minHeight: 48,
                          mb: 1,
                          "&:hover": { bgcolor: theme.palette.primary.light },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 0, mr: drawerOpen ? 2 : "auto", justifyContent: "center" }}
                        >
                          <IoChevronBack size={18} />
                        </ListItemIcon>
                        {drawerOpen && (
                          <ListItemText primary="Back" primaryTypographyProps={{ fontSize: 14 }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                  {setupSubMenuItems.map((item) => (
                    <Tooltip title={!drawerOpen ? item.label : ""} placement="right" key={item.label}>
                      <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          selected={router.pathname === item.path || router.pathname.startsWith(item.path + "/")}
                          onClick={async () => {
                            setActiveSubSidebar("setup");
                            await handleNavigation(item.path);
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 0.75,
                            px: drawerOpen ? 1 : 1.5,
                            justifyContent: drawerOpen ? "flex-start" : "center",
                            minHeight: 48,
                            "&.Mui-selected": {
                              bgcolor: theme.palette.primary.light,
                              color: "#344054",
                              border: "2px solid #7F56D9",
                            },
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              border: "2px solid #7F56D9",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{ minWidth: 0, mr: drawerOpen ? 2 : "auto", justifyContent: "center" }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          {drawerOpen && (
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                  ))}
                </>
              )}
            </Box>
          </Slide>

          <Slide direction="left" in={!activeSubSidebar} mountOnEnter unmountOnExit>
            <Box>
              {filteredMenuItems.map((item) => (
                <React.Fragment key={item.label}>
                  <Tooltip title={!drawerOpen ? item.label : ""} placement="right">
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={router.pathname === item.path || Boolean(item.path && router.pathname.startsWith(item.path + "/"))}
                        onClick={async () => {
                          if (item.label === "Setup") {
                            setActiveSubSidebar("setup");
                            setDrawerOpen(false);
                            await new Promise((resolve) => setTimeout(resolve, transitionDuration));
                          } else if (item.children) {
                            toggleSubmenu(item.label);
                            setDrawerOpen(false);
                            await new Promise((resolve) => setTimeout(resolve, transitionDuration));
                          } else {
                            await handleNavigation(item.path);
                          }
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 0.75,
                          px: drawerOpen ? 1 : 1.5,
                          justifyContent: drawerOpen ? "flex-start" : "center",
                          minHeight: 48,
                          "&.Mui-selected": {
                            bgcolor: theme.palette.primary.light,
                            color: "#344054",
                            border: "2px solid #7F56D9",
                          },
                          "&:hover": {
                            bgcolor: theme.palette.primary.light,
                            border: "2px solid #7F56D9",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: drawerOpen ? 2 : "auto",
                            justifyContent: "center",
                            color: "#6b7280",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        {drawerOpen && (
                          <>
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                            {item.children &&
                              (openMenus.includes(item.label) ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />)}
                          </>
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                  {item.children && drawerOpen && (
                    <Collapse in={openMenus.includes(item.label)} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child) => (
                          <ListItem key={child.label} disablePadding>
                            <Tooltip title={!drawerOpen ? child.label : ""} placement="right">
                              <ListItemButton
                                selected={router.pathname === child.path || router.pathname.startsWith(child.path + "/")}
                                onClick={() => handleNavigation(child.path)}
                                sx={{
                                  borderRadius: 2,
                                  py: 0.75,
                                  px: 1,
                                  pl: 4,
                                  "&.Mui-selected": {
                                    bgcolor: theme.palette.primary.light,
                                    color: "#344054",
                                    border: "2px solid #7F56D9",
                                  },
                                  "&:hover": {
                                    bgcolor: theme.palette.primary.light,
                                    border: "2px solid #7F56D9",
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>{child.icon}</ListItemIcon>
                                {drawerOpen && (
                                  <ListItemText
                                    primary={child.label}
                                    primaryTypographyProps={{ fontSize: 13 }}
                                  />
                                )}
                              </ListItemButton>
                            </Tooltip>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
              <Tooltip title={!drawerOpen ? "Logout" : ""} placement="right">
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation("/login")}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      px: drawerOpen ? 1 : 1.5,
                      justifyContent: drawerOpen ? "flex-start" : "center",
                      minHeight: 48,
                      color: "#ef4444",
                      "&:hover": { bgcolor: "#fee2e2" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerOpen ? 2 : "auto",
                        justifyContent: "center",
                        color: "#ef4444",
                      }}
                    >
                      <MdLogout size={18} />
                    </ListItemIcon>
                    {drawerOpen && (
                      <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            </Box>
          </Slide>
        </List>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#fff",
          borderRadius: 2,
          overflowX: "auto",
          ml: drawerOpen ? "260px" : "60px",
          transition: `margin-left ${transitionDuration}ms ${transitionEasing}`,
          height: "100vh",
          overflowY: "hidden",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2}
          py={1.5}
          bgcolor="#fff"
          boxShadow="4px 0 6px -1px rgba(0, 0, 0, 0.1)"
        >
          <Typography variant="h6" fontSize={16} fontWeight={600}>
            {getCurrentPageTitle()}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {dateTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Box display="flex" alignItems="center" gap={2} sx={{ fontFamily: "monospace", px: 2, py: 0.5 }}>
                  <Typography fontSize={14} fontWeight={600} color="text.secondary">
                    📅 {dateTime.toLocaleDateString()}
                  </Typography>
                  <Typography fontSize={14} fontWeight={600} color="text.secondary">
                    ⏰ {dateTime.toLocaleTimeString()}
                  </Typography>
                </Box>
              </motion.div>
            )}
            <NotificationBell />
          </Box>
        </Box>

        {/* Two-company toggle (see claude/two-company-gap-analysis.md,
            Phase 0) -- renders once here so it's on every admin page,
            matching the reference design's placement. Stays invisible
            until a second company actually exists. */}
        <Box display="flex" justifyContent="center" py={1.5}>
          <CompanyToggle />
        </Box>

        {/* Page content */}
        <Box p={2} sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {pageLoading || loading ? <Loader /> : children}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;