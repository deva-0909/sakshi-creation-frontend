export const permissionsArray = {
  account_master: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  assign_task: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  party_call: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  all_orders: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  quality_packaging: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  proforma_invoice: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  reports: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  inventory: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  purchase: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  task: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  history: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  designer_task: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  printer_task: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  blinder_task: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  booklet_blinder_task: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  setup: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  // Deep-audit fix: authorizePermission() gates several setup sub-screens on
  // these compound dotted keys (routes/role.routes.js, staff.routes.js,
  // material.routes.js, productItem.routes.js, companyName.routes.js,
  // roleDepartment(Company).routes.js) but the role-editor UI only ever
  // offered the bare `setup` key -- meaning role/staff/material/product/
  // company-name delete-and-friends could never be granted through the UI
  // at all, only by direct DB edit. Added with the same shape as `setup`
  // (no `approve`, matching the actions these routes actually check).
  "setup.role": {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  "setup.staff": {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  "setup.company-name": {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  "setup.paper-material": {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  "setup.products": {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  machine: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  // Two-company Phase 2 Part A: Quality Packaging's die-cutting tooling
  // register (claude/two-company-gap-analysis.md). Backend already grants
  // this key to Admin directly in Supabase; other roles get it via this UI.
  dye_punch: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  // Full Figma slide scan Phase 8 (Theme 7): Godown's box/cartoon receiving
  // manifest, surfaced as an Inventory > Godown tab (same pattern as
  // dye_punch above). Backend already grants this key to Admin directly in
  // Supabase; other roles get it here.
  godown_box_receipt: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  // Two-company Phase 3 Part A: Complaints module ("All Complains" nav item
  // from the Figma reference's Quality Packaging dashboard). Backend already
  // grants this key to Admin directly in Supabase; other roles get it here.
  complaint: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  rfq: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  purchaseorder: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    // Multi-role audit fix (Finding 3): backend gates
    // PATCH /:id/approve and /:id/reject on authorizePermission("purchaseorder",
    // "approve") (routes/purchaseOrder.routes.js) but this key was missing here,
    // so PO approval rights could only ever be granted via direct DB edit.
    approve: false,
  },
  grn: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  invoice: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  receipt: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  vendorpayment: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  costing: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  opportunity: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  // Multi-role audit fix (Finding 2): the backend has enforced permissions on
  // "quotation", "bom", and "jobcard" since Modules 8/9 (routes/quotation.routes.js,
  // routes/bom.routes.js, routes/jobCard.routes.js) but none of the three ever
  // had a template entry here, so an admin could not grant or revoke them
  // through the Roles & Permissions UI at all -- only by direct DB edit
  // (confirmed while seeding the multi-role audit's Sales/Production accounts).
  quotation: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    // Backend gates PATCH /:id/approve and /:id/reject on
    // authorizePermission("quotation", "approve").
    approve: false,
  },
  bom: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  jobcard: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
  },
  rework: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  // Module 9: credit/debit notes get an `approve` key from the start (used
  // for the Issue action, which applies the note) -- the gap Module 8 found
  // (quotation/purchaseorder/invoice checking permissions?.approve in their
  // UI with no approve key here) was fixed for `rework` and is deliberately
  // not repeated here.
  creditnote: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  debitnote: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  // Module 10: configuration masters -- each new module key includes `approve`
  // from the start per the same anti-gap pattern used for Module 9's notes.
  uom: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  taxrate: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  branch: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  designation: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  routing: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  appsettings: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  numberingconfig: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  // Module 11 Part A: Warehouse + Inventory Depth.
  warehouse: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  stocktransfer: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  stockadjustment: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  stockreservation: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  // Module 11 Part B: Vendor Management + Procurement Depth.
  purchaserequisition: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  purchasereturn: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
  // Module 12: Delivery Management (multi-challan, POD). No approval gate in
  // this module's design; `approve` kept for template consistency with other entries.
  deliverychallan: {
    view_global: false,
    view_own: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  },
}