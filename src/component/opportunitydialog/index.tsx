"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Box, CircularProgress, Typography } from "@mui/material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getStaffListLiteThunk } from "@/store/slices/staffSlice"
import { createOpportunityThunk, clearOpportunityError, clearOpportunitySuccessMessage } from "@/store/slices/opportunitySlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface AddOpportunityDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const SOURCE_OPTIONS: OptionType[] = [
  { label: "Referral", value: "Referral" },
  { label: "Website", value: "Website" },
  { label: "Cold Call", value: "Cold Call" },
  { label: "Exhibition", value: "Exhibition" },
  { label: "Existing Party", value: "Existing Party" },
  { label: "Other", value: "Other" },
]

const AddOpportunityDialog: React.FC<AddOpportunityDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()

  // Tier 1 security audit fix (2026-09-01), Fix 3: this dialog's staff
  // picker only ever needed id/name/roleName (to filter to "Sales Staff"),
  // so it uses staffListLite (no setup.staff view permission required)
  // instead of the full staff roster.
  const { staffListLite: staffList = [], staffListLiteLoading: staffLoading } = useAppSelector((state) => state.staff || {})
  const { loading: opportunityLoading, error: opportunityError, successMessage } = useAppSelector((state) => state.opportunities)

  const [companyName, setCompanyName] = useState<OptionType | null>(null)
  const [prospectName, setProspectName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [estimatedValue, setEstimatedValue] = useState("")
  const [source, setSource] = useState<OptionType | null>(null)
  const [assignedTo, setAssignedTo] = useState<OptionType | null>(null)
  const [notes, setNotes] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      dispatch(clearOpportunityError())
      dispatch(clearOpportunitySuccessMessage())
      if (!staffList?.length) dispatch(getStaffListLiteThunk())
    }
  }, [open, dispatch, staffList?.length])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearOpportunitySuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (opportunityError) {
      toast.error(opportunityError)
      dispatch(clearOpportunityError())
    }
  }, [opportunityError, dispatch])

  const staffOptions: OptionType[] = useMemo(() => {
    return staffList
      .filter((staff: any) => staff.roleName === "Sales Staff")
      .map((staff: any) => ({
        label: staff.name,
        value: staff.id,
      }))
  }, [staffList])

  const resetForm = () => {
    setCompanyName(null)
    setProspectName("")
    setContactPerson("")
    setContactPhone("")
    setContactEmail("")
    setEstimatedValue("")
    setSource(null)
    setAssignedTo(null)
    setNotes("")
    setFollowUpDate("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!companyName) {
      toast.error("Select a company")
      return
    }
    if (!prospectName.trim()) {
      toast.error("Enter the prospect / lead name")
      return
    }
    if (!contactPhone.trim()) {
      toast.error("Enter a contact phone number")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createOpportunityThunk({
          companyName: companyName.value,
          prospectName: prospectName.trim(),
          contactPerson: contactPerson.trim() || undefined,
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
          source: source?.value,
          assignedTo: assignedTo?.value,
          notes: notes || undefined,
          followUpDate: followUpDate || undefined,
        })
      ).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create opportunity")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="sm" title="New Opportunity">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect name="companyName" value={companyName} onChange={(_, v) => setCompanyName(v)} hasParties={false} required />
        </Box>

        <ThemeInput
          labelName="Prospect / Lead Name"
          fullWidth
          required
          value={prospectName}
          onChange={(e) => setProspectName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeInput
          labelName="Contact Person"
          fullWidth
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeInput
          labelName="Contact Phone"
          fullWidth
          required
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeInput
          labelName="Contact Email"
          fullWidth
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeInput
          labelName="Estimated Value"
          type="number"
          fullWidth
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box mb={2}>
          <ThemeSelect label="Source" options={SOURCE_OPTIONS} value={source} onChange={(_, v) => setSource(v as OptionType | null)} />
        </Box>

        <Box mb={2}>
          <ThemeSelect
            label="Assigned To"
            options={staffOptions}
            value={assignedTo}
            onChange={(_, v) => setAssignedTo(v as OptionType | null)}
            disabled={staffLoading}
          />
          {!staffLoading && staffOptions.length === 0 && (
            <Typography fontSize={12} color="text.secondary" mt={0.5}>
              No Sales Staff found -- opportunity will be left unassigned.
            </Typography>
          )}
        </Box>

        <ThemeInput
          labelName="Follow-Up Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeInput
          labelName="Notes"
          fullWidth
          multiline
          minRows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || opportunityLoading}
          sx={{
            background: "#12B76A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#079455" },
          }}
        >
          {isSubmitting || opportunityLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating Opportunity...
            </Box>
          ) : (
            "Create Opportunity"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddOpportunityDialog
