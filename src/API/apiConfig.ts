const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
const Endpoint = {
  LOGIN: `${BaseURL}/api/staff/login`,
  CREATE_STAFF: `${BaseURL}/api/staff/create`,
  GET_ALL_STAFF: `${BaseURL}/api/staff/getall`,
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

  // Stock Ledger endpoints
  GET_MATERIAL_LEDGER: `${BaseURL}/api/stock-ledger/material`,
  GET_STOCK_SUMMARY: `${BaseURL}/api/stock-ledger/summary`,

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
  GET_PO_HISTORY: `${BaseURL}/api/purchase-orders`,

  // Procurement: GRN endpoints
  CREATE_GRN: `${BaseURL}/api/grns`,
  GET_ALL_GRNS: `${BaseURL}/api/grns`,
  GET_GRN_BY_ID: `${BaseURL}/api/grns`,

  // Accounting: Invoice endpoints (Patch 22 -- Invoicing, GST & Payments)
  CREATE_INVOICE: `${BaseURL}/api/invoices`,
  GET_ALL_INVOICES: `${BaseURL}/api/invoices`,
  GET_INVOICE_BY_ID: `${BaseURL}/api/invoices`,
  DELETE_INVOICE: `${BaseURL}/api/invoices`,
  ISSUE_INVOICE: `${BaseURL}/api/invoices`,
  CANCEL_INVOICE: `${BaseURL}/api/invoices`,
  GET_INVOICE_HISTORY: `${BaseURL}/api/invoices`,

  // Accounting: Receipt endpoints
  CREATE_RECEIPT: `${BaseURL}/api/receipts`,
  GET_ALL_RECEIPTS: `${BaseURL}/api/receipts`,
  GET_RECEIPT_BY_ID: `${BaseURL}/api/receipts`,

  // Accounting: Vendor Payment endpoints
  CREATE_VENDOR_PAYMENT: `${BaseURL}/api/vendor-payments`,
  GET_ALL_VENDOR_PAYMENTS: `${BaseURL}/api/vendor-payments`,
  GET_VENDOR_PAYMENT_BY_ID: `${BaseURL}/api/vendor-payments`,

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
};
export default Endpoint;
