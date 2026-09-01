import React, { useState, useEffect, useRef, useMemo } from "react";
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
  useMediaQuery,
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
  MdCalendarToday,
  MdAccessTime,
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
import { getAllCompanyNamesThunk } from "@/store/slices/companyNameSlice";

const permissionMapping: { [key: string]: string | string[] } = {
  "Account Master": "account_master",
  "Assign Task": "assign_task",
  "Party call": "party_call",
  "All Orders": "all_orders",
  // Order To Factory page (Build 4, Godown Manager role, 2026-08-27; widened
  // by Patch 116): originally gated on just "all_orders" so it's visible to
  // whoever can already see All Orders. The new Godown Manager role
  // (task-portals-godown-quality-manager-build-log.md) is deliberately
  // scoped to ONLY a dedicated "order_to_factory" permission key -- not
  // "all_orders" itself, since that would also surface the separate "All
  // Orders" nav item this role must not have -- so this now checks either
  // key. Backend's authorizeView on GET /orders/all already accepts both
  // (Patch 115); everyone who already saw this via "all_orders" keeps
  // seeing it exactly as before.
  "Order To Factory": ["all_orders", "order_to_factory"],
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

// Setup submenu (functional audit Fix 1): a dedicated label->key map for
// Setup's ~17 sub-items, kept separate from `permissionMapping` above
// because some setup item labels collide with unrelated entries already in
// that map -- e.g. "Staff" there means Reports > Staff ("reports.staff"),
// not this Setup > Staff item, which is really "setup.staff". Values may be
// a single key or an array of alternate keys (same OR semantics Patch 116
// already gave permissionMapping above -- see permKeys in the filter
// effect). Every value here was checked against the live permissions
// schema (all roles' JSONB keys via a Supabase query) so it points at a key
// that actually exists; where a role's permissions object simply lacks
// that key, hasModulePermission's optional chaining treats the missing key
// as `undefined` -> falsy, i.e. denied, not a crash or an accidental allow.
type PermKeyOrKeys = string | string[];

const setupPermissionMapping: { [label: string]: PermKeyOrKeys } = {
  "Add Role": "setup.role",
  Staff: "setup.staff",
  Products: "setup.products",
  "Paper Material": "setup.paper-material",
  // Schema has a top-level "bom" key on every role (no "setup.bom" key
  // exists yet) -- kept both as an OR so a future "setup.bom" sub-key, if
  // one is ever added the way role/staff/products/paper-material/
  // company-name already were, keeps working without another code change.
  "Bill of Materials": ["setup.bom", "bom"],
  Machines: "machine",
  "Dye / Punch": "dye_punch",
  "Godown Box Receipt": "godown_box_receipt",
  "Company Name": "setup.company-name",
  // Fix 4: no "vendor" permission key existed anywhere in the schema before
  // this patch (confirmed via a live query across every role's permissions
  // JSONB) -- Vendor Name previously had no gate of its own and would have
  // leaked to every role with any Setup access once this per-item filter
  // landed. Wired to a new "vendor" key here, matched by
  // authorizePermission(["vendor", "setup"], ...) added to the backend
  // vendor routes in the same patch set. This patch does NOT grant "vendor"
  // to any role's live permissions row -- that is being done separately --
  // so the item stays hidden (missing key -> undefined -> falsy) until a
  // role is actually granted it.
  "Vendor Name": "vendor",
  "Units of Measure": "uom",
  "Tax Rates": "taxrate",
  Branches: "branch",
  Warehouses: "warehouse",
  Designations: "designation",
  "Production Routing": "routing",
  "General Settings": "appsettings",
  "Numbering Configuration": "numberingconfig",
  // "Login History" has no dedicated key anywhere in the schema (distinct
  // from the unrelated top-level "history" key, which gates the separate
  // order-activity History page) -- deliberately absent here so it falls
  // through to the generic "setup" flag fallback below, same as any future
  // item added without its own key.
  //
  // Should-Fix item 6: "Department Company" (roleDepartment /
  // roleDepartmentCompany records) has no dedicated permission key in the
  // schema either (confirmed via a live query across every role's
  // permissions JSONB -- no "department"-named key exists anywhere) --
  // wired to the same ["setup.role", "setup"] compound key the backend's
  // own roleDepartment.routes.js / roleDepartmentCompany.routes.js already
  // use to gate these exact records (see their delete routes), rather than
  // the bare "setup" fallback Login History uses, since a more specific
  // match already exists on the backend side for this one.
  "Department Company": ["setup.role", "setup"],
};

const hasModulePermission = (permissions: any, keyOrKeys: PermKeyOrKeys): boolean => {
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
  return keys.some((key) => Boolean(permissions?.[key]?.view_global || permissions?.[key]?.view_own));
};

const menuItems = [
  { label: "Dashboard", icon: <MdDashboard size={18} />, path: "/" },
  { label: "Pending Approvals", icon: <MdFactCheck size={18} />, path: "/admin/approvals" },
  { label: "Account Master", icon: <MdAssignment size={18} />, path: "/admin/account-master" },
  { label: "Assign Task", icon: <MdWork size={18} />, path: "/admin/assign-task" },
  { label: "Party call", icon: <MdGroup size={18} />, path: "/admin/party-call" },
  { label: "All Orders", icon: <MdAssignment size={18} />, path: "/admin/all-orders" },
  // Order To Factory page (Build 4, Godown Manager role, 2026-08-27 Figma
  // audit -- claude/full-figma-slide-scan.md Slide 16): QP-only, but not
  // enforced by company here -- the page itself has nothing to show for
  // Sakshi Creation (orderFrom is QP-only data), same "just an empty list"
  // treatment as other QP-only pages that aren't company-gated in this nav.
  { label: "Order To Factory", icon: <MdWarehouse size={18} />, path: "/admin/order-to-factory" },
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
  // Should-Fix item 4 (client-readiness audit, 2026-09-01): these 4 standalone
  // task-portal pages and their designer_task/printer_task/blinder_task/
  // booklet_blinder_task permission keys already existed (Production role
  // is granted all four live in Supabase) but had no menuItems entry to
  // wire them into the sidebar at all -- permissionMapping above already
  // had the matching label->key entries waiting unused. Company-scoped via
  // QP_SCOPED_HIDDEN_TASK_LABELS below: QP order intake never populates the
  // legacy printer_status/designer_status/etc. fields these portals key off
  // (job cards are QP's real tracking mechanism -- see
  // qp-order-received-to-delivery-flow.md), so they're hidden whenever the
  // viewer's active company scope is Quality Packaging specifically, same
  // as today for Sakshi Creation / All companies.
  { label: "Designer-Task", icon: <MdWork size={18} />, path: "/admin/designer-task" },
  { label: "Printer-Task", icon: <MdWork size={18} />, path: "/admin/printer-task" },
  { label: "Binder-Task", icon: <MdWork size={18} />, path: "/admin/binder-task" },
  { label: "Booklet-Binder-Task", icon: <MdWork size={18} />, path: "/admin/bookletbinder-task" },
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

// Should-Fix item 4: labels hidden from the sidebar when the viewer's active
// company scope is Quality Packaging specifically (not Sakshi Creation, and
// not "All companies"/unscoped) -- see the menuItems comment above these 4
// entries for why.
const QP_SCOPED_HIDDEN_TASK_LABELS = ["Designer-Task", "Printer-Task", "Binder-Task", "Booklet-Binder-Task"];

const Dashboard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const { companyNames, loading: companyNamesLoading } = useAppSelector((state) => state.companyNames);
  useEffect(() => {
    // Needed here (not just via the CompanyToggle child below) so the QP
    // scope check in the permission-filtering effect below has real data on
    // first render rather than waiting on CompanyToggle's own mount.
    if (companyNames.length === 0 && !companyNamesLoading) {
      dispatch(getAllCompanyNamesThunk());
    }
  }, [companyNames.length, companyNamesLoading, dispatch]);
  const [selectedItem, setSelectedItem] = useState("");
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  // Mobile responsiveness audit (2026-08-26), Phase A: below `sm` the sidebar
  // switches from a hover-expand push-layout to a tap-toggled overlay drawer
  // (see the sx blocks below) -- hover has no touch equivalent, and a fixed
  // 260px sidebar permanently eats most of a phone-width viewport otherwise.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const didInitMobileDrawerRef = useRef(false);
  useEffect(() => {
    // Collapse the drawer by default on a mobile viewport instead of the
    // desktop default of open -- only on the first render where isMobile is
    // known (useMediaQuery reports false during SSR), so this never fights
    // a user's manual toggle afterwards.
    if (!didInitMobileDrawerRef.current) {
      didInitMobileDrawerRef.current = true;
      if (isMobile) setDrawerOpen(false);
    }
  }, [isMobile]);
  const [activeSubSidebar, setActiveSubSidebar] = useState<string | null>(
    router.pathname.startsWith("/admin/setup") ? "setup" : null
  );
  const [filteredMenuItems, setFilteredMenuItems] = useState(menuItems);
  const transitionDuration = 300;
  const transitionEasing = "cubic-bezier(0.4, 0, 0.2, 1)";
  // Shared "selected/hover" look for a sidebar nav item -- previously this
  // exact bgcolor/color/border trio was copy-pasted at three separate call
  // sites (main items, child items, setup submenu), which is how the two
  // foreign purples/mismatched grays crept in over time. Each call site
  // still owns its own layout (padding, justifyContent, etc.); only the
  // color/selection styling is centralized here (Phase K, see
  // claude/ui-ux-professional-polish-plan.md).
  const navSelectionSx = {
    "&.Mui-selected": {
      bgcolor: theme.palette.primary.light,
      color: theme.palette.grey[700],
      border: `2px solid ${theme.palette.primary.main}`,
    },
    "&:hover": {
      bgcolor: theme.palette.primary.light,
      border: `2px solid ${theme.palette.primary.main}`,
    },
  } as const;
  const sidebarShadow = "4px 0 6px -1px rgba(16, 24, 40, 0.08)";

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

          // Patch 116: permissionMapping entries can now be a single key or
          // an array of alternate keys (see the "Order To Factory" entry
          // above) -- hasPermission/child filtering below check ANY of them,
          // same OR semantics as the backend's authorizeView([...keys]).
          const permKeys = ([] as string[]).concat(permissionMapping[item.label] || item.label.toLowerCase().replace(/\s+/g, "_"));
          const hasPermission = permKeys.some((k) => permissions[k]?.view_global || permissions[k]?.view_own);

          if (item.label === "Reports") {
            return hasPermission ? item : null;
          }

          // Fix 1: the "Setup" parent nav item used to require the generic
          // "setup" flag alone, so a role with real per-item permission on a
          // setup sub-page (e.g. Store has full CRUD on warehouse/dye_punch/
          // godown_box_receipt) but setup=false could never reach the parent
          // nav item at all, even after the submenu itself is filtered
          // per-item below. Visible if the role has EITHER the generic
          // "setup" flag OR any one of the granular setup.* sub-permissions.
          if (item.label === "Setup") {
            const hasAnySetupSubPermission = Object.values(setupPermissionMapping).some((key) =>
              hasModulePermission(permissions, key)
            );
            return hasPermission || hasAnySetupSubPermission ? item : null;
          }

          if (item.children) {
            const filteredChildren = item.children.filter((child) => {
              const childPermKeys = ([] as string[]).concat(permissionMapping[child.label] || child.label.toLowerCase().replace(/\s+/g, "_"));
              return childPermKeys.some((k) => permissions[k]?.view_global || permissions[k]?.view_own);
            });

            if (hasPermission || filteredChildren.length > 0) {
              return { ...item, children: filteredChildren };
            }
            return null;
          }

          // Should-Fix item 4: legacy printer_status/designer_status/etc.
          // fields these 4 portals key off are never populated by QP order
          // intake (QP tracking is job cards, not these fields -- see
          // qp-order-received-to-delivery-flow.md) -- so hide them once the
          // viewer has scoped down to Quality Packaging specifically. Left
          // visible for Sakshi Creation and for "All companies"/unscoped
          // (activeCompanyId === "" or not yet resolved), same as today.
          if (QP_SCOPED_HIDDEN_TASK_LABELS.includes(item.label)) {
            const activeCompany = companyNames.find((c) => c._id === activeCompanyId);
            const isQpOnlyScope = activeCompany?.companyName === "Quality Packaging";
            if (isQpOnlyScope) return null;
          }

          return hasPermission ? item : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      setFilteredMenuItems(filteredItems);
    }

    const interval = setInterval(() => setDateTime(new Date()), 1000);
    setDateTime(new Date());
    return () => clearInterval(interval);
  }, [router, user, loading, dispatch, activeCompanyId, companyNames]);

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

  const allSetupSubMenuItems = [
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
    {
      label: "Department Company",
      path: "/admin/setup/department-company",
      icon: <MdGroup size={18} />,
    },
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

  // Fix 1: per-item permission filtering for the Setup submenu, mirroring
  // the filter `menuItems` already applies above. Previously every one of
  // these ~17 items rendered unconditionally once the parent "Setup" nav
  // item was visible -- so a role like Viewer (blanket view_global=true
  // everywhere) saw internal-only items like Staff/Add Role it has no
  // business reaching, and a role like Store (setup=false but real CRUD on
  // warehouse/dye_punch/godown_box_receipt) previously couldn't see those
  // items via nav at all even though its own permissions allow them.
  const setupPermissions = user?.role?.permissions;
  const setupSubMenuItems = useMemo(
    () =>
      allSetupSubMenuItems.filter((item) => {
        const key = setupPermissionMapping[item.label];
        // Items with no dedicated key (e.g. Login History) fall back to the
        // generic "setup" flag -- same gate the parent nav item used before
        // this fix, so such an item still shows for anyone who could reach
        // Setup at all previously.
        return hasModulePermission(setupPermissions, key ?? "setup");
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setupPermissions]
  );

  return (
    <Box display="flex" fontFamily="Inter, sans-serif" minHeight="100vh" bgcolor={theme.palette.background.default} p={1}>
      {/* Mobile-only backdrop -- taps outside the drawer close it, same as any
          standard overlay drawer. Never rendered on desktop (drawer pushes
          content there instead of overlaying it). */}
      {isMobile && drawerOpen && (
        <Box
          onClick={() => setDrawerOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(16, 24, 40, 0.45)",
            zIndex: 1250,
          }}
        />
      )}
      <Box
        sx={{
          width: isMobile ? 260 : (drawerOpen ? 260 : 60),
          minWidth: isMobile ? 260 : (drawerOpen ? 260 : 60),
          maxWidth: isMobile ? 260 : (drawerOpen ? 260 : 60),
          bgcolor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          p: 1,
          // Safe-area insets (paired with viewport-fit=cover in
          // _document.tsx): this sidebar is position:fixed against the
          // viewport, so it sits UNDER a notch/Dynamic Island or behind the
          // home-indicator gesture bar in standalone PWA mode unless it
          // reserves that space itself -- max() keeps the existing 8px
          // padding as a floor on devices with no inset to report.
          pt: "max(8px, env(safe-area-inset-top))",
          pl: "max(8px, env(safe-area-inset-left))",
          pb: "max(8px, env(safe-area-inset-bottom))",
          mr: 1.5,
          boxShadow: sidebarShadow,
          borderRadius: 1,
          flexDirection: "column",
          // Mobile: a full off-canvas/on-canvas slide (translateX), tap-driven.
          // Desktop: the original width-collapse, hover-driven behavior.
          transform: isMobile ? (drawerOpen ? "translateX(0)" : "translateX(-100%)") : "none",
          transition: isMobile
            ? `transform ${transitionDuration}ms ${transitionEasing}`
            : `width ${transitionDuration}ms ${transitionEasing}, min-width ${transitionDuration}ms ${transitionEasing}, max-width ${transitionDuration}ms ${transitionEasing}`,
          overflowX: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 1300,
          flexShrink: 0,
        }}
        onMouseEnter={isMobile ? undefined : handleMouseEnter}
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
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
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                zIndex: 1,
                // Was size="small" (~34px) -- under the 44px/48dp minimum
                // touch target both Apple and Google recommend (mobile PWA
                // usability audit); this is the desktop collapse toggle,
                // but kept consistent since the same component also renders
                // on mobile widths.
                minWidth: 44,
                minHeight: 44,
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
                            ...navSelectionSx,
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
                          ...navSelectionSx,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: drawerOpen ? 2 : "auto",
                            justifyContent: "center",
                            color: theme.palette.grey[500],
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
                                  ...navSelectionSx,
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
                      color: theme.palette.error.main,
                      "&:hover": { bgcolor: theme.palette.error.light },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerOpen ? 2 : "auto",
                        justifyContent: "center",
                        color: theme.palette.error.main,
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
          // Was "auto" -- with the wide-table case already handled by
          // themetable's own contained TableContainer scroll, this outer
          // wrapper never legitimately needs its own horizontal scrollbar;
          // leaving it "auto" meant a second, page-level horizontal
          // scrollbar could appear alongside the table's own.
          overflowX: "hidden",
          // Mobile: the drawer overlays instead of pushing content, so the
          // main area keeps its full width regardless of drawerOpen.
          ml: isMobile ? 0 : (drawerOpen ? "260px" : "60px"),
          transition: `margin-left ${transitionDuration}ms ${transitionEasing}`,
          // Was a flat "100vh": the outer flex container (below) has its own
          // p={1} (8px top + 8px bottom), so a full-100vh child inside it
          // overflowed the viewport by 16px, producing a second, short-throw
          // vertical scrollbar on the browser window itself, on top of this
          // box's own overflowY. calc() accounts for that padding instead.
          height: "calc(100vh - 16px)",
          overflowY: "hidden",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          px={2}
          bgcolor="#fff"
          boxShadow={sidebarShadow}
          sx={{
            py: 1.5,
            // Safe-area inset: this is the topmost visible content on
            // mobile (sidebar is off-canvas there), so it's the one that
            // would sit under a notch/Dynamic Island in standalone PWA mode.
            pt: "max(12px, env(safe-area-inset-top))",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                // Was size="small" -- this is THE way a phone user opens
                // navigation at all, so it's the highest-priority touch
                // target fix in the whole app (mobile PWA usability audit).
                sx={{ color: "#344054", minWidth: 44, minHeight: 44 }}
              >
                <MdMenu />
              </IconButton>
            )}
            <Typography variant="h6" fontSize={16} fontWeight={600}>
              {getCurrentPageTitle()}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {dateTime && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  flexWrap="wrap"
                  sx={{ fontFamily: "monospace", px: 2, py: 0.5, display: { xs: "none", sm: "flex" } }}
                >
                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <MdCalendarToday size={14} /> {dateTime.toLocaleDateString()}
                  </Typography>
                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <MdAccessTime size={14} /> {dateTime.toLocaleTimeString()}
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
        <Box
          p={2}
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            // Safe-area inset: clears the home-indicator gesture bar at the
            // bottom of the screen in standalone PWA mode on notched phones.
            pb: "max(16px, env(safe-area-inset-bottom))",
          }}
        >
          {pageLoading || loading ? <Loader /> : children}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;