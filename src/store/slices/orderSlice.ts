import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { orderService } from "@/services/order.service";
import type { CreateOrderFormData, OrderFormResult } from "@/services/order.service";

export interface OrderFileEntry {
  path: string;
  remark?: string;
  uploadedAt?: string;
}
interface OrderStaffRef {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}
export interface Order {
  _id: string;
  orderNumber: string;
  companyName: {
    _id: string;
    companyName: string;
  };
  party: {
    _id: string;
    partyName: string;
    address?: string;
    contactPerson?: string;
    personMobileNo?: string;
    personWhatsAppNo?: string;
    GSTNo?: string;
  };
  productItem: {
    _id: string;
    itemName: string;
  };
  qty: number;
  remarks: string;
  filePaths: string[]; // केवल file paths store करेंगे
  status:
    | "Pending"
    | "Processing"
    | "Completed"
    | "Cancelled"
    | "Hold"
    | "Received"
    | "Designer"
    | "Printer"
    | "Binder"
    | "Booklet & Folder Binder"
    | "Delivery"
    | (string & {});
  createdBy: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;

  // Order detail / job-tracking fields (backend: orders table columns)
  number?: string;
  size?: string;
  // QP box-manufacturing Figma audit (2026-08-25): shown on every Quality
  // Packaging order screen in the design alongside Size, previously absent
  // from the schema entirely.
  ply?: number;
  deckal?: number;
  startNumber?: string;
  endNumber?: string;
  color?: string;
  pType?: string;
  binding?: string;
  subPaper?: string;
  usedPaper?: string;
  printingrate?: string;
  printingratePerUnit?: string;
  gsm?: string;
  rate?: number;
  rateType?: string;
  gst?: string;
  bindergst?: string;
  isGst?: boolean;

  designer?: OrderStaffRef;
  printer?: OrderStaffRef;
  binder?: OrderStaffRef;
  bookletBinder?: OrderStaffRef;
  deliveryStaff?: OrderStaffRef;

  designerStatus?: string;
  printerStatus?: string;
  binderStatus?: string;
  bookletBinderStatus?: string;

  printerWastedSheet?: number;
  binderWastedSheet?: number;
  bookletBinderWastedSheet?: number;

  designerRemarks?: string;
  printerRemarks?: string;
  binderRemarks?: string;
  bookletBinderRemarks?: string;

  printerPapers?: PaperField[];
  binderPapers?: PaperField[];
  bookletPapers?: PaperField[];

  designFiles?: OrderFileEntry[];
  printerFiles?: OrderFileEntry[];
  binderFiles?: OrderFileEntry[];
  bookletBinderFiles?: OrderFileEntry[];

  isLamination?: boolean;
  laminationType?: string;
  uv?: string;
  paper1?: string;
  paper2?: string;
  numberOfSheetUsed?: string;
  sheetSize?: string;
  paperType?: string;

  isPasting?: boolean;
  isCutting?: boolean;
  isCreasing?: boolean;
  isFoil?: boolean;
  isPunching?: boolean;

  validproof?: OrderFileEntry[];
  invoiceValidProof?: OrderFileEntry[];
  reworkHistory?: any[];
  reassignHistory?: any[];

  issuedDate?: string;
  receivedDate?: string;
  pagesPerBook?: number;
  rateBook?: string;
  totalAmount?: string;
  ratePerUnit?: string;

  deliveryDate?: string;
  deliveryTime?: string;

  // Module 12: Sales Order commercial fields.
  customerPoNumber?: string;
  priority?: "Low" | "Normal" | "High" | "Urgent" | (string & {});
  // Module 14: powers the Delayed Jobs report.
  expectedDeliveryDate?: string;
  // Binder task-portal Figma restore (2026-08-27): Raw Paper Size / Raw
  // Paper Used, read/written from the binder task-portal and the
  // printer/binder assignment forms.
  rawPaperSize?: string;
  rawPaperUsed?: string;

  // Booklet Binder field-parity fix (Build 2): own booklet_binder_-
  // prefixed columns, deliberately separate from Binder's own
  // binding/pagesPerBook/subPaper/usedPaper/rateBook/totalAmount/bindergst
  // above so the two production stages never silently overwrite each
  // other's data on the same order row. Typed the same as their Binder
  // equivalents.
  bookletBinderBinding?: string;
  bookletBinderPagesPerBook?: number;
  bookletBinderSubPaper?: string;
  bookletBinderUsedPaper?: string;
  bookletBinderRateBook?: string;
  bookletBinderTotalAmount?: string;
  bookletBinderGst?: string;

