"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Box, Checkbox, debounce, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import CustomDialog from "@/component/customdialog";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeButton from "@/component/common_component/themebutton";
import ImportErrorsTable, { ImportRowError } from "@/component/bulkImport/ImportErrorsTable";
import ImportHistoryDialog from "@/component/bulkImport/ImportHistoryDialog";
import { downloadBulkTemplate } from "@/utils/downloadTemplate";
import Endpoint from "@/API/apiConfig";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createAccountMasterThunk,
  updateAccountMasterThunk,
  getAccountMasterByIdThunk,
  clearSuccessMessage,
  clearError,
  searchPartiesThunk,
  clearSuggestions,
  getAccountMasterByCompanyAndPartyThunk,
  bulkCreateAccountMastersThunk,
} from "@/store/slices/accountMasterSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import CompanySelect from "./reusablecomponents/CompanyWithPartyName";
import type { PartySuggestion } from "@/services/accountMaster.service" // Import PartySuggestion type
import { authService } from "@/services/auth.service";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

interface Address {
  unitNo: string;
  marketName: string;
  streetAddress: string;
  landMark?: string;
  area: string;
  pincode: string;
}

interface FormData {
  companyName: string;
  partyName: string;
  ownerName?: string;
  ownerMobileNo: string;
  ownerWhatsAppNo: string;
  ownerEmail?: string;
  contactPerson: string;
  personMobileNo: string;
  personWhatsAppNo: string;
  contactPersonEmail?: string;
  contactForPayment: string;
  contactMobileNo: string;
  contactWhatsAppNo: string;
  contactForPaymentEmail?: string;
  GSTNo: string;
  state: string;
  address: Address;
  reasonToVisit: string;
  reference: string;
  createdBy: string;
  isRequestMode?: boolean;
  // Module 9: optional receivable credit limit, kept as a string in form
  // state (like every other ThemeInput here) and converted to a number on
  // submit.
  creditLimit: string;
}

interface AddNewPartyDialogProps {
  open: boolean;
  onClose: () => void;
  accountId?: string;
  refreshData?: () => void;
  isRequestMode?: boolean;
  isBulkUpload?: boolean; // New prop to handle bulk upload mode
}

const validationSchema = Yup.object({
  companyName: Yup.string().required("Company Name is required"),
  partyName: Yup.string().required("Party Name is required"),
  ownerMobileNo: Yup.string().matches(/^[0-9]{10}$/, "Owner Mobile No. must be 10 digits"),
  ownerWhatsAppNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Owner WhatsApp No. must be 10 digits")
    .required("Owner WhatsApp No. is required"),
  GSTNo: Yup.string(),
  creditLimit: Yup.string().matches(/^[0-9]*\.?[0-9]*$/, "Credit Limit must be a number"),
  address: Yup.object({
    unitNo: Yup.string().required("Unit No. is required"),
    marketName: Yup.string().required("Market Name is required"),
    streetAddress: Yup.string().required("Street Address is required"),
    landMark: Yup.string(),
    area: Yup.string().required("Area is required"),
    pincode: Yup.string()
      .matches(/^[0-9]{6}$/, "Pincode must be 6 digits")
      .required("Pincode is required"),
  }),
  reasonToVisit: Yup.string().required("Reason to Visit is required"),
  createdBy: Yup.string().required("Created By is required"),
});

