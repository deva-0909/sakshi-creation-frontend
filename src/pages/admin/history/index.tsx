"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TableCell,
  Typography,
  Avatar,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllAccountMastersThunk,
  deleteAccountMasterThunk,
  approvePartyThunk,
  clearError,
  clearSuccessMessage,
  getAccountMasterByStaffIdThunk,
} from "@/store/slices/accountMasterSlice";
import { getAllOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddNewPartyDialog from "@/component/AddNewPartyDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { authService } from "@/services/auth.service";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import DesignerTask from "../designer-task";
import PrinterTask from "../printer-task";
import BindrTask from "../binder-task";
import BookletBinderTask from "../bookletbinder-task";
import AdminOverviewTask from "@/component/AdminOverviewTask";
const STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REWORK: "Rework",
  DONE: "Done",
};
const Index = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accountMasters, loading, error, successMessage } = useAppSelector(
    (state) => state.accountMasters
  );
  const { user } = useAppSelector((state) => state.auth);
  const { orders } = useAppSelector((state) => state.orders);
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  // Get role name in lowercase for consistent comparison
  const role = user?.role?.roleName?.toLowerCase();
  // Roles with a bespoke, stage-filtered view below (getRoleSpecificTasks /
  // renderRoleSpecificComponent). None of these correspond to a row in the
  // live roles table (Admin, Sales, Procurement, Production, Accounts,
  // Store, Viewer, Godown Manager) except "admin" -- they're kept as-is.
  const TAILORED_ROLES = ["designer", "printer", "binder", "booklet & folder binder", "admin"];
  const canViewGlobalHistory = !!user?.role?.permissions?.history?.view_global;
  const canViewOwnHistory = !!user?.role?.permissions?.history?.view_own;

  // Mobile/toggle/seed audit (2026-08-26), Phase G: this page filtered
  // `orders` from Redux for every role's task list below, but never once
  // dispatched anything to populate it -- `orders` was whatever another
  // page happened to have already fetched (usually empty), so this page
  // silently showed no tasks for everyone, not just the missing "admin"
  // role case fixed below.
  //
  // Two-company gap analysis follow-up (2026-09-01): every role besides
  // "admin" hit the unhandled-role fallback below regardless of its actual
  // `history` permission grant. Sales/Procurement/Production/Accounts/
  // Store/Godown Manager all hold real `history.view_global` or
  // `history.view_own` grants per the roles table, so they now get a
  // permission-scoped fetch -- global orders for view_global (same as
  // Admin already got), or just-their-own orders for view_own-only,
  // mirroring the view_global/view_own split all-orders/index.tsx already
  // uses for the same `orders` slice.
  //
  // QA-R1 fix (2026-09-01): the five TAILORED_ROLES used to get an
  // unconditional global fetch here regardless of their live permission
  // grant. Designer/Printer/Binder/Booklet & Folder Binder were only ever
  // granted `view_own: true, view_global: false` on the `history` module
  // (confirmed live in the roles table), so they were pulling every
  // company-wide order instead of just their own -- a scope bypass, not a
  // display quirk (getRoleSpecificTasks below filters by pipeline stage,
  // not by ownership). Dropping isTailoredRole from this condition makes
  // every role -- tailored or not -- go through the same
  // view_global/view_own gate as all-orders/index.tsx. Admin keeps getting
  // everything because its `history.view_global` grant is true.
  useEffect(() => {
    if (canViewGlobalHistory) {
      dispatch(getAllOrdersThunk({ limit: 1000, companyName: activeCompanyId || undefined }));
    } else if (canViewOwnHistory && user?.id) {
      dispatch(getOrdersByStaffIdThunk(user.id));
    }
  }, [dispatch, activeCompanyId, canViewGlobalHistory, canViewOwnHistory, user?.id]);

  const getRoleSpecificTasks = () => {
    if (!orders || orders.length === 0) return [];

    switch (role) {
      case "designer":
        return orders.filter(
          (order) => order.designerStatus === STATUS.APPROVED
        );
      case "printer":
        return orders.filter(
          (order) =>
            order.designerStatus === STATUS.APPROVED &&
            order.printerStatus === STATUS.DONE
        );
      case "binder":
        return orders.filter(
          (order) =>
            order.printerStatus === STATUS.DONE &&
            order.binderStatus === STATUS.DONE
        );
      case "booklet & folder binder":
        return orders.filter(
          (order) =>
            order.binderStatus === STATUS.DONE &&
            order.bookletBinderStatus === STATUS.DONE
        );
      case "admin":
        return orders; // Admin sees all tasks
      default:
        // Any other role that reaches this page only does so with a real
        // `history` permission grant (view_global or view_own, checked
        // above) -- `orders` was already fetched scoped to that grant, so
        // it doesn't need further client-side filtering here.
        return canViewGlobalHistory || canViewOwnHistory ? orders : [];
    }
  };

  // const designerStatus = orders[0]?.designerStatus;

  // Render different components based on role
  const renderRoleSpecificComponent = () => {
    const tasks = getRoleSpecificTasks().map((order) => ({
      ...order,
      designerStatus: order.designerStatus || "",
    }));
    switch (role) {
      case "designer":
        return <DesignerTask tasks={tasks} />;
      case "printer":
        return <PrinterTask tasks={tasks} />;
      case "binder":
        return <BindrTask tasks={tasks} />;
      case "booklet & folder binder":
        return <BookletBinderTask tasks={tasks} />;
      case "admin":
        return <AdminOverviewTask tasks={tasks as any} />;
      // Add more cases as needed
      default:
        // Two-company gap analysis follow-up (2026-09-01): the roles table
        // grants `history` access (view_global or view_own) to several
        // roles -- Sales, Procurement, Production, Accounts, Store, Godown
        // Manager -- that have no bespoke stage-filtered view here. Their
        // underlying data is the same order/job history Admin already
        // sees via AdminOverviewTask, just scoped by the fetch above, so
        // reuse that same generic component instead of adding near-
        // duplicate per-role branches. Roles with no `history` grant at
        // all keep the explicit "no access" message.
        return canViewGlobalHistory || canViewOwnHistory ? (
          <AdminOverviewTask tasks={tasks as any} />
        ) : (
          <div>No component available for your role: {role}</div>
        );
    }
  };

  return <>{renderRoleSpecificComponent()}</>;
};

export default Index;
