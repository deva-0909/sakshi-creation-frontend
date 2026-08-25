import React, { useEffect } from "react";
import { Box, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllCompanyNamesThunk } from "@/store/slices/companyNameSlice";
import { setActiveCompanyId } from "@/store/slices/activeCompanySlice";

// Two-company support (see claude/two-company-gap-analysis.md, Phase 0):
// global pill toggle between whatever companies exist in company_names
// (today: Sakshi Creation, and Quality Packaging once added), mirroring
// the toggle on the reference design (sakshicreation.in / the Figma
// file). Rendered once in src/component/Dashboard/index.tsx's shared
// header, so it appears on every admin page without each page wiring it
// up individually. Selection lives in the activeCompany slice
// (Redux + localStorage) -- see that slice for why it isn't in the
// redux-persist whitelist.
const CompanyToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companyNames, loading } = useAppSelector((state) => state.companyNames);
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    if (companyNames.length === 0 && !loading) {
      dispatch(getAllCompanyNamesThunk());
    }
  }, [companyNames.length, loading, dispatch]);

  useEffect(() => {
    // Sakshi Creation order-process audit (2026-08-25): this used to
    // auto-select companyNames[0] the moment >=2 companies existed, with no
    // "all companies" option at all -- so activeCompanyId was functionally
    // never unset once the app loaded, and every company-scoped list page
    // (Invoices, All Orders, Purchase, Account Master) always showed
    // exactly one company's data, silently, with no way to see both at
    // once. Now it defaults to "" (all companies) rather than the first
    // company on a genuinely first-ever visit (activeCompanyId === null,
    // i.e. nothing was ever stored) or when a previously-selected id no
    // longer exists (e.g. it was deleted). "" is a deliberate, stored,
    // explicit "All" choice -- distinct from null/"never chosen" -- and is
    // falsy, so `activeCompanyId || undefined` on every list page already
    // reads it as "no company filter" with no changes needed there.
    if (companyNames.length > 0) {
      if (activeCompanyId === null) {
        dispatch(setActiveCompanyId(""));
        return;
      }
      const stillValid = activeCompanyId === "" || companyNames.some((c) => c._id === activeCompanyId);
      if (!stillValid) {
        dispatch(setActiveCompanyId(""));
      }
    }
  }, [companyNames, activeCompanyId, dispatch]);

  if (companyNames.length < 2) {
    // Only one company exists (today's default) -- nothing to toggle
    // between, so stay invisible rather than show a single-option control.
    return null;
  }

  return (
    <Box
      display="inline-flex"
      sx={{
        border: "1px solid #a259f7",
        borderRadius: 999,
        p: 0.5,
        gap: 0.5,
        bgcolor: "#fff",
      }}
    >
      {(() => {
        const allActive = !activeCompanyId;
        return (
          <Button
            key="all"
            size="small"
            onClick={() => dispatch(setActiveCompanyId(""))}
            sx={{
              borderRadius: 999,
              px: 2,
              minWidth: 0,
              textTransform: "uppercase",
              fontWeight: 700,
              fontSize: 12,
              bgcolor: allActive ? "#a259f7" : "transparent",
              color: allActive ? "#fff" : "#a259f7",
              "&:hover": {
                bgcolor: allActive ? "#8e3ce0" : "rgba(162,89,247,0.08)",
              },
            }}
          >
            All
          </Button>
        );
      })()}
      {companyNames.map((company) => {
        const active = company._id === activeCompanyId;
        return (
          <Button
            key={company._id}
            size="small"
            onClick={() => dispatch(setActiveCompanyId(company._id))}
            sx={{
              borderRadius: 999,
              px: 2,
              minWidth: 0,
              textTransform: "uppercase",
              fontWeight: 700,
              fontSize: 12,
              bgcolor: active ? "#a259f7" : "transparent",
              color: active ? "#fff" : "#a259f7",
              "&:hover": {
                bgcolor: active ? "#8e3ce0" : "rgba(162,89,247,0.08)",
              },
            }}
          >
            {company.companyName}
          </Button>
        );
      })}
    </Box>
  );
};

export default CompanyToggle;
