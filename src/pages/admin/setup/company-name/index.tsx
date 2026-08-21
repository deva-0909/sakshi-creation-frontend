"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Typography, IconButton, TableCell, Button as MuiButton } from "@mui/material"
import { Add, Edit, Delete, CloudUpload as CloudUploadIcon } from "@mui/icons-material"
import BasicTable from "@/component/common_component/Table/themetable"
import Input from "@/component/common_component/themeinput"
import Button from "@/component/common_component/themebutton"
import CustomDialog from "@/component/customdialog"
import {
  createCompanyNameThunk,
  getAllCompanyNamesThunk,
  updateCompanyNameThunk,
  deleteCompanyNameThunk,
  clearCompanyNameError,
  clearCompanyNameSuccessMessage,
} from "@/store/slices/companyNameSlice"
import { useAppDispatch, useAppSelector, type RootState } from "@/store"
import { toast } from "react-toastify"
import { fileUploadService } from "@/services/fileUpload.service"
import Swal from "sweetalert2"

interface CompanyName {
  _id: string
  companyName: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

interface CompanyNameRow extends CompanyName {
  id: string
}

interface FormData {
  companyName: string
  logo?: File | null
}

const columns = [
  { id: "id", label: "ID" },
  { id: "companyName", label: "Company Name" },
  { id: "avatar", label: "Logo" },
  { id: "options", label: "Options" },
]

const CompanyNamePage = () => {
  const dispatch = useAppDispatch()
  const { companyNames, loading, error, successMessage } = useAppSelector((state: RootState) => state.companyNames)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    companyName: "",
    logo: null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Fetch all company names on component mount
  useEffect(() => {
    dispatch(getAllCompanyNamesThunk())
  }, [dispatch])

  // Handle success and error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearCompanyNameSuccessMessage())
    }
    if (error) {
      toast.error(error)
      dispatch(clearCompanyNameError())
    }
  }, [successMessage, error, dispatch])

  // Open dialog for add or edit
  const handleOpenDialog = (company?: CompanyName) => {
    if (company) {
      setEditId(company._id)
      setForm({ companyName: company.companyName, logo: null })
      setLogoPreview(company.avatar || null)
    } else {
      setEditId(null)
      setForm({ companyName: "", logo: null })
      setLogoPreview(null)
    }
    setDialogOpen(true)
  }

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, companyName: e.target.value })
  }

  // Handle logo file changes
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm({ ...form, logo: file })

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      let logoUrl = logoPreview; // Use existing logo preview as fallback

      // Upload logo if provided
      if (form.logo) {
        const uploadResponse = await fileUploadService.uploadSingleFile(form.logo, "company-logos");
        if (uploadResponse.success && uploadResponse.data) {
          logoUrl = uploadResponse.data.url;
        }
      }

      const companyData = {
        companyName: form.companyName,
        avatar: logoUrl || "", // Send existing logo URL or empty string if no logo
      };

      if (editId) {
        dispatch(updateCompanyNameThunk({ id: editId, data: companyData }))
      } else {
        dispatch(createCompanyNameThunk(companyData))
      }

      setDialogOpen(false)
      setForm({ companyName: "", logo: null })
      setLogoPreview(null)
      setEditId(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to save company")
    }
  }

  // Delete company name
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteCompanyNameThunk(id))
        Swal.fire({
          title: "Deleted!",
          text: "Company deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete task",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  // Close dialog handler
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setForm({ companyName: "", logo: null })
    setLogoPreview(null)
    setEditId(null)
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Company Names
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} disabled={loading}>
          New Company
        </Button>
      </Box>
      <BasicTable
        tableHeader={columns}
        rowData={companyNames.map((c: CompanyName) => ({ ...c, id: c._id }))}
        showDatePicker={false}
        renderRow={(row: CompanyNameRow, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.companyName}</TableCell>
            <TableCell>
              {row.avatar && (
                <img
                  src={row.avatar || "/placeholder.svg"}
                  alt="Company Logo"
                  style={{ width: 50, height: 50, borderRadius: "50%" }}
                />
              )}
            </TableCell>
            <TableCell>
              <IconButton color="primary" onClick={() => handleOpenDialog(row)} disabled={loading}>
                <Edit />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(row._id)} disabled={loading}>
                <Delete />
              </IconButton>
            </TableCell>
          </>
        )}
      />

      {/* Add/Edit Dialog */}
      <CustomDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={editId ? "Edit Company Name" : "New Company Name"}
        maxWidth="sm"
        fullWidth
      >
        <Input
          label="Company Name"
          name="companyName"
          value={form.companyName}
          onChange={handleFormChange}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />

        {/* Logo Upload Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Company Logo
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Logo Preview */}
            {logoPreview && (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "2px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={logoPreview || "/placeholder.svg"}
                  alt="Logo preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}

            {/* Upload Button */}
            <MuiButton
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ textTransform: "none" }}
            >
              {logoPreview ? "Change Logo" : "Upload Logo"}
              <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
            </MuiButton>

            {/* Remove Logo Button */}
            {logoPreview && (
              <MuiButton
                variant="text"
                color="error"
                onClick={() => {
                  setForm({ ...form, logo: null })
                  setLogoPreview(null)
                }}
                sx={{ textTransform: "none" }}
              >
                Remove
              </MuiButton>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Recommended: Square image, max 2MB (PNG, JPG, JPEG)
          </Typography>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Close
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  )
}

export default CompanyNamePage
