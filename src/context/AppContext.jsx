import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const AppContext = createContext(null);
const STORAGE_KEY = "ferretex:v1";

/* =========================
   Estado base
========================= */
const baseState = {
  auth: { isAuth: false, user: null }, // {name, email, role}
  cart: { items: [] }, // {id, name, price, qty}
  ui: { sort: "price_asc" },
  catalog: { prices: {} }, // precios editados (mock)
  audit: { priceChanges: [] }, // historial cambios de precio
  orders: { list: [] }, // historial de compras
  ops: { orderStatusById: {} }, // estado operativo por ordenId
};

/* =========================
   Helpers localStorage
========================= */
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return baseState;

  const parsed = safeParse(raw);
  if (!parsed) return baseState;

  return {
    ...baseState,
    auth: parsed.auth ?? baseState.auth,
    cart: parsed.cart ?? baseState.cart,
    ui: parsed.ui ?? baseState.ui,
    catalog: parsed.catalog ?? baseState.catalog,
    audit: parsed.audit ?? baseState.audit,
    orders: parsed.orders ?? baseState.orders,
    ops: parsed.ops ?? baseState.ops,
  };
}

function saveState(state) {
  const payload = {
    auth: state.auth,
    cart: state.cart,
    ui: state.ui,
    catalog: state.catalog,
    audit: state.audit,
    orders: state.orders,
    ops: state.ops,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/* =========================
   Reducer
========================= */
function reducer(state, action) {
  switch (action.type) {
    /* ---- Auth ---- */
    case "LOGIN":
      return { ...state, auth: { isAuth: true, user: action.payload } };

    case "LOGOUT":
      return {
        ...state,
        auth: { isAuth: false, user: null },
        cart: { items: [] },
      };

    /* ---- UI ---- */
    case "SET_SORT":
      return { ...state, ui: { ...state.ui, sort: action.payload } };

    /* ---- Cart ---- */
    case "ADD_TO_CART": {
      const item = action.payload;
      const exists = state.cart.items.find((x) => x.id === item.id);

      const items = exists
        ? state.cart.items.map((x) =>
            x.id === item.id ? { ...x, qty: x.qty + 1 } : x
          )
        : [...state.cart.items, { ...item, qty: 1 }];

      return { ...state, cart: { items } };
    }

    case "INC_QTY": {
      const id = action.payload;
      const items = state.cart.items.map((x) =>
        x.id === id ? { ...x, qty: x.qty + 1 } : x
      );
      return { ...state, cart: { items } };
    }

    case "DEC_QTY": {
      const id = action.payload;
      const items = state.cart.items
        .map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0);
      return { ...state, cart: { items } };
    }

    case "REMOVE_FROM_CART": {
      const id = action.payload;
      const items = state.cart.items.filter((x) => x.id !== id);
      return { ...state, cart: { items } };
    }

    case "CLEAR_CART":
      return { ...state, cart: { items: [] } };

    /* ---- Orders ---- */
    case "CREATE_ORDER": {
      const role = state.auth.user?.role ?? "customer";
      if (role !== "customer") return state;

      const order = action.payload;
      return {
        ...state,
        orders: {
          list: [order, ...state.orders.list],
        },
      };
    }

    /* ---- Catalog / Prices ---- */
    case "UPDATE_PRICE": {
      const role = state.auth.user?.role ?? "customer";
      if (role !== "manager") return state;

      const { id, oldPrice, newPrice, actorEmail, atISO } = action.payload;

      return {
        ...state,
        catalog: {
          ...state.catalog,
          prices: { ...state.catalog.prices, [id]: newPrice },
        },
        audit: {
          ...state.audit,
          priceChanges: [
            { id, oldPrice, newPrice, actorEmail, atISO },
            ...state.audit.priceChanges,
          ],
        },
      };
    }

    case "SET_ORDER_STATUS": {
      const role = state.auth.user?.role ?? "customer";
      const isStaff = role === "staff" || role === "manager";
      if (!isStaff) return state;

      const { orderId, status } = action.payload;

      return {
        ...state,
        ops: {
          ...state.ops,
          orderStatusById: {
            ...state.ops.orderStatusById,
            [orderId]: status,
          },
        },
      };
    }

    case "RESET_ORDER_STATUS": {
      const role = state.auth.user?.role ?? "customer";
      const isStaff = role === "staff" || role === "manager";
      if (!isStaff) return state;

      const { orderId } = action.payload;
      const next = { ...state.ops.orderStatusById };
      delete next[orderId];

      return {
        ...state,
        ops: { ...state.ops, orderStatusById: next },
      };
    }

    /* ---- Reset total ---- */
    case "RESET_PERSISTENCE":
      localStorage.removeItem(STORAGE_KEY);
      return baseState;

    default:
      return state;
  }
}

/* =========================
   Provider
========================= */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, baseState, loadState);

  // Persistencia automática
  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = useMemo(
    () => ({
      /* Auth */
      login: (user) => dispatch({ type: "LOGIN", payload: user }),
      logout: () => dispatch({ type: "LOGOUT" }),

      /* UI */
      setSort: (sort) => dispatch({ type: "SET_SORT", payload: sort }),

      /* Cart */
      addToCart: (product) =>
        dispatch({ type: "ADD_TO_CART", payload: product }),
      incQty: (id) => dispatch({ type: "INC_QTY", payload: id }),
      decQty: (id) => dispatch({ type: "DEC_QTY", payload: id }),
      removeFromCart: (id) =>
        dispatch({ type: "REMOVE_FROM_CART", payload: id }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),

      /* Orders */
      createOrder: (order) =>
        dispatch({ type: "CREATE_ORDER", payload: order }),

      /* Prices */
      updatePrice: ({ id, oldPrice, newPrice }) => {
        const actorEmail = state.auth.user?.email ?? "unknown";
        const atISO = new Date().toISOString();

        dispatch({
          type: "UPDATE_PRICE",
          payload: { id, oldPrice, newPrice, actorEmail, atISO },
        });
      },

      setOrderStatus: (orderId, status) =>
        dispatch({ type: "SET_ORDER_STATUS", payload: { orderId, status } }),
      resetOrderStatus: (orderId) =>
        dispatch({ type: "RESET_ORDER_STATUS", payload: { orderId } }),

      /* Debug */
      resetPersistence: () => dispatch({ type: "RESET_PERSISTENCE" }),
    }),
    [state.auth.user]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* =========================
   Hook
========================= */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