const AddNewPartyDialog: React.FC<AddNewPartyDialogProps> = ({
  open,
  onClose,
  accountId,
  refreshData,
  isRequestMode = false,
  isBulkUpload = false,
}) => {
  const dispatch = useAppDispatch();
  const { staffList, loading: staffLoading, error: staffError } = useAppSelector(
    (state) => state.staff
  );
  const {
    loading: accountLoading,
    error: accountError,
    successMessage,
    partySuggestions,
  } = useAppSelector((state) => state.accountMasters);

  const [isLoading, setIsLoading] = useState(false);
  const [partyOptions, setPartyOptions] = useState<PartySuggestion[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hasReference, setHasReference] = useState("no");
  const [importErrors, setImportErrors] = useState<ImportRowError[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isEditMode = !!accountId;

  const currentUser = authService.getUser();

  useEffect(() => {
    if (open) {
      dispatch(clearSuccessMessage());
      dispatch(clearError());
      setFile(null);
      setImportErrors([]);
      setImportSuccessCount(0);
    }
  }, [open, dispatch]);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        dispatch(searchPartiesThunk(query));
      } else {
        dispatch(clearSuggestions());
      }
    }, 300),
    [dispatch]
  );

  useEffect(() => {
    setPartyOptions(partySuggestions);
  }, [partySuggestions]);

  const formik = useFormik<FormData>({
    initialValues: {
      companyName: "",
      partyName: "",
      ownerName: "",
      ownerMobileNo: "",
      ownerWhatsAppNo: "",
      ownerEmail: "",
      contactPerson: "",
      personMobileNo: "",
      personWhatsAppNo: "",
      contactPersonEmail: "",
      contactForPayment: "",
      contactMobileNo: "",
      contactWhatsAppNo: "",
      contactForPaymentEmail: "",
      GSTNo: "",
      state: "",
      address: {
        unitNo: "",
        marketName: "",
        streetAddress: "",
        landMark: "",
        area: "",
        pincode: "",
      },
      reasonToVisit: "Visit",
      reference: "",
      createdBy: isRequestMode ? (currentUser?.id || "") : "",
      isRequestMode,
      creditLimit: "",
    },
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setErrors(errors);
        return;
      }
    const submissionValues = {
        ...values,
        reference: hasReference === "yes" ? values.reference : "",
        creditLimit: values.creditLimit !== "" ? Number(values.creditLimit) : undefined,
      };
      setIsLoading(true);
      try {
        if (isEditMode && accountId) {
          await dispatch(updateAccountMasterThunk({ id: accountId, data: submissionValues })).unwrap();
        } else if (!isBulkUpload) {
          await dispatch(createAccountMasterThunk(submissionValues)).unwrap();
        }
        formik.resetForm();
        if (refreshData) refreshData();
        onClose();
      } catch (err: any) {
        toast.error(err.message || "Operation failed");
      } finally {
        setIsLoading(false);
      }
    },
  });

  //  useEffect(() => {
  //   if (isEditMode && formik.values.reference) {
  //     setHasReference("yes");
  //   } else {
  //     setHasReference("no");
  //   }
  // }, [isEditMode, formik.values.reference]);

  const handleDownloadTemplateClick = async () => {
    try {
      await downloadBulkTemplate(Endpoint.BULK_ACCOUNT_MASTER_TEMPLATE, "accountMaster-bulk-import-template.csv");
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    }
  };

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        await dispatch(getAllStaffThunk());

        if (isEditMode && accountId) {
          const result = await dispatch(getAccountMasterByIdThunk(accountId)).unwrap();
          if (!result) {
            return;
          }
          formik.setValues({
            companyName: result.companyName || "",
            partyName: result.partyName || "",
            ownerName: result.ownerName || "",
            ownerMobileNo: result.ownerMobileNo || "",
            ownerWhatsAppNo: result.ownerWhatsAppNo || "",
            ownerEmail: result.ownerEmail || "",
            contactPerson: result.contactPerson || "",
            personMobileNo: result.personMobileNo || "",
            personWhatsAppNo: result.personWhatsAppNo || "",
            contactPersonEmail: result.contactPersonEmail || "",
            contactForPayment: result.contactForPayment || "",
            contactMobileNo: result.contactMobileNo || "",
            contactWhatsAppNo: result.contactWhatsAppNo || "",
            contactForPaymentEmail: result.contactForPaymentEmail || "",
            GSTNo: result.GSTNo || "",
            state: result.state || "",
            address: {
              unitNo: result.address?.unitNo || "",
              marketName: result.address?.marketName || "",
              streetAddress: result.address?.streetAddress || "",
              landMark: result.address?.landMark || "",
              area: result.address?.area || "",
              pincode: result.address?.pincode || "",
            },
            reasonToVisit: result.reasonToVisit || "Visit",
            reference: result.reference || "",
            createdBy:
              result.createdById || (typeof result.createdBy === "object" ? result.createdBy._id : ""),
            isRequestMode,
            creditLimit: result.creditLimit != null ? String(result.creditLimit) : "",
          });
          setInputValue(result.partyName || "");
        } else {
          formik.resetForm({
            values: {
              ...formik.initialValues,
              createdBy: isRequestMode ? (currentUser?.id || "") : "",
              isRequestMode,
            },
          });
          setInputValue("");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, isEditMode, accountId, dispatch, isRequestMode, currentUser?.id]);

  useEffect(() => {
    if (accountError) {
      toast.error(accountError);
    }
    if (staffError) {
      toast.error(staffError);
    }
  }, [accountError, staffError]);

  const reasonOptions = [
    { label: "Visit", value: "Visit" },
    { label: "Order", value: "Order" },
    { label: "Reference", value: "Reference" },
  ];

  const staffOptions = isRequestMode
    ? []
    : staffList
        .filter((staff) => staff.role?.roleName === "Sales Staff")
        .map((staff) => ({
          label: staff.name,
          value: staff.id,
        }));

  const getSelectedOption = (value: string, options: { label: string; value: string }[]) => {
    const selected = options.find((option) => option.value === value);
    return selected || null;
  };

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : "";
    formik.setFieldValue("companyName", companyId);
    formik.setFieldValue("partyName", "");
    setInputValue("");
    dispatch(clearSuggestions());
  }

  const loadPartyDetails = async (selectedParty: PartySuggestion) => {
    if (!formik.values.companyName) {
      toast.error("Please select a company first")
      return
    }

    try {
      const response = await dispatch(
        getAccountMasterByCompanyAndPartyThunk({
          companyId: formik.values.companyName,
          partyId: selectedParty._id,
        }),
      ).unwrap()

      const partyData = response.accountMaster?.party
      if (partyData) {
        formik.setValues({
          ...formik.values,
          partyName: partyData.partyName,
          ownerName: partyData.ownerName || "",
          ownerMobileNo: partyData.ownerMobileNo || "",
          ownerWhatsAppNo: partyData.ownerWhatsAppNo || "",
          ownerEmail: partyData.ownerEmail || "",
          contactPerson: partyData.contactPerson || "",
          personMobileNo: partyData.personMobileNo || "",
          personWhatsAppNo: partyData.personWhatsAppNo || "",
          contactPersonEmail: partyData.contactPersonEmail || "",
          contactForPayment: partyData.contactForPayment || "",
          contactMobileNo: partyData.contactMobileNo || "",
          contactWhatsAppNo: partyData.contactWhatsAppNo || "",
          contactForPaymentEmail: partyData.contactForPaymentEmail || "",
          GSTNo: partyData.GSTNo || "",
          state: partyData.state || "",
          address: {
            unitNo: partyData.address?.unitNo || "",
            marketName: partyData.address?.marketName || "",
            streetAddress: partyData.address?.streetAddress || "",
            landMark: partyData.address?.landMark || "",
            area: partyData.address?.area || "",
            pincode: partyData.address?.pincode || "",
          },
          reference: partyData.reference || "",
          creditLimit: partyData.creditLimit != null ? String(partyData.creditLimit) : "",
        })
        toast.success("Existing party data loaded successfully")
      } else {
        toast.error("No party data found in response")
      }
    } catch (err: any) {
      toast.error("Failed to load party details: " + err.message)
    }
  }

  return (
    <CustomDialog
      open={open}
      maxWidth="xl"
      onClose={onClose}
      title={
        isEditMode
          ? "Edit Party"
          : isRequestMode
          ? "Add New Party Request"
          : isBulkUpload
          ? "Bulk Upload Parties"
          : "Add New Party"
      }
    >
      <Box sx={{ background: "#fff", borderRadius: 2 }} component="form" onSubmit={formik.handleSubmit}>
        {!isBulkUpload && (
          <>
            <Box display="flex" gap={2} mb={1} justifyContent="space-between" width="100%">
              <CompanySelect
                name="companyName"
                value={formik.values.companyName}
                onChange={handleCompanyChange}
                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                helperText={formik.touched.companyName && formik.errors.companyName}
                hasParties={false}
                required
                showPartyName={false}
                partyName={formik.values.partyName}
                onPartyChange={(event, newValue) => {
                  const partyId = newValue ? newValue.value : ""
                  formik.setFieldValue("partyName", partyId)
                  setInputValue(partyId)

                  const selectedParty = partyOptions.find((option) => option.partyName === partyId)
                  if (selectedParty && selectedParty._id) {
                    loadPartyDetails(selectedParty)
                  }
                }}
              />
              <ThemeInput
                labelName="Party Name"
                placeholder="Party Name"
                fullWidth
                required
                name="partyName"
                value={formik.values.partyName}
                onChange={(e) => {
                  const value = e.target.value
                  formik.setFieldValue("partyName", value)
                  setInputValue(value)
                  debouncedSearch(value)
                }}
                error={formik.touched.partyName && Boolean(formik.errors.partyName)}
                helperText={formik.touched.partyName && formik.errors.partyName}
                autocomplete
                options={partyOptions.map((option) => `${option.partyName} - ${option.address?.unitNo}, ${option.address?.marketName}`) as any}
                onOptionSelect={async (selectedValue) => {
                  const selectedPartyName = selectedValue.split(" - ")[0];
                  formik.setFieldValue("partyName", selectedPartyName)
                  setInputValue(selectedPartyName)

                  const selectedParty = partyOptions.find((option) => option.partyName === selectedPartyName)
                  if (selectedParty && selectedParty._id) {
                    loadPartyDetails(selectedParty)
                  }
                }}
              />
            </Box>

            <Box display="flex" gap={2} mb={1}>
              <ThemeInput
                labelName="Owner Name"
                placeholder="Owner Name"
                fullWidth
                name="ownerName"
                value={formik.values.ownerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerName)}
                helperText={formik.touched.ownerName && formik.errors.ownerName}
              />
              <ThemeInput
                labelName="Owner WhatsApp No."
                placeholder="98312-13221"
                mobile
                fullWidth
                name="ownerWhatsAppNo"
                value={formik.values.ownerWhatsAppNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("ownerWhatsAppNo", value);
                  formik.setFieldError(
                    "ownerWhatsAppNo",
                    value.length !== 10 ? "WhatsApp No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerWhatsAppNo)}
                helperText={formik.touched.ownerWhatsAppNo && formik.errors.ownerWhatsAppNo}
                required
              />
              <ThemeInput
                labelName="Owner Mobile No."
                placeholder="98312-13221"
                mobile
                fullWidth
                name="ownerMobileNo"
                value={formik.values.ownerMobileNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("ownerMobileNo", value);
                  formik.setFieldError(
                    "ownerMobileNo",
                    value.length !== 10 ? "Mobile No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerMobileNo)}
                helperText={formik.touched.ownerMobileNo && formik.errors.ownerMobileNo}
              />
              <ThemeInput
                labelName="Owner Email"
                placeholder="owner@example.com"
                fullWidth
                name="ownerEmail"
                value={formik.values.ownerEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.ownerEmail)}
                helperText={formik.touched.ownerEmail && formik.errors.ownerEmail}
              />
            </Box>

            <Box display="flex" gap={2} mb={1}>
              <ThemeInput
                labelName="Contact Person"
                placeholder="Contact Person"
                fullWidth
                name="contactPerson"
                value={formik.values.contactPerson}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactPerson)}
                helperText={formik.touched.contactPerson && formik.errors.contactPerson}
              />
              <ThemeInput
                labelName="Person WhatsApp No."
                placeholder="98312-13221"
                mobile
                fullWidth
                name="personWhatsAppNo"
                value={formik.values.personWhatsAppNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("personWhatsAppNo", value);
                  formik.setFieldError(
                    "personWhatsAppNo",
                    value.length !== 10 ? "WhatsApp No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.personWhatsAppNo)}
                helperText={formik.touched.personWhatsAppNo && formik.errors.personWhatsAppNo}
              />
              <ThemeInput
                labelName="Person Mobile No."
                placeholder="98312-13221"
                mobile
                fullWidth
                name="personMobileNo"
                value={formik.values.personMobileNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("personMobileNo", value);
                  formik.setFieldError(
                    "personMobileNo",
                    value.length !== 10 ? "Mobile No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.personMobileNo)}
                helperText={formik.touched.personMobileNo && formik.errors.personMobileNo}
              />
              <ThemeInput
                labelName="Contact Person Email"
                placeholder="contact@example.com"
                fullWidth
                name="contactPersonEmail"
                value={formik.values.contactPersonEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactPersonEmail)}
                helperText={formik.touched.contactPersonEmail && formik.errors.contactPersonEmail}
              />
            </Box>

            <Box display="flex" gap={2} mb={1}>
              <ThemeInput
                labelName="Contact For Payment"
                placeholder="Contact Name"
                fullWidth
                sx={{ mb: 2 }}
                name="contactForPayment"
                value={formik.values.contactForPayment}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactForPayment)}
                helperText={formik.touched.contactForPayment && formik.errors.contactForPayment}
              />
              <ThemeInput
                labelName="Contact WhatsApp No."
                placeholder="98312-13221"
                mobile
                fullWidth
                name="contactWhatsAppNo"
                value={formik.values.contactWhatsAppNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("contactWhatsAppNo", value);
                  formik.setFieldError(
                    "contactWhatsAppNo",
                    value.length !== 10 ? "WhatsApp No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactWhatsAppNo)}
                helperText={formik.touched.contactWhatsAppNo && formik.errors.contactWhatsAppNo}
              />
              <ThemeInput
                labelName="Contact Mobile No."
                placeholder="98312-13221"
                mobile
                fullWidth
                name="contactMobileNo"
                value={formik.values.contactMobileNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  formik.setFieldValue("contactMobileNo", value);
                  formik.setFieldError(
                    "contactMobileNo",
                    value.length !== 10 ? "Mobile No. must be 10 digits" : undefined
                  );
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactMobileNo)}
                helperText={formik.touched.contactMobileNo && formik.errors.contactMobileNo}
              />
              <ThemeInput
                labelName="Contact For Payment Email"
                placeholder="payment@example.com"
                fullWidth
                name="contactForPaymentEmail"
                value={formik.values.contactForPaymentEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.contactForPaymentEmail)}
                helperText={formik.touched.contactForPaymentEmail && formik.errors.contactForPaymentEmail}
              />
            </Box>

           <Box display="flex" gap={2} mb={1} alignItems="flex-end">
  {/* GST Field */}
            <Box sx={{ width: '24.2%' }}>
              <ThemeInput
                labelName="GST No."
                placeholder="22AAAAA0000A1Z5"
                fullWidth
                name="GSTNo"
                value={formik.values.GSTNo}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
                  formik.setFieldValue("GSTNo", value);
                  if (value) {
                    if (value.length !== 15) {
                      formik.setFieldError("GSTNo", "GST No. must be exactly 15 characters");
                    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(value)) {
                      formik.setFieldError("GSTNo", "Invalid GST format (e.g. 22AAAAA0000A1Z5)");
                    } else {
                      formik.setFieldError("GSTNo", undefined);
                    }
                  }
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.GSTNo)}
                helperText={formik.touched.GSTNo && formik.errors.GSTNo}
              />
            </Box>

  {/* State -- used to auto-determine CGST/SGST vs IGST when raising invoices */}
            <Box sx={{ width: '20%' }}>
              <ThemeInput
                labelName="State"
                fullWidth
                name="state"
                value={formik.values.state}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.state)}
                helperText={formik.touched.state && formik.errors.state}
              />
            </Box>

  {/* Credit Limit (Module 9) -- optional; leaving it blank means no limit is enforced */}
            <Box sx={{ width: '20%' }}>
              <ThemeInput
                labelName="Credit Limit (optional)"
                placeholder="e.g. 50000"
                fullWidth
                name="creditLimit"
                value={formik.values.creditLimit}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  formik.setFieldValue("creditLimit", value);
                }}
                onBlur={formik.handleBlur}
                error={Boolean(formik.errors.creditLimit)}
                helperText={formik.touched.creditLimit && formik.errors.creditLimit}
              />
            </Box>

  {/* Reference Radio Buttons */}
  <Box sx={{ width: '20%', mt: 2 }}>
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend">Reference</FormLabel>
      <RadioGroup
        row
        name="hasReference"
        value={hasReference}
        onChange={(e) => {
          const value = e.target.value;
          setHasReference(value);
          if (value === "no") {
            formik.setFieldValue("reference", "");
          }
        }}
      >
        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
        <FormControlLabel value="no" control={<Radio />} label="No" />
      </RadioGroup>
    </FormControl>
  </Box>
  
  {/* Reference Input Field - Only shows when "Yes" is selected */}
  {hasReference === "yes" && (
    <Box sx={{ width: '50%' }}>
      <ThemeInput
        labelName="Reference Details"
        placeholder="Enter Reference"
        fullWidth
        name="reference"
        value={formik.values.reference}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.errors.reference)}
        helperText={formik.touched.reference && formik.errors.reference}
      />
    </Box>
  )}
