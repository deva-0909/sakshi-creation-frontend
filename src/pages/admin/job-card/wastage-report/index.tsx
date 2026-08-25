// Module 8: a report view over the new wastage-with-material-link data --
// shows actual wastage per material (with a per-stage breakdown) alongside
// the BOM's expected wastage % as reference context. Deliberately does not
// compute a precise actual-vs-planned variance number (see the design plan);
// the two figures sit side by side for a human to compare.
import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, TableCell, Chip } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeSelect from "@/component/common_component/themeselect";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { getWastageReportThunk } from "@/store/slices/jobCardSlice";
import { WastageReportRow } from "@/services/jobCard.service";

// Full stage superset across both companies' pipelines (Phase 2 Part B) --
// this is just a report filter, so it isn't worth company-conditioning;
// Factory/Godown are included in case Quality Packaging ever records
// wastage at those stages too.
const STAGES = ["Designer", "Printer", "Binder", "Booklet Binder", "QC", "Delivery", "Factory", "Godown"];

const columns = [
  { id: "material", label: "Material" },
  { id: "totalWasted", label: "Total Wasted" },
  { id: "expectedWastagePercent", label: "Expected Wastage %" },
  { id: "byStage", label: "By Stage" },
];

interface WastageRow extends WastageReportRow {
  id: string;
}

const WastageReportPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { materials } = useAppSelector((state) => state.materials);
  const { wastageReport, wastageReportLoading } = useAppSelector((state) => state.jobCards);

  const [material, setMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [stage, setStage] = useState<any>(null);

  useEffect(() => {
    dispatch(getAllMaterialsThunk());
    dispatch(getWastageReportThunk(undefined));
  }, [dispatch]);

  const materialOptions = materials.map((m: any) => ({ label: m.materialName, value: m._id }));

  const handleFilter = () => {
    dispatch(
      getWastageReportThunk({
        materialId: material ? String(material.value) : undefined,
        stage: stage ? stage.value : undefined,
      })
    );
  };

  const handleClear = () => {
    setMaterial(null);
    setStage(null);
    dispatch(getWastageReportThunk(undefined));
  };

  const totalWastedOverall = wastageReport.reduce((sum, r) => sum + (r.totalWasted || 0), 0);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Wastage Report
        </Typography>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/job-card")}>
          Back to Job Cards
        </ThemeButton>
      </Box>
      <Typography fontSize={14} color="text.secondary" mb={3}>
        Actual material wastage recorded against job card stages, compared against each recipe&apos;s expected
        wastage % where one has been set.
      </Typography>

      <Stack direction="row" spacing={2} mb={3} alignItems="flex-end" flexWrap="wrap" useFlexGap>
        <Box minWidth={220}>
          <ThemeSelect label="Material" options={materialOptions} value={material} onChange={(_, v) => setMaterial(v)} />
        </Box>
        <Box minWidth={180}>
          <ThemeSelect label="Stage" options={STAGES.map((s) => ({ label: s, value: s }))} value={stage} onChange={(_, v) => setStage(v)} />
        </Box>
        <ThemeButton onClick={handleFilter} sx={{ background: "#175CD3", height: 40 }}>
          Apply Filters
        </ThemeButton>
        <ThemeButton variant="outlined" onClick={handleClear} sx={{ height: 40 }}>
          Clear
        </ThemeButton>
      </Stack>

      {wastageReportLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : wastageReport.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            No wastage recorded for the selected filters.
          </Typography>
        </Paper>
      ) : (
        <>
          <BasicTable
            tableHeader={columns}
            rowData={(wastageReport as WastageRow[]).map((r, i) => ({ ...r, id: r.material?._id || String(i) }))}
            showDatePicker={false}
            showSearch={false}
            showFillter={false}
            csvColumns={[
              { id: "material", label: "Material", value: (row: WastageRow) => row.material?.materialName || "-" },
              { id: "totalWasted", label: "Total Wasted", value: (row: WastageRow) => row.totalWasted },
              { id: "expectedWastagePercent", label: "Expected Wastage %", value: (row: WastageRow) => (row.expectedWastagePercent != null ? `${row.expectedWastagePercent}%` : "No plan set") },
              {
                id: "byStage",
                label: "By Stage",
                value: (row: WastageRow) =>
                  Object.entries(row.byStage || {})
                    .map(([s, qty]) => `${s}: ${qty}`)
                    .join("; "),
              },
            ]}
            exportFilename="wastage-report"
            renderRow={(row: WastageRow) => (
              <>
                <TableCell>{row.material?.materialName || "-"}</TableCell>
                <TableCell>{row.totalWasted}</TableCell>
                <TableCell>{row.expectedWastagePercent != null ? `${row.expectedWastagePercent}%` : "No plan set"}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {Object.entries(row.byStage || {}).map(([s, qty]) => (
                      <Chip key={s} size="small" label={`${s}: ${qty}`} sx={{ background: "#F2F4F7" }} />
                    ))}
                  </Stack>
                </TableCell>
              </>
            )}
          />
          <Typography fontSize={13} color="text.secondary" mt={2}>
            Total wasted across {wastageReport.length} material{wastageReport.length === 1 ? "" : "s"}: {totalWastedOverall}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default WastageReportPage;
