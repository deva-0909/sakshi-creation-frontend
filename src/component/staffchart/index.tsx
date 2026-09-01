import React, { useEffect, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useAppDispatch, useAppSelector } from '@/store'
import { getAllCompanyNamesThunk } from '@/store/slices/companyNameSlice'
import { getAllOrdersThunk } from '@/store/slices/orderSlice'
import { getAllAccountMastersThunk } from '@/store/slices/accountMasterSlice'
import { getAllLeadsThunk } from '@/store/slices/leadSlice'

// Mobile/toggle/seed audit (2026-08-26), Phase G: this component previously
// rendered two hardcoded stat sets (statsData / statsData2) that never
// changed no matter what was in the database, plus a mini "bar chart" of 5
// literally-invented numbers ([80, 60, 100, 70, 90]) with no relationship
// to the stats above them. Rebuilt from real data, scoped per company by
// tab index into the real company list (companyNames[tab]), matching the
// parent Reports > Staff / Setup > Staff pages' own tabs -- not a
// hardcoded two-company array, so a third company's tab keeps working.
//
// Metric mapping decisions (no dedicated "dashboard stats" endpoint exists,
// so this derives each figure from the same list endpoints other pages
// already use):
// - "No of orders" / "Amount of Business" = count and totalAmount sum of
//   that company's orders (getAllOrdersThunk).
// - "New party Added" = count of that company's parties/account masters
//   (getAllAccountMastersThunk) -- parties actually added to the system.
// - "New customers" = count of *distinct* parties who have placed at
//   least one order for that company -- deliberately a different figure
//   from "New party Added" (a party can be added without ever ordering).
// - "New Visit" = count of that company's Party Call leads
//   (getAllLeadsThunk) -- the closest existing concept to a sales visit.
// The single bar under each number is proportional to that stat's own
// share of the largest of the four count-based stats (Amount of Business
// is a different unit and is excluded from that scale).

const STAT_META = [
  { key: 'newVisit', label: 'New Visit', color: '#8B5CF6' },
  { key: 'newCustomers', label: 'New customers', color: '#22C55E' },
  { key: 'newParty', label: 'New party Added', color: '#F59E42' },
  { key: 'orders', label: 'No of orders', color: '#F43F5E' },
  { key: 'amount', label: 'Amount of Business', color: '#FACC15' },
] as const;

// Accept tab as prop
const StaffChart = ({ tab = 0 }: { tab?: number }) => {
  const dispatch = useAppDispatch();
  const { companyNames } = useAppSelector((state) => state.companyNames);
  const { orders } = useAppSelector((state) => state.orders);
  const { accountMasters } = useAppSelector((state) => state.accountMasters);
  const { leads } = useAppSelector((state) => state.leads);

  const companyId = useMemo(
    () => companyNames[tab]?._id,
    [companyNames, tab]
  );

  useEffect(() => {
    dispatch(getAllCompanyNamesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (!companyId) return;
    dispatch(getAllOrdersThunk({ limit: 1000, companyName: companyId }));
    dispatch(getAllAccountMastersThunk({ companyName: companyId }));
    dispatch(getAllLeadsThunk({ companyName: companyId }));
  }, [dispatch, companyId]);

  const distinctCustomerCount = new Set(
    orders.map((o) => o.party?._id).filter(Boolean)
  ).size;
  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const values: Record<(typeof STAT_META)[number]['key'], number> = {
    newVisit: leads.length,
    newCustomers: distinctCustomerCount,
    newParty: accountMasters.length,
    orders: orders.length,
    amount: totalAmount,
  };

  const maxCountStat = Math.max(values.newVisit, values.newCustomers, values.newParty, values.orders, 1);

  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={2} flexWrap="wrap" gap={2}>
      {STAT_META.map((stat) => {
        const value = values[stat.key];
        const barHeightPx = stat.key === 'amount' ? 120 : Math.max(8, Math.round((value / maxCountStat) * 120));
        return (
          <Box key={stat.key} flex={1} minWidth={120} textAlign="center">
            <Typography fontWeight={600} fontSize={22} mb={0.5}>
              {stat.key === 'amount' ? `₹${value.toLocaleString()}` : value}
            </Typography>
            <Typography fontSize={13} color="#667085" mb={1}>
              {stat.label}
            </Typography>
            {/* Bar Chart -- height proportional to this stat's own value */}
            <Box
              sx={{
                height: 120,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: `${barHeightPx}px`,
                  background: stat.color,
                  borderRadius: 2,
                }}
              />
            </Box>
            {/* Legend */}
            <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={1}>
              <Box width={16} height={4} bgcolor={stat.color} borderRadius={2} />
              <Typography fontSize={12} color="#667085">{stat.label}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  )
}

export default StaffChart
