import React, { useEffect } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllJobCardsThunk } from "@/store/slices/jobCardSlice";

const columns = [
  { id: "jobCardNumber", label: "Job Card No." },
  { id: "orderNumber", label: "Order No." },
  { id: "item", label: "Item" },
  { id: "qty", label: "Qty" },
  { id: "priority", label: "Priority" },
  { id: "currentStage", label: "Current Stage" },
  { id: "status", label: "Status" },
  { id: "assignedTo", label: "Assigned To" },
  { id: "options", label: "" },
];

const priorityColor: Record<string, { bg: string; color: string }> = {
  Low: { bg: "#F2F4F7", color: "#344054" },
  Normal: { bg: "#D1E9FF", color: "#175CD3" },
  High: { bg: "#FEF0C7", color: "#B54708" },
  Urgent: { bg: "#FEE4E2", color: "#B42318" },
};

const statusColor: Record<string, { bg: string; color: string }> = {
  Pending: { bg: "#F2F4F7", color: "#344054" },
  "In Progress": { bg: "#D1E9FF", color: "#175CD3" },
  "On Hold": { bg: "#FEF0C7", color: "#B54708" },
  Completed: { bg: "#D1FADF", color: "#027A48" },
  Cancelled: { bg: "#FEE4E2", color: "#B42318" },
};

interface JobCardRow {
  id: string;
  _id: string;
  jobCardNumber: string;
  qty: number;
  priority: string;
  currentStage: string;
  status: string;
  order?: { orderNumber: string };
  productItem?: { itemName: string };
  assignedTo?: { firstName: string; lastName: string };
}

const JobCardPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { jobCards, loading, totalCount } = useAppSelector((state) => state.jobCards);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunk already
  // supported companyName -- this page just never passed it, so the
  // primary production worklist always mixed both companies' job cards.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getAllJobCardsThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Job Cards
        </Typography>
        <Typography fontSize={13} color="text.secondary">
          Job cards are created from an order's detail page.
        </Typography>
      </Box>

      {loading && jobCards.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={jobCards.map((j: any) => ({ ...j, id: j._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          csvColumns={[
            { id: "jobCardNumber", label: "Job Card No.", value: (row: JobCardRow) => row.jobCardNumber },
            { id: "orderNumber", label: "Order No.", value: (row: JobCardRow) => row.order?.orderNumber || "-" },
            { id: "item", label: "Item", value: (row: JobCardRow) => row.productItem?.itemName || "-" },
            { id: "qty", label: "Qty", value: (row: JobCardRow) => row.qty },
            { id: "priority", label: "Priority", value: (row: JobCardRow) => row.priority },
            { id: "currentStage", label: "Current Stage", value: (row: JobCardRow) => row.currentStage },
            { id: "status", label: "Status", value: (row: JobCardRow) => row.status },
            { id: "assignedTo", label: "Assigned To", value: (row: JobCardRow) => (row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : "-") },
          ]}
          exportFilename="job-cards"
          renderRow={(row: JobCardRow) => {
            const pColor = priorityColor[row.priority] || priorityColor.Normal;
            const sColor = statusColor[row.status] || statusColor.Pending;
            return (
              <>
                <TableCell>{row.jobCardNumber}</TableCell>
                <TableCell>{row.order?.orderNumber || "-"}</TableCell>
                <TableCell>{row.productItem?.itemName || "-"}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>
                  <ThemeChip label={row.priority} sx={{ background: pColor.bg, color: pColor.color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>{row.currentStage}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: sColor.bg, color: sColor.color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  {row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : "-"}
                </TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/job-card/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}
    </Box>
  );
};

export default JobCardPage;