</Box>

            <Box>
              <Typography fontWeight={500} fontSize={14} mb={1}>
                Address
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box display="flex" gap={2}>
                  <ThemeInput
                    label="Unit No."
                    name="address.unitNo"
                    value={formik.values.address.unitNo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.unitNo)}
                    helperText={formik.touched.address?.unitNo && formik.errors.address?.unitNo}
                    required
                  />
                  <ThemeInput
                    label="Market Name"
                    name="address.marketName"
                    value={formik.values.address.marketName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.marketName)}
                    helperText={formik.touched.address?.marketName && formik.errors.address?.marketName}
                    required
                  />
                  <ThemeInput
                    label="Area"
                    name="address.area"
                    value={formik.values.address.area}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.area)}
                    helperText={formik.touched.address?.area && formik.errors.address?.area}
                    required
                  />
                  <ThemeInput
                    label="Street Address"
                    name="address.streetAddress"
                    value={formik.values.address.streetAddress}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.streetAddress)}
                    helperText={formik.touched.address?.streetAddress && formik.errors.address?.streetAddress}
                    required
                  />
                  <ThemeInput
                    label="Land Mark"
                    name="address.landMark"
                    value={formik.values.address.landMark}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.landMark)}
                    helperText={formik.touched.address?.landMark && formik.errors.address?.landMark}
                  />
                  <ThemeInput
                    label="Pin Code"
                    name="address.pincode"
                    value={formik.values.address.pincode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={Boolean(formik.errors.address?.pincode)}
                    helperText={formik.touched.address?.pincode && formik.errors.address?.pincode}
                    required
                  />
                </Box>
              </Box>

              <Box mt={3}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box display="flex" width="260px">
                    <ThemeSelect
                      label="Reason to Visit"
                      options={reasonOptions}
                      value={getSelectedOption(formik.values.reasonToVisit, reasonOptions)}
                      onChange={(event, newValue) => {
                        formik.setFieldValue("reasonToVisit", newValue ? newValue.value : "");
                      }}
                      name="reasonToVisit"
                      error={Boolean(formik.errors.reasonToVisit)}
                      helperText={formik.touched.reasonToVisit && formik.errors.reasonToVisit}
                      required
                    />
                  </Box>
                  {!isRequestMode && (
                    <Box display="flex" width="100%">
                      <ThemeSelect
                        label="Created By"
                        options={staffOptions}
                        value={getSelectedOption(formik.values.createdBy, staffOptions)}
                        onChange={(event, newValue) => {
                          formik.setFieldValue("createdBy", newValue ? newValue.value : "");
                        }}
                        name="createdBy"
                        error={Boolean(formik.errors.createdBy)}
                        helperText={formik.touched.createdBy && formik.errors.createdBy}
                        required
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}

        {isBulkUpload && (
          <>
            <Box display="flex" gap={2} mb={1} justifyContent="space-between" width="100%">
              <CompanySelect
                name="companyName"
                value={formik.values.companyName}
                onChange={handleCompanyChange}
                error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                helperText={formik.touched.companyName && formik.errors.companyName}
                hasParties={false}
                required
                showPartyName={false}
              />
              {!isRequestMode && (
                <ThemeSelect
                  label="Created By"
                  options={staffOptions}
                  value={getSelectedOption(formik.values.createdBy, staffOptions)}
                  onChange={(event, newValue) => {
                    formik.setFieldValue("createdBy", newValue ? newValue.value : "");
                  }}
                  name="createdBy"
                  error={Boolean(formik.errors.createdBy)}
                  helperText={formik.touched.createdBy && formik.errors.createdBy}
                  required
                />
              )}
            </Box>

            <Box mt={2}>
              <Typography fontWeight={500} fontSize={14} mb={1}>
                Bulk Upload
              </Typography>
              <Box
                sx={{
                  border: "2px dashed #e0e0e0",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  backgroundColor: "#fafafa",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "#1976d2",
                    backgroundColor: "#f5f5f5",
                  },
                  ...(file && {
                    borderColor: "#4caf50",
                    backgroundColor: "#f1f8e9",
                  }),
                }}
                onClick={() => document.getElementById("bulk-file-input")?.click()}
              >
                <input
                  id="bulk-file-input"
                  type="file"
                  accept=".csv, .xlsx"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) setFile(selectedFile);
                  }}
                  style={{ display: "none" }}
                />

                {!file ? (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                        📁 Choose File to Upload
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Click here to select CSV or Excel file
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Supported formats: .csv, .xlsx
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                        ✅ File Selected
                      </Typography>
                      <Typography variant="body2" color="textPrimary" fontWeight={500}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        Size: {(file.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              <ImportErrorsTable
                successCount={importSuccessCount}
                failedCount={importErrors.length}
                errors={importErrors}
              />

              <Box display="flex" gap={2} alignItems="center" justifyContent="center" mt={2} flexWrap="wrap">
                <ThemeButton
                  disabled={!formik.values.companyName || !formik.values.createdBy || !file}
                  onClick={async () => {
                    if (file) {
                      setIsLoading(true);
                      setImportErrors([]);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("companyName", formik.values.companyName);
                        formData.append("createdBy", formik.values.createdBy);
                        const result = await dispatch(bulkCreateAccountMastersThunk(formData)).unwrap();
                        const errors = result.errors || [];
                        setImportErrors(errors);
                        setImportSuccessCount(result.count || 0);
                        if (refreshData) refreshData();
                        setFile(null);
                        // Keep the dialog open when some rows failed, so the
                        // user can see which rows to fix; only close on a
                        // fully clean import.
                        if (errors.length === 0) {
                          onClose();
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Bulk upload failed");
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  sx={{ minWidth: 150 }}
                >
                  {isLoading ? "Uploading..." : "Upload Bulk File"}
                </ThemeButton>

                {file && (
                  <ThemeButton
                    variant="outlined"
                    onClick={() => {
                      setFile(null);
                      const input = document.getElementById("bulk-file-input") as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                    sx={{ minWidth: 100 }}
                  >
                    Clear File
                  </ThemeButton>
                )}
                <ThemeButton
                  variant="outlined"
                  onClick={handleDownloadTemplateClick}
                  sx={{ minWidth: 180 }}
                >
                  Download Sample CSV
                </ThemeButton>
                <ThemeButton
                  variant="outlined"
                  onClick={() => setHistoryOpen(true)}
                  sx={{ minWidth: 180 }}
                >
                  Import History
                </ThemeButton>
              </Box>
            </Box>
          </>
        )}

        <Box display="flex" justifyContent="flex-end" mt={2}>
          {!isBulkUpload && (
            <ThemeButton
              type="submit"
              sx={{ minWidth: 120 }}
              disabled={isLoading || formik.isSubmitting}
            >
              {isLoading || formik.isSubmitting ? "Saving..." : "Save"}
            </ThemeButton>
          )}
        </Box>
      </Box>
      {isBulkUpload && (
        <ImportHistoryDialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          module="accountMaster"
          title="Account Master Import History"
        />
      )}
    </CustomDialog>
  );
};

export default AddNewPartyDialog;