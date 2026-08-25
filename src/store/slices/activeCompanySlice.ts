import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Two-company support (see claude/two-company-gap-analysis.md, Phase 0):
// the globally-selected company (Sakshi Creation / Quality Packaging /
// whatever exists in company_names) that CompanyToggle writes to and every
// company-scoped list screen reads from. Kept outside redux-persist's
// whitelist (see src/store/index.ts, which persists only `auth`) and
// instead mirrored to localStorage directly here, the same pattern
// src/services/auth.service.ts already uses for the auth token -- so the
// selection survives a page reload without widening the persist config.
const STORAGE_KEY = "activeCompanyId";

interface ActiveCompanyState {
  activeCompanyId: string | null;
}

function readInitialCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled -- fall back to no selection;
    // CompanyToggle defaults to the first company in that case.
    return null;
  }
}

const initialState: ActiveCompanyState = {
  activeCompanyId: readInitialCompanyId(),
};

const activeCompanySlice = createSlice({
  name: "activeCompany",
  initialState,
  reducers: {
    setActiveCompanyId(state, action: PayloadAction<string>) {
      state.activeCompanyId = action.payload;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, action.payload);
        } catch {
          // Ignore write failures -- selection just won't survive reload.
        }
      }
    },
  },
});

export const { setActiveCompanyId } = activeCompanySlice.actions;
export default activeCompanySlice.reducer;
