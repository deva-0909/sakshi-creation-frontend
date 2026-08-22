import React, { useState, useEffect } from "react";
import { Box, Typography, Paper } from "@mui/material";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAppSettingsThunk, bulkUpdateAppSettingsThunk, clearAppSettingsError, clearAppSettingsSuccessMessage } from "@/store/slices/appSettingsSlice";
import { toast } from "react-toastify";

// Module 10: general/company-wide settings. Keys are seeded by migration --
// this page only reads/updates existing keys, it never creates or deletes one.
const GST_TYPES = ["CGST_SGST", "IGST"];

const FIELD_META: Record<string, { label: string; helper: string; type: "text" | "textarea" | "number" | "gstType" }> = {
  company_legal_name: { label: "Company Legal Name", helper: "Legal / registered name shown on generated documents", type: "text" },
  default_gst_type: { label: "Default GST Type", helper: "Fallback GST type when a party/company state is not yet set", type: "gstType" },
  financial_year_start_month: { label: "Financial Year Start Month", helper: "Month (1-12) the financial year starts -- default April", type: "number" },
  invoice_terms: { label: "Invoice Terms & Conditions", helper: "Default terms & conditions text shown on invoices", type: "textarea" },
  low_stock_alert_threshold: { label: "Low Stock Alert Threshold", helper: "Optional global fallback low-stock quantity, used only where a material has no specific threshold", type: "number" },
};

const GeneralSettingsPage = () => {
  const dispatch = useAppDispatch();
  const { settings, loading, error, successMessage } = useAppSelector((state) => state.appSettings);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.appsettings;

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(getAppSettingsThunk());
  }, [dispatch]);

  useEffect(() => {
    const next: Record<string, string> = {};
    settings.forEach((s) => {
      next[s.settingKey] = s.settingValue ?? "";
    });
    setValues(next);
  }, [settings]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearAppSettingsSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearAppSettingsError());
    }
  }, [successMessage, error, dispatch]);

  const handleChange = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleSave = async () => {
    const payload: Record<string, string | number | null> = {};
    Object.entries(values).forEach(([key, value]) => {
      payload[key] = value.trim() === "" ? null : value;
    });
    try {
      await dispatch(bulkUpdateAppSettingsThunk(payload)).unwrap();
    } catch (err: any) {
      // error toast already handled by the effect above
    }
  };

  const orderedKeys = Object.keys(FIELD_META).filter((k) => settings.some((s) => s.settingKey === k));

  return (
    <Box p={3}>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600}>
          General Settings
        </Typography>
        <Typography fontSize={14} color="text.secondary">
          Company-wide defaults used across quotations, invoices, and inventory alerts.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>
          {orderedKeys.map((key) => {
            const meta = FIELD_META[key];
            return (
              <Box key={key}>
                {meta.type === "gstType" ? (
                  <Select
                    label={meta.label}
                    options={GST_TYPES.map((g) => ({ label: g, value: g }))}
                    value={values[key] ? { label: values[key], value: values[key] } : null}
                    onChange={(_, v) => handleChange(key, v ? String(v.value) : "")}
                  />
                ) : (
                  <Input
                    labelName={meta.label}
                    value={values[key] || ""}
                    onChange={(e: any) => handleChange(key, e.target.value)}
                    fullWidth
                    type={meta.type === "number" ? "number" : "text"}
                    multiline={meta.type === "textarea"}
                    rows={meta.type === "textarea" ? 3 : undefined}
                  />
                )}
                <Typography fontSize={12} color="text.secondary" mt={0.5}>
                  {meta.helper}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {permissions?.edit && (
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              sx={{ borderRadius: 2, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
            >
              Save Settings
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default GeneralSettingsPage;
