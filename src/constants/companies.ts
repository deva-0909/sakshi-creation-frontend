// QA-M6 (two-company audit, "worth tracking" finding): several files across
// the app compare `companyName` against the literal strings "Quality
// Packaging" / "Sakshi Creation" to drive genuinely different business logic
// per company (different role whitelists, different job-card pipelines,
// different status vocabularies -- see each call site's own comments for the
// specific rationale). Those branches are deliberate, confirmed business-model
// splits and are NOT being touched here. This file only centralizes the
// literal strings themselves into one place, so a future rename of either
// company (or the addition of a third company) is a one-place edit instead of
// a scattered find-and-replace across the codebase. Pure refactor, zero
// behavior change.
export const QUALITY_PACKAGING_NAME = "Quality Packaging";
export const SAKSHI_CREATION_NAME = "Sakshi Creation";
