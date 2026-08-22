import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddOpportunityDialog from "@/component/opportunitydialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllOpportunitiesThunk } from "@/store/slices/opportunitySlice";

const columns = [
  { id: "opportunityNumber", label: "Opportunity No." },
  { id: "prospectName", label: "Prospect" },
  { id: "company", label: "Company" },
  { id: "estimatedValue", label: "Est. Value" },
  { id: "stage", label: "Stage" },
  { id: "assignedTo", label: "Assigned To" },
  { id: "createdAt", label: "Created" },
  { id: "options", label: "" },
];

const stageColor = (stage: string): { bg: string; color: string } => {
  switch (stage) {
    case "New":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Contacted":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Qualified":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Proposal Sent":
      return { bg: "#E9D7FE", color: "#6941C6" };
    case "Won":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Lost":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

interface OpportunityRow {
  id: string;
  _id: string;
  opportunityNumber: string;
  prospectName: string;
  stage: string;
  estimatedValue?: number;
  createdAt?: string;
  companyName?: { companyName: string };
  assignedTo?: { firstName: string; lastName: string };
}

const OpportunitiesPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { opportunities, loading, totalCount } = useAppSelector((state) => state.opportunities);
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.opportunity?.create;

  useEffect(() => {
    dispatch(getAllOpportunitiesThunk(undefined));
  }, [dispatch]);

  const refreshData = () => dispatch(getAllOpportunitiesThunk(undefined));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          CRM Pipeline
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Opportunity
          </ThemeButton>
        )}
      </Box>

      {loading && opportunities.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={opportunities.map((o: any) => ({ ...o, id: o._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          renderRow={(row: OpportunityRow) => {
            const { bg, color } = stageColor(row.stage);
            return (
              <>
                <TableCell>{row.opportunityNumber}</TableCell>
                <TableCell>{row.prospectName}</TableCell>
                <TableCell>{row.companyName?.companyName || "-"}</TableCell>
                <TableCell>{row.estimatedValue ? row.estimatedValue.toLocaleString() : "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.stage} sx={{ background: bg, color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  {row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : "-"}
                </TableCell>
                <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/crm/opportunities/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}

      <AddOpportunityDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default OpportunitiesPage;
