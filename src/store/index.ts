import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import accountMasterReducer from './slices/accountMasterSlice';
import staffReducer from './slices/staffSlice';
import assignTaskReducer from './slices/assignTaskSlice';
import leadReducer from './slices/leadSlice';
import purchaseReducer from './slices/purchaseSlice';
import companyReducer from './slices/compnaySlice';
import partyReducer from './slices/partySlice';
import productItemReducer from './slices/productItemSlice';
import fileUploadReducer from "./slices/fileUploadSlice";
import orderReducer from "./slices/orderSlice";
import statusReducer from "./slices/statusSlice";
import roleReducer from "./slices/roleSlice";
import materialReducer from "./slices/materialSlice";
import roleDepartmentReducer from '@/store/slices/roleDepartmentSlice';
import performanceInvoiceReducer from '@/store/slices/performanceInvoiceSlice';
import companyNameReducer from '@/store/slices/companyNameSlice';
import vendorReducer from '@/store/slices/vendorSlice';
import inventoryReducer from '@/store/slices/inventorySlice';
import quotationReducer from '@/store/slices/quotationSlice';
import bomReducer from '@/store/slices/bomSlice';
import jobCardReducer from '@/store/slices/jobCardSlice';
import machineReducer from '@/store/slices/machineSlice';
import stockLedgerReducer from '@/store/slices/stockLedgerSlice';
import rfqReducer from '@/store/slices/rfqSlice';
import purchaseOrderReducer from '@/store/slices/purchaseOrderSlice';
import grnReducer from '@/store/slices/grnSlice';
import invoiceReducer from '@/store/slices/invoiceSlice';
import receiptReducer from '@/store/slices/receiptSlice';
import vendorPaymentReducer from '@/store/slices/vendorPaymentSlice';
import costingReducer from '@/store/slices/costingSlice';
import notificationReducer from '@/store/slices/notificationSlice';
import approvalReducer from '@/store/slices/approvalSlice';
import dashboardReducer from '@/store/slices/dashboardSlice';
import opportunityReducer from '@/store/slices/opportunitySlice';
import jobCardReworkReducer from '@/store/slices/jobCardReworkSlice';
import creditNoteReducer from '@/store/slices/creditNoteSlice';
import debitNoteReducer from '@/store/slices/debitNoteSlice';
import financeReducer from '@/store/slices/financeSlice';
import uomReducer from '@/store/slices/uomSlice';
import taxRateReducer from '@/store/slices/taxRateSlice';
import branchReducer from '@/store/slices/branchSlice';
import designationReducer from '@/store/slices/designationSlice';
import appSettingsReducer from '@/store/slices/appSettingsSlice';
import numberingConfigReducer from '@/store/slices/numberingConfigSlice';
import routingReducer from '@/store/slices/routingSlice';
import loginHistoryReducer from '@/store/slices/loginHistorySlice';
import warehouseReducer from '@/store/slices/warehouseSlice';
import stockMovementReducer from '@/store/slices/stockMovementSlice';
import purchaseReturnReducer from '@/store/slices/purchaseReturnSlice';
import purchaseRequisitionReducer from '@/store/slices/purchaseRequisitionSlice';
import deliveryChallanReducer from '@/store/slices/deliveryChallanSlice';
import reportsReducer from '@/store/slices/reportsSlice';
import activeCompanyReducer from '@/store/slices/activeCompanySlice';
import dyePunchReducer from '@/store/slices/dyePunchSlice';
import complaintReducer from '@/store/slices/complaintSlice';
// Persist configuration
export const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'user'], // Persist both token and user
  version: 1,
};

// Create persisted reducer for auth
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// Configure the store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    accountMasters: accountMasterReducer,
    staff: staffReducer,
    assignTasks: assignTaskReducer,
    leads: leadReducer, // Add leadReducer
    purchase: purchaseReducer,
    company: companyReducer,
    party: partyReducer,
    productItems: productItemReducer,
    fileUpload: fileUploadReducer,
    orders: orderReducer,
    status: statusReducer,
    roles: roleReducer,
    materials: materialReducer,
    roleDepartments: roleDepartmentReducer,
    performanceInvoices:performanceInvoiceReducer,
    companyNames: companyNameReducer,
    vendors: vendorReducer,
    inventory: inventoryReducer,
    quotations: quotationReducer,
    boms: bomReducer,
    jobCards: jobCardReducer,
    machines: machineReducer,
    dyePunches: dyePunchReducer,
    complaints: complaintReducer,
    stockLedger: stockLedgerReducer,
    rfqs: rfqReducer,
    purchaseOrders: purchaseOrderReducer,
    grns: grnReducer,
    invoices: invoiceReducer,
    receipts: receiptReducer,
    vendorPayments: vendorPaymentReducer,
    costing: costingReducer,
    notifications: notificationReducer,
    approvals: approvalReducer,
    dashboard: dashboardReducer,
    opportunities: opportunityReducer,
    jobCardReworks: jobCardReworkReducer,
    creditNotes: creditNoteReducer,
    debitNotes: debitNoteReducer,
    finance: financeReducer,
    uoms: uomReducer,
    taxRates: taxRateReducer,
    branches: branchReducer,
    designations: designationReducer,
    appSettings: appSettingsReducer,
    numberingConfigs: numberingConfigReducer,
    routing: routingReducer,
    loginHistory: loginHistoryReducer,
    warehouses: warehouseReducer,
    stockMovements: stockMovementReducer,
    purchaseReturns: purchaseReturnReducer,
    purchaseRequisitions: purchaseRequisitionReducer,
    deliveryChallans: deliveryChallanReducer,
    reports: reportsReducer,
    activeCompany: activeCompanyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;