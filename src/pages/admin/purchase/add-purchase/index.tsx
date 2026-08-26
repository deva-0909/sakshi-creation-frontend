import React, { useEffect, useState } from 'react';
import { Box, Stack, Button } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeSelect from '@/component/common_component/themeselect';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllMaterialsThunk } from '@/store/slices/materialSlice';
import { getCompaniesThunk, getRolesThunk, getStaffByRoleThunk, createPurchaseThunk, getPurchaseByIdThunk, updatePurchaseThunk } from '@/store/slices/purchaseSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import { getPartiesByCompanyThunk } from '@/store/slices/partySlice';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';

interface NewPurchaseProps {
  isEditMode?: boolean;
  purchaseId?: string;
}

interface Option {
  value: string;
  label: string;
}

const NewPurchase: React.FC<NewPurchaseProps> = ({ isEditMode = false, purchaseId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { materials } = useAppSelector(state => state.materials);
  const { companies, roles, staff, singlePurchase, loading, error } = useAppSelector(state => state.purchase);
  const { vendors } = useAppSelector(state => state.vendors);
  const { parties } = useAppSelector(state => state.party);

  const [formData, setFormData] = useState({
    vendorName: '',
    billNumber: '',
    material: '', // This will store the material _id
    materialName: '',
    materialGSM: '',
    materialSize: '',
    quantity: '',
    ratePerSheet: '',
    kg: '',
    companyName: '',
    for: '',
    forCompany: '',
    // Full Figma slide scan Phase 4 (Theme 7): optional, only meaningful
    // (and only shown) once "Factory" is picked as Deliver To -- see
    // isFactoryRole below.
    dyePunchNumber: '',
    party: '',
    ply: '',
    sheetSize: '',
    boxSize: ''
  });
  const [vendorOptions, setVendorOptions] = useState<Option[]>([]);

  // Options for material fields
  const materialNameOptions = Array.from(new Set(materials.map(material => material.materialName))).map(name => ({
    value: name,
    label: name
  }));

  const getMaterialGSMOptions = () => {
    const filteredMaterials = materials.filter(material => !formData.materialName || material.materialName === formData.materialName);
    return Array.from(new Set(filteredMaterials.map(material => material.materialGSM.toString()))).map(gsm => ({
      value: gsm,
      label: `${gsm} GSM`
    }));
  };

  const getMaterialSizeOptions = () => {
    const filteredMaterials = materials.filter(
      material =>
        (!formData.materialName || material.materialName === formData.materialName) &&
        (!formData.materialGSM || material.materialGSM.toString() === formData.materialGSM)
    );
    return Array.from(new Set(filteredMaterials.map(material => material.materialSize))).map(size => ({
      value: size,
      label: size
    }));
  };

  const companyOptions = companies.map(company => ({
    value: company._id,
    label: company.companyName
  }));

  // Phase 4 (two-company polish, claude/two-company-gap-analysis.md): this
  // "DELIVER TO" dropdown is really a Role picker (see forCompany, the Staff
  // picker below it) -- it was hardcoded to Sakshi Creation's three roles
  // regardless of which company was selected, so Quality Packaging purchases
  // could never be routed to Factory/Godown. Mirrors the backend's
  // stageOrderForCompany() (jobCard.controller.js): Quality Packaging's list
  // uses the exact same stage-name strings as its job-card pipeline
  // (QUALITY_PACKAGING_STAGE_ORDER) so a role created for job-card staff
  // assignment (RoleStaffSelect roleFilter={stage}) also works here.
  // Sakshi Creation's list is left untouched, including its pre-existing
  // "Booklet & Folder Binder" naming (used elsewhere across the legacy order
  // flow -- all-orders, role setup) which differs from the job-card system's
  // "Booklet Binder"; that inconsistency predates this fix and is out of
  // scope for it.
  const selectedCompanyName = companies.find(company => company._id === formData.companyName)?.companyName;
  const allowedRoleNames =
    selectedCompanyName === 'Quality Packaging'
      ? ['Printer', 'Binder', 'Booklet Binder', 'Factory', 'Godown']
      : ['Booklet & Folder Binder', 'Printer', 'Binder'];
  const roleOptions = roles
    .filter(role => allowedRoleNames.includes(role.roleName))
    .map(role => ({
      value: role._id,
      label: role.roleName
    }));

  const staffOptions = staff.map(staffMember => ({
    value: staffMember._id,
    label: `${staffMember.firstName} ${staffMember.lastName}`
  }));

  // Full Figma slide scan Phase 4 (Theme 7): the optional Dye/Punch Details
  // section below only makes sense for a Factory-category purchase --
  // mirrors the backend's categoryForRole("Factory") -> "factory" mapping.
  const isFactoryRole = roles.find(role => role._id === formData.for)?.roleName === 'Factory';

  const partyOptions = parties.map(p => ({
    value: p._id,
    label: p.partyName
  }));

  useEffect(() => {
    dispatch(getAllMaterialsThunk());
    dispatch(getCompaniesThunk());
    dispatch(getRolesThunk());
    dispatch(getAllVendorsThunk());
    if (isEditMode && purchaseId) {
      dispatch(getPurchaseByIdThunk(purchaseId));
    }
  }, [dispatch, isEditMode, purchaseId]);

  useEffect(() => {
    if (formData.companyName) {
      dispatch(getPartiesByCompanyThunk(formData.companyName));
    }
  }, [formData.companyName, dispatch]);

  // Mobile/toggle/seed audit (2026-08-26), Phase D: the initial mount
  // effect above fetches materials/vendors unscoped (tri-state -- fine for
  // an initial paint before a company is picked); once the form's own
  // Company field is set, re-fetch scoped to it so the Material/Vendor
  // pickers don't offer the other company's items alongside shared ones.
  useEffect(() => {
    if (formData.companyName) {
      dispatch(getAllMaterialsThunk({ companyName: formData.companyName }));
      dispatch(getAllVendorsThunk({ companyName: formData.companyName }));
    }
  }, [formData.companyName, dispatch]);

  useEffect(() => {
    if (vendors.length > 0) {
      const options = vendors.map(vendor => ({
        value: vendor._id,
        label: vendor.name
      }));
      setVendorOptions(options);
    }
  }, [vendors]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch({ type: 'purchases/clearError' });
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isEditMode && singlePurchase) {
      const material = materials.find(m => m._id === singlePurchase.material?._id);
      setFormData({
        vendorName: (typeof singlePurchase.vendorName === 'object' ? singlePurchase.vendorName?._id : singlePurchase.vendorName) || '',
        billNumber: singlePurchase.billNumber || '',
        material: singlePurchase.material?._id || '',
        materialName: material?.materialName || '',
        materialGSM: material?.materialGSM.toString() || '',
        materialSize: material?.materialSize || '',
        quantity: singlePurchase.quantity.toString() || '',
        ratePerSheet: singlePurchase.ratePerSheet.toString() || '',
        kg: singlePurchase.kg.toString() || '',
        companyName: singlePurchase.companyName?._id || '',
        for: singlePurchase.for?._id || '',
        forCompany: singlePurchase.forCompany?._id || '',
        // Editing an existing purchase doesn't round-trip these back from
        // the API (getPurchaseById's SELECT doesn't carry them) -- left
        // blank rather than guessed.
        dyePunchNumber: '',
        party: '',
        ply: '',
        sheetSize: '',
        boxSize: ''
      });

      if (singlePurchase.for?._id) {
        dispatch(getStaffByRoleThunk(singlePurchase.for._id));
      }
    }
  }, [isEditMode, singlePurchase, materials, dispatch]);

  useEffect(() => {
    if (formData.for) {
      dispatch(getStaffByRoleThunk(formData.for));
    } else {
      dispatch({ type: 'purchases/clearStaff' });
    }
  }, [formData.for, dispatch]);

  // Update material _id when materialName, materialGSM, and materialSize are selected
  useEffect(() => {
    if (formData.materialName && formData.materialGSM && formData.materialSize) {
      const selectedMaterial = materials.find(
        material =>
          material.materialName === formData.materialName &&
          material.materialGSM.toString() === formData.materialGSM &&
          material.materialSize === formData.materialSize
      );
      setFormData(prev => ({ ...prev, material: selectedMaterial?._id || '' }));
    } else {
      setFormData(prev => ({ ...prev, material: '' }));
    }
  }, [formData.materialName, formData.materialGSM, formData.materialSize, materials]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | number | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [name]: value != null ? String(value) : '',
      ...(name === 'materialName' ? { materialGSM: '', materialSize: '', material: '' } : {}),
      ...(name === 'materialGSM' ? { materialSize: '', material: '' } : {}),
      ...(name === 'companyName' && !isEditMode ? { for: '', forCompany: '' } : {})
    }));
    if (name === 'companyName' && !isEditMode) {
      dispatch({ type: 'purchases/clearStaff' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (
        !formData.vendorName ||
        !formData.billNumber ||
        !formData.material ||
        !formData.materialName ||
        !formData.materialGSM ||
        !formData.materialSize ||
        !formData.quantity ||
        !formData.ratePerSheet ||
        !formData.kg ||
        !formData.companyName ||
        !formData.for ||
        !formData.forCompany
      ) {
        toast.error('Please fill all required fields');
        return;
      }

      const purchaseData = {
        ...formData,
        quantity: Number(formData.quantity),
        ratePerSheet: Number(formData.ratePerSheet),
        kg: Number(formData.kg),
        // Only sent through when Factory is the Deliver-To role -- the
        // backend ignores these for every other category anyway (see
        // createInventoryForPurchase), but no point sending stale values
        // left over from switching away from Factory mid-form.
        ...(isFactoryRole
          ? { dyePunchNumber: formData.dyePunchNumber, party: formData.party, ply: formData.ply, sheetSize: formData.sheetSize, boxSize: formData.boxSize }
          : { dyePunchNumber: undefined, party: undefined, ply: undefined, sheetSize: undefined, boxSize: undefined })
      };

      const result = await Swal.fire({
        title: 'Are you sure?',
        text: isEditMode ? 'You are about to update this purchase record.' : 'You are about to create a new purchase record.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#A409F8',
        cancelButtonColor: '#d33',
        confirmButtonText: isEditMode ? 'Yes, update it!' : 'Yes, create it!'
      });

      if (result.isConfirmed) {
        if (isEditMode && purchaseId) {
          await dispatch(updatePurchaseThunk({ id: purchaseId, data: purchaseData })).unwrap();
          toast.success('Purchase updated successfully!');
          router.push('/admin/purchase');
        } else {
          await dispatch(createPurchaseThunk(purchaseData)).unwrap();
          toast.success('Purchase created successfully!');
          router.push('/admin/purchase');
        }
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} purchase`);
    }
  };

  const handleCancel = () => {
    router.push('/admin/purchase');
  };

  return (
    <Box>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="VENDOR NAME"
            options={vendorOptions}
            value={vendorOptions.find(opt => opt.value === formData.vendorName) || null}
            onChange={(e, newValue) => handleSelectChange('vendorName', newValue?.value)}
            required
          />
          <ThemeInput
            labelName="BILL NUMBER"
            name="billNumber"
            value={formData.billNumber}
            onChange={handleChange}
            fullWidth
            required
          />
        </Stack>
        
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="MATERIAL NAME"
            options={materialNameOptions}
            value={materialNameOptions.find(opt => opt.value === formData.materialName) || null}
            onChange={(e, newValue) => handleSelectChange('materialName', newValue?.value)}
            required
          />
          <ThemeSelect
            label="MATERIAL GSM"
            options={getMaterialGSMOptions()}
            value={getMaterialGSMOptions().find(opt => opt.value === formData.materialGSM) || null}
            onChange={(e, newValue) => handleSelectChange('materialGSM', newValue?.value)}
            required
            disabled={!formData.materialName}
          />
          <ThemeSelect
            label="MATERIAL SIZE"
            options={getMaterialSizeOptions()}
            value={getMaterialSizeOptions().find(opt => opt.value === formData.materialSize) || null}
            onChange={(e, newValue) => handleSelectChange('materialSize', newValue?.value)}
            required
            disabled={!formData.materialGSM}
          />
          <ThemeInput
            // Full Figma slide scan Phase 5 (Theme 9): read-only -- a
            // property of the selected material (per the user's decision),
            // not something entered per-purchase.
            labelName="TYPE"
            value={materials.find(m => m._id === formData.material)?.type || 'N/A'}
            fullWidth
            disabled
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="QUANTITY"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            fullWidth
            required
          />
          <ThemeInput
            labelName="RATE PER SHEET/UNIT"
            name="ratePerSheet"
            type="number"
            value={formData.ratePerSheet}
            onChange={handleChange}
            fullWidth
            required
          />
          <ThemeInput
            labelName="KG"
            name="kg"
            type="number"
            value={formData.kg}
            onChange={handleChange}
            fullWidth
            required
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          
        <ThemeSelect
          label="COMPANY NAME"
          options={companyOptions}
          value={companyOptions.find(opt => opt.value === formData.companyName) || null}
          onChange={(e, newValue) => handleSelectChange('companyName', newValue?.value)}
          required
          sx={{ mb: 3 }}
        />
        
        <ThemeSelect
          label="DELIVER TO"
          options={roleOptions}
          value={roleOptions.find(opt => opt.value === formData.for) || null}
          onChange={(e, newValue) => handleSelectChange('for', newValue?.value)}
          required
          sx={{ mb: 3 }}
          disabled={!formData.companyName}
        />
        
        <ThemeSelect
          // Full Figma slide scan Phase 5 (Theme 9): was hardcoded "PRINTER
          // NAME" regardless of which role was actually selected above --
          // wrong label on every Binder/Booklet Binder/Factory/Godown
          // purchase, not just cosmetically inconsistent with Figma's "For
          // company".
          label={roles.find(role => role._id === formData.for)?.roleName ? `${roles.find(role => role._id === formData.for)?.roleName?.toUpperCase()} NAME` : 'STAFF NAME'}
          options={staffOptions}
          value={staffOptions.find(opt => opt.value === formData.forCompany) || null}
          onChange={(e, newValue) => handleSelectChange('forCompany', newValue?.value)}
          required
          sx={{ mb: 3 }}
          disabled={!formData.for}
        />
        </Stack>

        {isFactoryRole && (
          <>
            <Stack direction="row" spacing={2} mb={2}>
              <ThemeInput
                labelName="DYE/PUNCH NUMBER (OPTIONAL)"
                name="dyePunchNumber"
                value={formData.dyePunchNumber}
                onChange={handleChange}
                fullWidth
              />
              <ThemeSelect
                label="PARTY (OPTIONAL)"
                options={partyOptions}
                value={partyOptions.find(opt => opt.value === formData.party) || null}
                onChange={(e, newValue) => handleSelectChange('party', newValue?.value)}
              />
            </Stack>
            <Stack direction="row" spacing={2} mb={2}>
              <ThemeInput
                labelName="PLY (OPTIONAL)"
                name="ply"
                value={formData.ply}
                onChange={handleChange}
                fullWidth
              />
              <ThemeInput
                labelName="SHEET SIZE (OPTIONAL)"
                name="sheetSize"
                value={formData.sheetSize}
                onChange={handleChange}
                fullWidth
              />
              <ThemeInput
                labelName="BOX SIZE (OPTIONAL)"
                name="boxSize"
                value={formData.boxSize}
                onChange={handleChange}
                fullWidth
              />
            </Stack>
          </>
        )}

        <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            sx={{
              background: '#A409F8',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              '&:hover': { background: '#7B06C2' },
            }}
          >
            {isEditMode ? 'Update Purchase' : 'Save Purchase'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default NewPurchase;