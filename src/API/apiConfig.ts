const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
const Endpoint = {
  LOGIN: `${BaseURL}/api/staff/login`,
  CREATE_STAFF: `${BaseURL}/api/staff/create`,
  GET_ALL_STAFF: `${BaseURL}/api/staff/getall`,
  // Tier 1 security audit fix (2026-09-01), Fix 3: id+name-only listing for
  // picker/dropdown use, so those call sites don't need setup.staff view
  // permission the way GET_ALL_STAFF now requires.
  GET_STAFF_LIST_LITE: `${BaseURL}/api/staff/list-lite`,
  GET_STAFF_BY_ID: `${BaseURL}/api/staff/getbyid`,
  UPDATE_STAFF: `${BaseURL}/api/staff/update`,
  UPDATE_STAFF_STATUS: `${BaseURL}/api/staff/updatestatus`,
  DELETE_STAFF: `${BaseURL}/api/staff/delete`,
  BULK_CREATE_STAFF:`${BaseURL}/api/staff/bulk`,
  BULK_STAFF_TEMPLATE: `${BaseURL}/api/staff/bulk/template`,
  UPDATE_STAFF_PASSWORD: `${BaseURL}/api/staff/updatepassword`,
  GET_ALL_ACCOUNT_MASTERS: `${BaseURL}/api/account-master/getall`,
  BULK_CREATE_ACCOUNT_MASTERS: `${BaseURL}/api/account-master/bulk-create`,
  BULK_ACCOUNT_MASTER_TEMPLATE: `${BaseURL}/api/account-master/bulk-create/template`,
  GET_ACCOUNT_MASTER_BY_ID: `${BaseURL}/api/account-master/getbyid`,
  GET_ACCOUNT_MASTER_BY_STAFF_ID: `${BaseURL}/api/account-master/getbystaffid`,
  CREATE_ACCOUNT_MASTER: `${BaseURL}/api/account-master/create`,
  UPDATE_ACCOUNT_MASTER: `${BaseURL}/api/account-master/update`,
  DELETE_ACCOUNT_MASTER: `${BaseURL}/api/account-master/delete`,
  UPDATE_APPROVED_ACCOUNT_MASTER: `${BaseURL}/api/account-master/party`,
  SEARCH_PARTIES:`${BaseURL}/api/account-master/parties/search`,
  GET_USER_PROFILE: `${BaseURL}/api/staff/getbyid`,
  GET_ALL_ASSIGN_TASKS: `${BaseURL}/api/assign-task/getall`,
  GET_ASSIGN_TASK_BY_ID: `${BaseURL}/api/assign-task/getbyid`,
  GET_ASSIGN_TASK_BY_STAFF_ID: `${BaseURL}/api/assign-task/getbystaffid`,
  CREATE_ASSIGN_TASK: `${BaseURL}/api/assign-task/create`,
  UPDATE_ASSIGN_TASK: `${BaseURL}/api/assign-task/update`,
  DELETE_ASSIGN_TASK: `${BaseURL}/api/assign-task/delete`,
  GET_ALL_LEADS: `${BaseURL}/api/lead/getall`,
  GET_LEAD_BY_ID: `${BaseURL}/api/lead/getbyid`,
  GET_LEAD_BY_STAFF_ID: `${BaseURL}/api/lead/getbystaffid`,
  CREATE_LEAD: `${BaseURL}/api/lead/create`,
  UPDATE_LEAD: `${BaseURL}/api/lead/update`,
  DELETE_LEAD: `${BaseURL}/api/lead/delete`,
  GET_PARTY_NAMES_BY_COMPANY: `${BaseURL}/api/lead/party-names`,

  // purchase
  GET_ALL_PURCHASES: `${BaseURL}/api/purchase/getall`,
  CREATE_PURCHASE: `${BaseURL}/api/purchase/create`,
  UPDATE_PURCHASE: `${BaseURL}/api/purchase/update`,
  DELETE_PURCHASE: `${BaseURL}/api/purchase/delete`,
  GET_PURCHASE_BY_ID: `${BaseURL}/api/purchase/getbyid`,
  GET_PURCHASES_BY_MATERIAL: `${BaseURL}/api/purchase/getbymaterial`,
  GET_PURCHASES_BY_COMPANY: `${BaseURL}/api/purchase/getbycompany`,
  GET_PURCHASES_BY_DATE_RANGE: `${BaseURL}/api/purchase/getbydaterange`,
  GET_STAFF_BY__ROLE_ID: `${BaseURL}/api/purchase/getstaffbyrole`,
  BULK_CREATE_PURCHASES: `${BaseURL}/api/purchase/bulk`,
  BULK_PURCHASE_TEMPLATE: `${BaseURL}/api/purchase/bulk/template`,

  //Inventory

  GET_BY_CATEGORY : `${BaseURL}/api/inventory/bycategory`,
  GET_CATEGORY : `${BaseURL}/api/inventory/summary`,
  GET_BY_COMPANY : `${BaseURL}/api/purchase/getbycompany`,

  //staff
  GET_ROLE: `${BaseURL}/api/staff/getrol`,

  //accountmaster
  BY_COMPNAY_PARTY: `${BaseURL}/api/account-master/by-company-party`,

  //compnay
  GET_ALL_COMPANY: `${BaseURL}/api/company/getall`,

  //party
  GET_PARTIES_BY_COMPANY: `${BaseURL}/api/company/get-party-with-company-id`,

  //productitem
  CREATE_PRODUCT_ITEM: `${BaseURL}/api/productItem/create`,
  DELETE_PRODUCT_ITEM: `${BaseURL}/api/productItem/delete`,
  GET_ALL_PRODUCT_ITEM: `${BaseURL}/api/productItem/getall`,
  GET_PRODUCT_ITEM_WITH_ID: `${BaseURL}/api/productItem/update`,
  UPDATE_PRODUCT_ITEM: `${BaseURL}/api/productItem/update`,
  BULK_CREATE_PRODUCT_ITEMS: `${BaseURL}/api/productItem/bulk`,
  BULK_PRODUCT_ITEM_TEMPLATE: `${BaseURL}/api/productItem/bulk/template`,


  //company name 
  
  CREATE_COMPANY_NAME:  `${BaseURL}/api/company/create`,
  GET_ALL_COMPANY_NAME:   `${BaseURL}/api/company/getallCompany`,
  GET_COMPANY_NAME_WITH_ID:   `${BaseURL}/api/company/getbyid`,
  UPDATE_COMPANY_NAME:  `${BaseURL}/api/company/update`,
  DELETE_COMPANY_NAME:  `${BaseURL}/api/company/delete`,


  //fileupload
  UPLOAD_SINGLE_FILE: `${BaseURL}/api/fileUpload/single`,
  UPLOAD_MULTIPLE_FILES: `${BaseURL}/api/fileUpload/multiple`,
  DELETE_FILE: `${BaseURL}/api/fileUpload`,
  GET_FILE_INFO: `${BaseURL}/api/fileUpload/info`,

  // Order endpoints
  CREATE_ORDER: `${BaseURL}/api/orders/create`,
  // Order Form batch create (Godown Manager Figma audit, Patch 108): one
  // "Order Form" (e.g. "QP-001") groups N order rows entered together via
  // the multi-row inline form.
  CREATE_ORDER_FORM: `${BaseURL}/api/orders/create-form`,
  GET_ALL_ORDERS: `${BaseURL}/api/orders/all`,
  GET_ORDER_BY_ID: `${BaseURL}/api/orders`,
  UPDATE_ORDER: `${BaseURL}/api/orders/update`,
  DELETE_ORDER: `${BaseURL}/api/orders/delete`,
  GET_ORDERS_BY_COMPANY_PARTY: `${BaseURL}/api/orders`,
  GET_DESIGNER_ORDERS: `${BaseURL}/api/orders/designe`,
  GET_PRINTER_ORDERS: `${BaseURL}/api/orders/printer`,
  GET_PRINTER_BINDER: `${BaseURL}/api/orders/binder`,
  GET_BOOKLET_BINDER: `${BaseURL}/api/orders/bookletBinder`,
  GET_ORDER_BY_STAFF_ID: `${BaseURL}/api/orders/getbystaffid`,

  //performance invoice
  GET_ALL_PERFORMANCE_INVOICES: `${BaseURL}/api/performance-invoice/getall`,
  GET_PERFORMANCE_INVOICE_BY_ID: `${BaseURL}/api/performance-invoice/getbyid`,
  CREATE_PERFORMANCE_INVOICE: `${BaseURL}/api/performance-invoice/create`,
  UPDATE_PERFORMANCE_INVOICE: `${BaseURL}/api/performance-invoice/update`,
  DELETE_PERFORMANCE_INVOICE: `${BaseURL}/api/performance-invoice/delete`,

  //status
  STATUS_BASE: `${BaseURL}/api/status`,

  // Role endpoints
  CREATE_ROLE: `${BaseURL}/api/role/create`,
  GET_ALL_ROLES: `${BaseURL}/api/role/getall`,
  // Tier 1 security audit fix (2026-09-01), Fix 3: id+roleName-only listing
  // for picker/dropdown use, so those call sites don't need setup.role view
  // permission (and never see the permissions JSON) the way GET_ALL_ROLES
  // now requires.
  GET_ROLES_LIST_LITE: `${BaseURL}/api/role/list-lite`,
  GET_ROLE_BY_ID: `${BaseURL}/api/role/getbyid`,
  UPDATE_ROLE: `${BaseURL}/api/role/updatebyid`,
  DELETE_ROLE: `${BaseURL}/api/role/delete`,

  // Material name routes
  CREATE_MATERIAL: `${BaseURL}/api/material/create`,
  GET_ALL_MATERIALS: `${BaseURL}/api/material/getall`,
  GET_MATERIAL_BY_ID: `${BaseURL}/api/material/getbyid`,
  UPDATE_MATERIAL: `${BaseURL}/api/material/update`,
  DELETE_MATERIAL: `${BaseURL}/api/material/delete`,
  BULK_CREATE_MATERIALS: `${BaseURL}/api/material/bulk`,
  BULK_MATERIAL_TEMPLATE: `${BaseURL}/api/material/bulk/template`,


    // New vendor endpoints
  GET_ALL_VENDORS: `${BaseURL}/api/vendor/getall`,
  GET_VENDOR_BY_ID: `${BaseURL}/api/vendor/getbyid`,
  CREATE_VENDOR: `${BaseURL}/api/vendor/create`,
  UPDATE_VENDOR: `${BaseURL}/api/vendor/update`,
  DELETE_VENDOR: `${BaseURL}/api/vendor/delete`,
  BULK_CREATE_VENDORS: `${BaseURL}/api/vendor/bulk`,
  BULK_VENDOR_TEMPLATE: `${BaseURL}/api/vendor/bulk/template`,
  GET_VENDOR_RATE_HISTORY: `${BaseURL}/api/vendor`,
  GET_VENDOR_PERFORMANCE: `${BaseURL}/api/vendor`,
  IMPORT_HISTORY: `${BaseURL}/api/import-history`,

  // ComapnyName
  COMPANY_NAME_GET_ALL: `${BaseURL}/api/company/getall`,

  // Role Department Company routes
  ROLE_DEPARTMENT_CREATE: `${BaseURL}/api/roleDepartment/create`,
  ROLE_DEPARTMENT_GET_ALL: `${BaseURL}/api/roleDepartment/getall`,
  ROLE_DEPARTMENT_GET_BY_ID: `${BaseURL}/api/roleDepartment/getbyid`,
  ROLE_DEPARTMENT_UPDATE: `${BaseURL}/api/roleDepartment/update`,
  ROLE_DEPARTMENT_DELETE: `${BaseURL}/api/roleDepartment/delete`,
  ROLE_DEPARTMENT_COMPANY_CREATE: `${BaseURL}/api/roleDepartmentCompany/create`,
  ROLE_DEPARTMENT_COMPANY_GET_ALL: `${BaseURL}/api/roleDepartmentCompany/getall`,
  ROLE_DEPARTMENT_COMPANY_GET_BY_ID: `${BaseURL}/api/roleDepartmentCompany/getbyid`,
  ROLE_DEPARTMENT_COMPANY_UPDATE: `${BaseURL}/api/roleDepartmentCompany/update`,
  ROLE_DEPARTMENT_COMPANY_DELETE: `${BaseURL}/api/roleDepartmentCompany/delete`,

  // Quotation endpoints (Patch 16 -- Quotation + BOM + Job Card)
  CREATE_QUOTATION: `${BaseURL}/api/quotations`,
  GET_ALL_QUOTATIONS: `${BaseURL}/api/quotations`,
  GET_QUOTATION_BY_ID: `${BaseURL}/api/quotations`,
  UPDATE_QUOTATION: `${BaseURL}/api/quotations`,
  DELETE_QUOTATION: `${BaseURL}/api/quotations`,
  SUBMIT_QUOTATION_FOR_APPROVAL: `${BaseURL}/api/quotations`,
  APPROVE_QUOTATION: `${BaseURL}/api/quotations`,
  REJECT_QUOTATION: `${BaseURL}/api/quotations`,
  SEND_QUOTATION: `${BaseURL}/api/quotations`,
  RESPOND_QUOTATION: `${BaseURL}/api/quotations`,
  CONVERT_QUOTATION: `${BaseURL}/api/quotations`,
  GET_QUOTATION_HISTORY: `${BaseURL}/api/quotations`,
  GET_QUOTATION_PDF: `${BaseURL}/api/quotations`,

  // BOM endpoints
  CREATE_BOM_LINE: `${BaseURL}/api/boms`,
  GET_BOM_FOR_PRODUCT: `${BaseURL}/api/boms/product`,
  UPDATE_BOM_LINE: `${BaseURL}/api/boms`,
  DELETE_BOM_LINE: `${BaseURL}/api/boms`,
  ESTIMATE_BOM_COST: `${BaseURL}/api/boms/product`,

  // Job Card endpoints
  CREATE_JOB_CARD: `${BaseURL}/api/job-cards/from-order`,
  GET_ALL_JOB_CARDS: `${BaseURL}/api/job-cards`,
  GET_JOB_CARD_BY_ID: `${BaseURL}/api/job-cards`,
  UPDATE_JOB_CARD: `${BaseURL}/api/job-cards`,
  DELETE_JOB_CARD: `${BaseURL}/api/job-cards`,
  ADVANCE_JOB_CARD_STAGE: `${BaseURL}/api/job-cards`,
  GET_JOB_CARD_STAGE_HISTORY: `${BaseURL}/api/job-cards`,
  RECORD_JOB_CARD_MATERIAL_USAGE: `${BaseURL}/api/job-cards`,
  GET_WASTAGE_REPORT: `${BaseURL}/api/job-cards/wastage-report`,

  // Job Card Rework endpoints (Module 8)
  CREATE_JOB_CARD_REWORK: `${BaseURL}/api/job-cards`,
  GET_JOB_CARD_REWORKS: `${BaseURL}/api/job-cards`,
  START_JOB_CARD_REWORK: `${BaseURL}/api/job-cards`,
  SUBMIT_JOB_CARD_REWORK: `${BaseURL}/api/job-cards`,
  APPROVE_JOB_CARD_REWORK: `${BaseURL}/api/job-cards`,
  REJECT_JOB_CARD_REWORK: `${BaseURL}/api/job-cards`,

  // Machine endpoints (Patch 18 -- Machine Master + Stock Ledger)
  CREATE_MACHINE: `${BaseURL}/api/machines`,
  GET_ALL_MACHINES: `${BaseURL}/api/machines`,
  GET_MACHINE_BY_ID: `${BaseURL}/api/machines`,
  UPDATE_MACHINE: `${BaseURL}/api/machines`,
  DELETE_MACHINE: `${BaseURL}/api/machines`,

  // Dye/Punch endpoints (two-company Phase 2 Part A -- Quality Packaging's
  // die-cutting tooling register, see claude/two-company-gap-analysis.md)
  CREATE_DYE_PUNCH: `${BaseURL}/api/dye-punches`,
  GET_ALL_DYE_PUNCHES: `${BaseURL}/api/dye-punches`,
  GET_DYE_PUNCH_BY_ID: `${BaseURL}/api/dye-punches`,
  UPDATE_DYE_PUNCH: `${BaseURL}/api/dye-punches`,
  DELETE_DYE_PUNCH: `${BaseURL}/api/dye-punches`,
  // Full Figma slide scan Phase 8 (Theme 7): Godown box/cartoon receiving.
  CREATE_GODOWN_BOX_RECEIPT: `${BaseURL}/api/godown-box-receipts`,
  GET_ALL_GODOWN_BOX_RECEIPTS: `${BaseURL}/api/godown-box-receipts`,
  UPDATE_GODOWN_BOX_RECEIPT: `${BaseURL}/api/godown-box-receipts`,
  DELETE_GODOWN_BOX_RECEIPT: `${BaseURL}/api/godown-box-receipts`,

  // Complaint endpoints (two-company Phase 3 Part A -- "All Complains" nav
  // item from the Quality Packaging dashboard, see two-company-gap-analysis.md)
  CREATE_COMPLAINT: `${BaseURL}/api/complaints`,
  GET_ALL_COMPLAINTS: `${BaseURL}/api/complaints`,
  GET_COMPLAINT_BY_ID: `${BaseURL}/api/complaints`,
  UPDATE_COMPLAINT: `${BaseURL}/api/complaints`,
  DELETE_COMPLAINT: `${BaseURL}/api/complaints`,

  // Stock Ledger endpoints
  GET_MATERIAL_LEDGER: `${BaseURL}/api/stock-ledger/material`,
  GET_STOCK_SUMMARY: `${BaseURL}/api/stock-ledger/summary`,
  GET_STOCK_AVAILABILITY: `${BaseURL}/api/stock-ledger/availability`,

  // Module 11 Part A: Warehouse master
  CREATE_WAREHOUSE: `${BaseURL}/api/warehouses`,
  GET_ALL_WAREHOUSES: `${BaseURL}/api/warehouses`,
  UPDATE_WAREHOUSE: `${BaseURL}/api/warehouses`,
  DELETE_WAREHOUSE: `${BaseURL}/api/warehouses`,

  // Module 11 Part A: Stock Transfer / Adjustment / Reservation
  CREATE_STOCK_TRANSFER: `${BaseURL}/api/stock-movements/transfers`,
  GET_ALL_STOCK_TRANSFERS: `${BaseURL}/api/stock-movements/transfers`,
  CREATE_STOCK_ADJUSTMENT: `${BaseURL}/api/stock-movements/adjustments`,
  GET_ALL_STOCK_ADJUSTMENTS: `${BaseURL}/api/stock-movements/adjustments`,
  CREATE_STOCK_RESERVATION: `${BaseURL}/api/stock-movements/reservations`,
  GET_ALL_STOCK_RESERVATIONS: `${BaseURL}/api/stock-movements/reservations`,
  UPDATE_STOCK_RESERVATION_STATUS: `${BaseURL}/api/stock-movements/reservations`,
  DELETE_STOCK_RESERVATION: `${BaseURL}/api/stock-movements/reservations`,

  // Procurement: RFQ endpoints (Patch 20 -- RFQ -> PO -> GRN)
  CREATE_RFQ: `${BaseURL}/api/rfqs`,
  GET_ALL_RFQS: `${BaseURL}/api/rfqs`,
  GET_RFQ_BY_ID: `${BaseURL}/api/rfqs`,
  DELETE_RFQ: `${BaseURL}/api/rfqs`,
  SEND_RFQ: `${BaseURL}/api/rfqs`,
  CANCEL_RFQ: `${BaseURL}/api/rfqs`,
  RECORD_VENDOR_QUOTE: `${BaseURL}/api/rfqs/quotes`,

  // Procurement: Purchase Order endpoints
  CREATE_PURCHASE_ORDER: `${BaseURL}/api/purchase-orders`,
  SELECT_WINNING_QUOTE: `${BaseURL}/api/purchase-orders/from-quote`,
  GET_ALL_PURCHASE_ORDERS: `${BaseURL}/api/purchase-orders`,
  GET_PURCHASE_ORDER_BY_ID: `${BaseURL}/api/purchase-orders`,
  UPDATE_PURCHASE_ORDER: `${BaseURL}/api/purchase-orders`,
  DELETE_PURCHASE_ORDER: `${BaseURL}/api/purchase-orders`,
  SUBMIT_PO_FOR_APPROVAL: `${BaseURL}/api/purchase-orders`,
  APPROVE_PO: `${BaseURL}/api/purchase-orders`,
  REJECT_PO: `${BaseURL}/api/purchase-orders`,
  SEND_PO: `${BaseURL}/api/purchase-orders`,
  CANCEL_PO: `${BaseURL}/api/purchase-orders`,
  ACKNOWLEDGE_PO: `${BaseURL}/api/purchase-orders`,
  GET_PO_HISTORY: `${BaseURL}/api/purchase-orders`,

  // Procurement: GRN endpoints
  CREATE_GRN: `${BaseURL}/api/grns`,
  GET_ALL_GRNS: `${BaseURL}/api/grns`,
  GET_GRN_BY_ID: `${BaseURL}/api/grns`,

  // Procurement: Purchase Requisition endpoints (Module 11 Part B)
  CREATE_PURCHASE_REQUISITION: `${BaseURL}/api/purchase-requisitions`,
  GET_ALL_PURCHASE_REQUISITIONS: `${BaseURL}/api/purchase-requisitions`,
  GET_PURCHASE_REQUISITION_BY_ID: `${BaseURL}/api/purchase-requisitions`,
  DELETE_PURCHASE_REQUISITION: `${BaseURL}/api/purchase-requisitions`,
  SUBMIT_PR_FOR_APPROVAL: `${BaseURL}/api/purchase-requisitions`,
  APPROVE_PR: `${BaseURL}/api/purchase-requisitions`,
  REJECT_PR: `${BaseURL}/api/purchase-requisitions`,
  CANCEL_PR: `${BaseURL}/api/purchase-requisitions`,
  GET_PR_HISTORY: `${BaseURL}/api/purchase-requisitions`,
  CONVERT_PR_TO_RFQ: `${BaseURL}/api/purchase-requisitions`,
  CONVERT_PR_TO_PO: `${BaseURL}/api/purchase-requisitions`,

  // Procurement: Purchase Return endpoints (Module 11 Part B)
  CREATE_PURCHASE_RETURN: `${BaseURL}/api/purchase-returns`,
  GET_ALL_PURCHASE_RETURNS: `${BaseURL}/api/purchase-returns`,

  // Accounting: Invoice endpoints (Patch 22 -- Invoicing, GST & Payments)
  CREATE_INVOICE: `${BaseURL}/api/invoices`,
  GET_ALL_INVOICES: `${BaseURL}/api/invoices`,
  GET_INVOICE_BY_ID: `${BaseURL}/api/invoices`,
  DELETE_INVOICE: `${BaseURL}/api/invoices`,
  ISSUE_INVOICE: `${BaseURL}/api/invoices`,
  CANCEL_INVOICE: `${BaseURL}/api/invoices`,
  GET_INVOICE_HISTORY: `${BaseURL}/api/invoices`,
  GET_INVOICE_PDF: `${BaseURL}/api/invoices`,
  // Patch 132 (invoice/delivery linkage): remaining un-invoiced quantity for
  // an order, shown in the invoice dialog once an order is selected.
  GET_INVOICE_REMAINING_QUANTITY: `${BaseURL}/api/invoices/remaining-quantity`,

  // Delivery Challan endpoints (Module 12)
  CREATE_DELIVERY_CHALLAN: `${BaseURL}/api/delivery-challans`,
  GET_ALL_DELIVERY_CHALLANS: `${BaseURL}/api/delivery-challans`,
  GET_DELIVERY_CHALLAN_BY_ID: `${BaseURL}/api/delivery-challans`,
  RECORD_DELIVERY_CHALLAN_POD: `${BaseURL}/api/delivery-challans`,
  CANCEL_DELIVERY_CHALLAN: `${BaseURL}/api/delivery-challans`,
  GET_DELIVERY_CHALLAN_PDF: `${BaseURL}/api/delivery-challans`,

  // Accounting: Receipt endpoints
  CREATE_RECEIPT: `${BaseURL}/api/receipts`,
  CREATE_RECEIPT_ALLOCATION: `${BaseURL}/api/receipts/allocate`,
  GET_ALL_RECEIPTS: `${BaseURL}/api/receipts`,
  GET_RECEIPT_BY_ID: `${BaseURL}/api/receipts`,

  // Accounting: Vendor Payment endpoints
  CREATE_VENDOR_PAYMENT: `${BaseURL}/api/vendor-payments`,
  CREATE_VENDOR_PAYMENT_ALLOCATION: `${BaseURL}/api/vendor-payments/allocate`,
  GET_ALL_VENDOR_PAYMENTS: `${BaseURL}/api/vendor-payments`,
  GET_VENDOR_PAYMENT_BY_ID: `${BaseURL}/api/vendor-payments`,

  // Module 9: Credit Note endpoints
  CREATE_CREDIT_NOTE: `${BaseURL}/api/credit-notes`,
  GET_ALL_CREDIT_NOTES: `${BaseURL}/api/credit-notes`,
  GET_CREDIT_NOTE_BY_ID: `${BaseURL}/api/credit-notes`,
  ISSUE_CREDIT_NOTE: `${BaseURL}/api/credit-notes`,
  CANCEL_CREDIT_NOTE: `${BaseURL}/api/credit-notes`,

  // Module 9: Debit Note endpoints
  CREATE_DEBIT_NOTE: `${BaseURL}/api/debit-notes`,
  GET_ALL_DEBIT_NOTES: `${BaseURL}/api/debit-notes`,
  GET_DEBIT_NOTE_BY_ID: `${BaseURL}/api/debit-notes`,
  ISSUE_DEBIT_NOTE: `${BaseURL}/api/debit-notes`,
  CANCEL_DEBIT_NOTE: `${BaseURL}/api/debit-notes`,

  // Module 9: Finance ledgers/ageing (computed reports, not a CRUD resource)
  GET_CUSTOMER_LEDGER: `${BaseURL}/api/finance/customer-ledger`,
  GET_CUSTOMER_AGEING: `${BaseURL}/api/finance/customer-ageing`,
  GET_VENDOR_LEDGER: `${BaseURL}/api/finance/vendor-ledger`,
  GET_VENDOR_AGEING: `${BaseURL}/api/finance/vendor-ageing`,

  // Costing endpoints (Patch 24 -- Costing & Notifications)
  GET_ALL_COSTING: `${BaseURL}/api/costing`,
  GET_COSTING_BY_JOB_CARD: `${BaseURL}/api/costing`,
  UPSERT_LABOR_COST: `${BaseURL}/api/costing`,

  // Notification endpoints
  GET_MY_NOTIFICATIONS: `${BaseURL}/api/notifications`,
  GET_UNREAD_NOTIFICATION_COUNT: `${BaseURL}/api/notifications/unread-count`,
  MARK_NOTIFICATION_READ: `${BaseURL}/api/notifications`,
  MARK_ALL_NOTIFICATIONS_READ: `${BaseURL}/api/notifications/read-all`,

  // Approval + Dashboard endpoints (Patch 26 -- Approval Workflows & Dashboards)
  GET_PENDING_APPROVALS: `${BaseURL}/api/approvals/pending`,
  GET_DASHBOARD_SUMMARY: `${BaseURL}/api/dashboard/summary`,

  // CRM Pipeline endpoints (Patch 28 -- Opportunities)
  CREATE_OPPORTUNITY: `${BaseURL}/api/opportunities`,
  GET_ALL_OPPORTUNITIES: `${BaseURL}/api/opportunities`,
  GET_OPPORTUNITY_BY_ID: `${BaseURL}/api/opportunities`,
  UPDATE_OPPORTUNITY: `${BaseURL}/api/opportunities`,
  DELETE_OPPORTUNITY: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_CONTACT: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_QUALIFY: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_SEND_PROPOSAL: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_WIN: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_LOSE: `${BaseURL}/api/opportunities`,
  GET_OPPORTUNITY_HISTORY: `${BaseURL}/api/opportunities`,
  GET_OPPORTUNITY_ACTIVITIES: `${BaseURL}/api/opportunities`,
  ADD_OPPORTUNITY_ACTIVITY: `${BaseURL}/api/opportunities`,
  // Module 15: expanded funnel + Opportunity -> Quotation conversion.
  OPPORTUNITY_GATHER_REQUIREMENTS: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_NEGOTIATE: `${BaseURL}/api/opportunities`,
  OPPORTUNITY_CONVERT_TO_QUOTATION: `${BaseURL}/api/opportunities`,
  GET_PARTY_360: `${BaseURL}/api/account-master/getbyid`,

  // Module 10: Configuration Masters
  CREATE_UOM: `${BaseURL}/api/uom`,
  GET_ALL_UOM: `${BaseURL}/api/uom`,
  UPDATE_UOM: `${BaseURL}/api/uom`,
  DELETE_UOM: `${BaseURL}/api/uom`,

  CREATE_TAX_RATE: `${BaseURL}/api/tax-rates`,
  GET_ALL_TAX_RATES: `${BaseURL}/api/tax-rates`,
  UPDATE_TAX_RATE: `${BaseURL}/api/tax-rates`,
  DELETE_TAX_RATE: `${BaseURL}/api/tax-rates`,

  CREATE_BRANCH: `${BaseURL}/api/branches`,
  GET_ALL_BRANCHES: `${BaseURL}/api/branches`,
  UPDATE_BRANCH: `${BaseURL}/api/branches`,
  DELETE_BRANCH: `${BaseURL}/api/branches`,

  CREATE_DESIGNATION: `${BaseURL}/api/designations`,
  GET_ALL_DESIGNATIONS: `${BaseURL}/api/designations`,
  UPDATE_DESIGNATION: `${BaseURL}/api/designations`,
  DELETE_DESIGNATION: `${BaseURL}/api/designations`,

  GET_APP_SETTINGS: `${BaseURL}/api/app-settings`,
  BULK_UPDATE_APP_SETTINGS: `${BaseURL}/api/app-settings/bulk`,

  GET_ALL_NUMBERING_CONFIGS: `${BaseURL}/api/numbering-configs`,
  UPDATE_NUMBERING_CONFIG: `${BaseURL}/api/numbering-configs`,

  CREATE_PROCESS_STAGE: `${BaseURL}/api/routing/stages`,
  GET_ALL_PROCESS_STAGES: `${BaseURL}/api/routing/stages`,
  UPDATE_PROCESS_STAGE: `${BaseURL}/api/routing/stages`,
  DELETE_PROCESS_STAGE: `${BaseURL}/api/routing/stages`,

  CREATE_ROUTING_TEMPLATE: `${BaseURL}/api/routing/templates`,
  GET_ALL_ROUTING_TEMPLATES: `${BaseURL}/api/routing/templates`,
  UPDATE_ROUTING_TEMPLATE: `${BaseURL}/api/routing/templates`,
  DELETE_ROUTING_TEMPLATE: `${BaseURL}/api/routing/templates`,
  GET_SUGGESTED_ROUTING_TEMPLATE: `${BaseURL}/api/routing/templates/suggested`,

  GET_LOGIN_HISTORY: `${BaseURL}/api/login-history`,

  // Module 14: Reporting Depth (computed reports, not a CRUD resource).
  GET_DELAYED_JOBS: `${BaseURL}/api/reports/delayed-jobs`,
  GET_CUSTOMER_PERFORMANCE: `${BaseURL}/api/reports/customer-performance`,
  GET_SALESPERSON_PERFORMANCE: `${BaseURL}/api/reports/salesperson-performance`,
  GET_PURCHASE_RATE_TREND: `${BaseURL}/api/reports/purchase-rate-trend`,
};
export default Endpoint;
