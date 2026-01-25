import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { ferretexApi as api } from "../shared/api/ferretexApi.js";

const AppContext = createContext(null);
const STORAGE_KEY = "ferretex:v2";

const baseState = {
  auth: { isAuth: false, user: null, token: null },
  cart: { items: [] }, // {id,name,price,qty,stock?,image?}
  ui: { sort: "price_asc" },
  orders: { my: [] },
};

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function sanitizeLoadedState(parsed) {
  const auth = parsed?.auth ?? baseState.auth;
  const isAuth = Boolean(auth?.token && auth?.user);

  return {
    ...baseState,
    auth: isAuth
      ? { isAuth: true, token: auth.token, user: auth.user }
      : { ...baseState.auth },
    cart: parsed?.cart ?? baseState.cart,
    ui: parsed?.ui ?? baseState.ui,
    orders: parsed?.orders ?? baseState.orders,
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return baseState;
  const parsed = safeParse(raw);
  if (!parsed) return baseState;
  return sanitizeLoadedState(parsed);
}

function saveState(state) {
  const payload = {
    auth: state.auth,
    cart: state.cart,
    ui: state.ui,
    orders: state.orders,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  // compat: algunos componentes guardan token aquí
  if (state.auth?.token) localStorage.setItem("ferretex:token", state.auth.token);
  else localStorage.removeItem("ferretex:token");
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_SORT":
      return { ...state, ui: { ...state.ui, sort: action.payload } };

    case "SET_SESSION":
      return {
        ...state,
        auth: {
          isAuth: true,
          token: action.payload.token,
          user: action.payload.user,
        },
      };

    case "LOGOUT":
      return {
        ...state,
        auth: { isAuth: false, user: null, token: null },
        cart: { items: [] },
        orders: { my: [] },
      };

    case "ADD_TO_CART": {
      const item = action.payload; // {id,name,price,stock?,image?}
      const exists = state.cart.items.find((x) => x.id === item.id);

      if (exists) {
        const max = Number(item.stock ?? exists.stock ?? Infinity);
        const nextQty = exists.qty + 1;
        if (Number.isFinite(max) && nextQty > max) return state;

        const items = state.cart.items.map((x) =>
          x.id === item.id
            ? { ...x, qty: nextQty, stock: item.stock ?? x.stock, image: item.image ?? x.image }
            : x
        );
        return { ...state, cart: { items } };
      }

      const items = [...state.cart.items, { ...item, qty: 1 }];
      return { ...state, cart: { items } };
    }

    case "INC_QTY": {
      const id = action.payload;
      const items = state.cart.items.map((x) => {
        if (x.id !== id) return x;

        const max = Number(x.stock ?? Infinity);
        const nextQty = x.qty + 1;
        if (Number.isFinite(max) && nextQty > max) return x;

        return { ...x, qty: nextQty };
      });
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

    case "SET_MY_ORDERS":
      return { ...state, orders: { ...state.orders, my: action.payload } };

    case "RESET_PERSISTENCE":
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("ferretex:token");
      return baseState;

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, baseState, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = useMemo(() => {
    const fetchMyOrdersInternal = async (token) => {
      if (!token) return [];
      const list = await api.getMyOrders({ token });
      dispatch({ type: "SET_MY_ORDERS", payload: Array.isArray(list) ? list : [] });
      return list;
    };

    return {
      // UI
      setSort: (sort) => dispatch({ type: "SET_SORT", payload: sort }),

      // Cart
      addToCart: (product) => dispatch({ type: "ADD_TO_CART", payload: product }),
      incQty: (id) => dispatch({ type: "INC_QTY", payload: id }),
      decQty: (id) => dispatch({ type: "DEC_QTY", payload: id }),
      removeFromCart: (id) => dispatch({ type: "REMOVE_FROM_CART", payload: id }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),

      // Auth
      login: ({ token, ...user }) => {
        dispatch({ type: "SET_SESSION", payload: { token, user } });
      },

      loginApi: async ({ email, password }) => {
        const r = await api.login({ email, password });
        dispatch({ type: "SET_SESSION", payload: { token: r.token, user: r.user } });
        await fetchMyOrdersInternal(r.token);
        return r.user;
      },

      registerApi: async ({ name, email, password, role }) => {
        await api.register({ name, email, password, role });
        const r = await api.login({ email, password });
        dispatch({ type: "SET_SESSION", payload: { token: r.token, user: r.user } });
        await fetchMyOrdersInternal(r.token);
        return r.user;
      },

      logout: () => dispatch({ type: "LOGOUT" }),

      // Orders
      fetchMyOrders: async () => fetchMyOrdersInternal(state.auth.token),

      createOrderApi: async ({ orderId, mode, phone, address, notes, items }) => {
        const token = state.auth.token;
        if (!token) throw new Error("No autenticado");

        const payload = {
          id: orderId,
          mode, // pickup | delivery
          phone,
          address: mode === "delivery" ? address : null,
          notes: notes || "",
          items: items.map((x) => ({ productId: x.id, qty: x.qty })),
        };

        const r = await api.createOrder({ token, payload });

        dispatch({ type: "CLEAR_CART" });
        await fetchMyOrdersInternal(token);
        return r;
      },

      resetPersistence: () => dispatch({ type: "RESET_PERSISTENCE" }),
    };
  }, [state.auth.token]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
