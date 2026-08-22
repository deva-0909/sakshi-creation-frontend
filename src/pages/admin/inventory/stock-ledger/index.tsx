import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, Stack, CircularProgress, Paper, Divider } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { getMaterialLedgerThunk, getStockSummaryThunk, clearMaterialLedger } from "@/store/slices/stockLedgerSlice";
import { toast } from "react-toastify";

// Matches the lowercase category enum on `inventories` (see stockLedger.controller.js's
// VALID_CATEGORIES) -- a different, lowercase enum than the machines.category enum.
const CATEGORIES = [
  { label: "Printer", value: "printer" },
  { label: "Binder", value: "binder" },
  { label: "Booklet", value: "booklet" },
  { label: "Factory", value: "factory" },
  { label: "Godown", value: "godown" },
];

const summaryColumns = [
  { id: "material", label: "Material" },
  { id: "size", label: "Size" },
  { id: "gsm", label: "GSM" },
  { id: "balance", label: "Current Balance" },
];

const ledgerColumns = [
  { id: "date", label: "Date" },
  { id: "category", label: "Category" },
  { id: "type", label: "Type" },
  { id: "quantity", label: "Quantity" },
  { id: "runningBalance", label: "Running Balance" },
];

const StockLedgerPage = () => {
  const dispatch = useAppDispatch();
  const { materials } = useAppSelector((state) => state.materials);
  const { ledger, summary, loading, summaryLoading, error } = useAppSelector((state) => state.stockLedger);

  const [summaryCategory, setSummaryCategory] = useState<{ label: string; value: string | number } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [ledgerCategory, setLedgerCategory] = useState<{ label: string; value: string | number } | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    dispatch(getAllMaterialsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getStockSummaryThunk(summaryCategory ? { category: String(summaryCategory.value) } : undefined));
  }, [summaryCategory, dispatch]);

  useEffect(() => {
    if (selectedMaterial) {
      dispatch(
        getMaterialLedgerThunk({
          materialId: String(selectedMaterial.value),
          params: {
            category: ledgerCategory ? String(ledgerCategory.value) : undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          },
        })
      );
    } else {
      dispatch(clearMaterialLedger());
    }
  }, [selectedMaterial, ledgerCategory, fromDate, toDate, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const materialOptions = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}${m.materialGSM ? ` (${m.materialGSM}gsm)` : ""}`,
    value: m._id,
  }));

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={1}>
        Stock Ledger
      </Typography>
      <Typography fontSize={14} color="text.secondary" mb={3}>
        Computed directly from inventory movements -- no separate balance to fall out of sync. Scope to a category
        (e.g. &quot;how much paper is at the binder&quot;) or leave it unscoped for the company-wide total.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography fontWeight={600} mb={2}>
          Current Balances
        </Typography>
        <Box maxWidth={280} mb={2}>
          <ThemeSelect
            label="Category (optional)"
            options={CATEGORIES}
            value={summaryCategory}
            onChange={(_, v) => setSummaryCategory(v)}
            placeholder="All categories (company-wide total)"
          />
        </Box>
        {summaryLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <BasicTable
            tableHeader={summaryColumns}
            rowData={summary.map((s) => ({ id: s.material._id, ...s }))}
            showDatePicker={false}
            showSearch={false}
            showFillter={false}
            renderRow={(row: any) => (
              <>
                <TableCell>{row.material.materialName}</TableCell>
                <TableCell>{row.material.materialSize || "-"}</TableCell>
                <TableCell>{row.material.materialGSM || "-"}</TableCell>
                <TableCell>{row.balance}</TableCell>
              </>
            )}
          />
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography fontWeight={600} mb={2}>
          Material Ledger
        </Typography>
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" useFlexGap>
          <Box minWidth={260}>
            <ThemeSelect
              label="Material"
              options={materialOptions}
              value={selectedMaterial}
              onChange={(_, v) => setSelectedMaterial(v)}
              placeholder="Select a material to view its ledger"
            />
          </Box>
          <Box minWidth={200}>
            <ThemeSelect
              label="Category (optional)"
              options={CATEGORIES}
              value={ledgerCategory}
              onChange={(_, v) => setLedgerCategory(v)}
              placeholder="All categories"
              disabled={!selectedMaterial}
            />
          </Box>
          <Box width={160}>
            <ThemeInput
              labelName="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={!selectedMaterial}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box width={160}>
            <ThemeInput
              labelName="To"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={!selectedMaterial}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Stack>

        {!selectedMaterial ? (
          <Typography fontSize={14} color="text.secondary">
            Select a material above to see its opening balance, running balance, and movement history.
          </Typography>
        ) : loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          ledger && (
            <>
              <Stack direction="row" spacing={4} mb={2}>
                <Typography fontSize={14} fontWeight={600}>
                  Opening Balance: {ledger.openingBalance}
                </Typography>
                <Typography fontSize={14} fontWeight={600}>
                  Closing Balance: {ledger.closingBalance}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <BasicTable
                tableHeader={ledgerColumns}
                rowData={ledger.rows.map((r) => ({ ...r, id: r._id }))}
                showDatePicker={false}
                showSearch={false}
                showFillter={false}
                renderRow={(row: any) => (
                  <>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.runningBalance}</TableCell>
                  </>
                )}
              />
            </>
          )
        )}
      </Paper>
    </Box>
  );
};

export default StockLedgerPage;
