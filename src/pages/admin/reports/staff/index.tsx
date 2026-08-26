import React, { useEffect, useState } from 'react';
import { Box, Paper, Tabs, Tab, TableCell, Button } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import StaffChart from '@/component/staffchart';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllStaffThunk } from '@/store/slices/staffSlice';

// Mobile/toggle/seed audit (2026-08-26), Phase G: this page previously
// rendered 6 hardcoded mock rows (Staff 1-3 / Staff A-C) split across the
// two tabs regardless of what staff actually existed. Rebuilt from the
// real staff list (the same getAllStaffThunk the Setup > Staff page uses),
// split per-tab by each staff member's company.
//
// Column mapping decisions:
// - "Department" has no dedicated field on staff -- role.roleName is the
//   closest available grouping (Setup > Staff itself labels this same
//   field "Role", not "Department"; kept here as "Department" to match
//   this report's existing column header).
// - "Date of left" has no corresponding field anywhere in the staff
//   schema (no offboarding date is tracked) -- shown as "-" for every row
//   rather than inventing one. Flagged in the remediation plan as a real
//   product gap, not a wiring gap.
//
// "Add Staff" and row-click now navigate to the real staff form at
// /admin/setup/staff/view (createStaffThunk/updateStaffThunk, real
// role/branch/designation pickers) instead of this page's own dead
// mock add/edit form (reports/staff/view/index.tsx posted to a
// nonexistent `${BASE_URL}/staff` endpoint with no auth header and no
// company/role fields at all -- it never worked). See mobile-toggle-seed-
// audit.md Phase G for the reasoning.

const tabLabels = ['Sakshi Creation', 'Quality Packaging'];

const columns = [
  { id: 'name', label: 'Staff' },
  { id: 'department', label: 'Department' },
  { id: 'joining', label: 'Date of Joining' },
  { id: 'left', label: 'Date of left' },
];

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-');

const StaffPage = () => {
  const [tab, setTab] = useState(0);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { staffList, loading } = useAppSelector((state) => state.staff);

  useEffect(() => {
    dispatch(getAllStaffThunk());
  }, [dispatch]);

  const companyOf = (s: (typeof staffList)[number]) =>
    typeof s.companyName === 'string' ? s.companyName : s.companyName?.companyName;

  const rows = staffList
    .filter((s) => companyOf(s) === tabLabels[tab])
    .map((s) => ({
      id: s.id,
      name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'N/A',
      department: s.role?.roleName || 'N/A',
      joining: formatDate(s.joiningDate),
      left: '-',
    }));

  const csvColumns = [
    { id: 'name', label: 'Staff', value: (row: (typeof rows)[number]) => row.name },
    { id: 'department', label: 'Department', value: (row: (typeof rows)[number]) => row.department },
    { id: 'joining', label: 'Date of Joining', value: (row: (typeof rows)[number]) => row.joining },
    { id: 'left', label: 'Date of left', value: (row: (typeof rows)[number]) => row.left },
  ];

  return (
      <Box sx={{ p: 2 }}>
        {/* Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '12px',
              border: '2px solid #7F56D9',
              backgroundColor: '#fff',
              p: '2px',
              overflow: 'hidden',
            }}
          >
            {/* Sliding background for selected tab */}
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                left: tab === 0 ? 2 : '50%',
                width: '50%',
                height: 'calc(100% - 4px)',
                backgroundColor: '#7F56D9',
                borderRadius: '10px',
                zIndex: 0,
                transition: 'left 0.3s ease',
              }}
            />
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              TabIndicatorProps={{ style: { display: 'none' } }}
              sx={{
                minHeight: 0,
                zIndex: 1,
                '& .MuiTabs-flexContainer': {
                  gap: 0,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minHeight: 0,
                  px: 1.8,
                  py: 0.8,
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: '10px',
                  color: '#7F56D9',
                  transition: 'color 0.3s ease',
                  zIndex: 1,
                },
                '& .MuiTab-root.Mui-selected': {
                  color: '#fff',
                  backgroundColor: 'transparent',
                  zIndex: 2,
                },
              }}
            >
              {tabLabels.map((label) => (
                <Tab key={label} label={label} disableRipple />
              ))}
            </Tabs>
          </Box>
        </Box>
        {/* Add Staff Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/admin/setup/staff/view?mode=add')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Add Staff
          </Button>
        </Box>
        {/* Stats & Bar Chart */}
        <StaffChart tab={tab} />
        {/* Staff Table */}
        <Paper sx={{ mt: 4, borderRadius: 2, overflow: 'hidden' }}>
          <BasicTable
            tableHeader={columns}
            rowData={rows}
            csvColumns={csvColumns}
            exportFilename="staff"
            renderRow={(row) => (
              <>
                <TableCell
                  sx={{ fontWeight: 500, cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/setup/staff/view?mode=edit&id=${row.id}`)}
                >
                  {row.name}
                </TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.joining}</TableCell>
                <TableCell>{row.left}</TableCell>
              </>
            )}
          />
        </Paper>
      </Box>
  );
};

export default StaffPage;
