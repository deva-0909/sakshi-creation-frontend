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
    // Default to the first company once the list loads if nothing valid
    // is selected yet -- first-ever visit, or a stored id that no longer
    // exists (e.g. it was deleted).
    if (companyNames.length > 0) {
      const stillValid = companyNames.some((c) => c._id === activeCompanyId);
      if (!activeCompanyId || !stillValid) {
        dispatch(setActiveCompanyId(companyNames[0]._id));
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