  // QP "New Order" Figma match (2026-08-27): already returned by
  // order.controller.js's ORDER_SELECT (orderFrom/orderDate) but never
  // typed here -- Order To Factory page (Build 4) reads these directly
  // rather than through an `as any` cast.
  orderFrom?: string;
  orderDate?: string;
  orderType?: string;
  deliveryDestination?: string;
  // QP "New Order" Figma match (2026-08-27): already returned by
  // order.controller.js's ORDER_SELECT but never typed here.
  dyeNumber?: string;
  dyeSize?: string;
  dyeSheetSize?: string;
  dyeRemark?: string;
  godownRemark?: string;
  factoryRemarks?: string;
  // Order Form grouping (Godown Manager Figma audit, Patch 108): the
  // Figma "Order Form" concept (e.g. "QP-001") that groups several order
  // rows entered together via the batch-entry form. Nullable/undefined for
  // the common case -- most orders don't belong to a form.
  orderForm?: { id: string; orderFormNumber: string } | null;
  // Order To Factory page follow-up (2026-08-27): exposed on the API
  // response as of this same patch (see order.controller.js ORDER_SELECT),
  // but no formula anywhere in this codebase ever computes or writes it --
  // stays null on every order until that separate calculation is built.
  estimatedBoxCost?: number;

  // Production-tracking-panel Figma audit (2026-08-27): the QP "Order In"
  // list's expandable per-row panel. Surfaced read-only from the order's
  // job card's existing Factory job_card_stages row (see order.controller.js
  // getAllOrders) -- editing still happens on the Job Card detail page via
  // jobCardId below, this is just an at-a-glance read of the same data.
  productionPanel?: {
    jobCardId: string;
    currentStage?: string;
    unit?: number | null;
    startDate?: string | null;
    pasting?: string | null;
    pining?: string | null;
    rsFor?: string | null;
    kantan?: string | null;
    kantanDeckal?: string | null;
    finishDate?: string | null;
    status?: string | null;
  } | null;
}
export interface PaperField {
  paperName?: string;
  numberOfSheetsUsed?: string;
  numberOfSheetUsed?: string;
  sheetSize?: string;
  paperType?: string;
  gsm?: string;
  ratePerUnit?: string;
}
interface CreateOrderData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  filePaths?: string[]; // केवल paths
  createdBy?: string;
  customerPoNumber?: string;
  priority?: string;
  expectedDeliveryDate?: string;
}

interface OrderState {
  orders: Order[];
  singleOrder: Order | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: OrderState = {
  orders: [],
  singleOrder: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};

// Create Order
export const createOrderThunk = createAsyncThunk(
  "order/create",
  async (data: CreateOrderData, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(data);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Redux: Create order error:", error);
      return rejectWithValue(error.message || "Failed to create order");
    }
  }
);

// Order Form batch create (Godown Manager Figma audit, Patch 108): creates
// one order_forms row plus N linked orders in a single request/transaction.
export const createOrderFormThunk = createAsyncThunk(
  "order/createForm",
  async (data: CreateOrderFormData, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrderForm(data);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create order form");
      }
    } catch (error: any) {
      console.error("Redux: Create order form error:", error);
      return rejectWithValue(error.message || "Failed to create order form");
    }
  }
);

// Get All Orders
export const getAllOrdersThunk = createAsyncThunk(
  "order/getAll",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      companyName?: string;
      party?: string;
      search?: string;
      // Order To Factory page (Build 4, 2026-08-27): optional server-side
      // filter, additive alongside the existing params above.
      orderFrom?: string;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.getAllOrders(params);

      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      } else {
        return rejectWithValue(
          "Invalid response format: orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get all orders error:", error);
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

// Get Order By ID
export const getOrderByIdThunk = createAsyncThunk(
  "order/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Order not found");
      }
    } catch (error: any) {
      console.error("Redux: Get order by ID error:", error);
      return rejectWithValue(error.message || "Failed to fetch order");
    }
  }
);

// Update Order
export const updateOrderThunk = createAsyncThunk(
  "order/update",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: Partial<
        CreateOrderData &
          Omit<Order, "_id" | "designer" | "printer" | "binder" | "bookletBinder" | "deliveryStaff" | "pagesPerBook" | "bookletBinderPagesPerBook"> & {
            // Update payloads send plain staff IDs, not the populated relation objects
            // the read shape uses.
            designer?: string | null;
            printer?: string | null;
            binder?: string | null;
            bookletBinder?: string | number | null;
            deliveryStaff?: string | null;
            pagesPerBook?: string | number;
            bookletBinderPagesPerBook?: string | number;
          }
      >;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.updateOrder(id, data);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Redux: Update order error:", error);
      return rejectWithValue(error.message || "Failed to update order");
    }
  }
);

// Delete Order
export const deleteOrderThunk = createAsyncThunk(
  "order/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.deleteOrder(id);

      if (response.success) {
        return id; // Return the deleted ID
      } else {
        return rejectWithValue(response.message || "Failed to delete order");
      }
    } catch (error: any) {
      console.error("Redux: Delete order error:", error);
      return rejectWithValue(error.message || "Failed to delete order");
    }
  }
);

// Get Orders by Company and Party
export const getOrdersByCompanyAndPartyThunk = createAsyncThunk(
  "order/getByCompanyAndParty",
  async (
    { companyId, partyId }: { companyId: string; partyId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.getOrdersByCompanyAndParty(
        companyId,
        partyId
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          "Invalid response format: orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get orders by company and party error:", error);
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

export const getDesignerOrdersThunk = createAsyncThunk(
  "order/getDesignerOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getDesignerOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);


export const getPrinterOrdersThunk = createAsyncThunk(
  "order/getPrinterOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getPrinterOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);


export const getBinderOrdersThunk = createAsyncThunk(
  "order/getBinderOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getBinderOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);


export const getBookletBinderThunk = createAsyncThunk(
  "order/getBookletBinderThunk",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getBookletBinder();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);

export const getOrdersByStaffIdThunk = createAsyncThunk(
  "order/getByStaffId",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrdersByStaffId(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Invalid response format: orders array not found"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch orders by staff ID"
      );
    }
  }
);



const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrderError(state) {
      state.error = null;
    },
    clearOrderSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleOrder(state) {
      state.singleOrder = null;
    },
    setOrders(state, action: PayloadAction<Order[]>) {
      state.orders = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      //GET DESIGNER ORDER
      .addCase(getDesignerOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getDesignerOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getDesignerOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })


      //GET BINDER ORDER
      .addCase(getBinderOrdersThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getBinderOrdersThunk.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(getBinderOrdersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.orders = [] // Clear orders on error
      })

      //get Booklet Binder
      .addCase(getBookletBinderThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getBookletBinderThunk.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(getBookletBinderThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.orders = [] // Clear orders on error
      })

      //get designer
      .addCase(getPrinterOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPrinterOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getPrinterOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Create Order
      .addCase(createOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createOrderThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.orders = [action.payload, ...state.orders];
          state.successMessage = "Order created successfully";
          state.error = null;
        }
      )
      .addCase(createOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Order Form batch create
      .addCase(createOrderFormThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createOrderFormThunk.fulfilled,
        (state, action: PayloadAction<OrderFormResult>) => {
          state.loading = false;
          state.orders = [...action.payload.orders, ...state.orders];
          state.successMessage = `Order form ${action.payload.orderFormNumber} created successfully`;
          state.error = null;
        }
      )
      .addCase(createOrderFormThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get All Orders
      .addCase(getAllOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllOrdersThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.orders = action.payload.data;
          if (action.payload.pagination) {
            state.pagination = {
              currentPage: action.payload.pagination.currentPage,
              totalPages: action.payload.pagination.totalPages,
              hasNext: action.payload.pagination.hasNext,
              hasPrev: action.payload.pagination.hasPrev,
            };
          }
          state.totalCount = action.payload.data.length;
          state.error = null;
        }
      )
      .addCase(getAllOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Order By ID
      .addCase(getOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getOrderByIdThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.singleOrder = action.payload;
          state.error = null;
        }
      )
      .addCase(getOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleOrder = null;
      })

      // Update Order
      .addCase(updateOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateOrderThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          state.singleOrder = action.payload;
          state.successMessage = "Order updated successfully";
          state.error = null;
        }
      )
      .addCase(updateOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Order
      .addCase(deleteOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteOrderThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.orders = state.orders.filter(
            (order) => order._id !== action.payload
          );
          state.successMessage = "Order deleted successfully";
          state.error = null;
        }
      )
      .addCase(deleteOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Orders by Company and Party
      .addCase(getOrdersByCompanyAndPartyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getOrdersByCompanyAndPartyThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getOrdersByCompanyAndPartyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })
      .addCase(getOrdersByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orders = [];
      })
      .addCase(
        getOrdersByStaffIdThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getOrdersByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

  },
});

export const {
  clearOrderError,
  clearOrderSuccessMessage,
  clearSingleOrder,
  setOrders,
} = orderSlice.actions;

export default orderSlice.reducer;
