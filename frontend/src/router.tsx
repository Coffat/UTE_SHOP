import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import { Forbidden } from "./pages/errors/Forbidden";
import { NotFound } from "./pages/errors/NotFound";
import { RouteErrorPage } from "./pages/errors/RouteErrorPage";
import { ServerError } from "./pages/errors/ServerError";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProductList } from "./pages/ProductList";
import { ProductDetail } from "./pages/ProductDetail";
import { CategoryProductList } from "./pages/CategoryProductList";
import { Cart } from "./pages/Cart";
import { ProfileLayout } from "./pages/ProfileLayout";
import { ProfileOverview } from "./pages/ProfileOverview";
import { Favorites } from "./pages/Favorites";

// Admin Imports
import { AdminLayout } from "./admin/layouts/AdminLayout";
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { OrdersPage } from "./admin/pages/OrdersPage";
import { ProductsPage } from "./admin/pages/ProductsPage";
import { CustomersPage } from "./admin/pages/CustomersPage";
import { StaffPage } from "./admin/pages/StaffPage";
import { ReportsPage } from "./admin/pages/ReportsPage";
import { SettingsPage } from "./admin/pages/SettingsPage";
import { ProfilePage as AdminProfilePage } from "./admin/pages/ProfilePage";

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      // --- Admin Routes ---
      {
        path: "/admin",
        element: (
          <AdminAuthProvider>
            <AdminLayout />
          </AdminAuthProvider>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "staff", element: <StaffPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "profile", element: <AdminProfilePage /> },
        ],
      },
      // --- Customer/Storefront Routes ---
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: "products", element: <ProductList /> },
          { path: "product/:id", element: <ProductDetail /> },
          { path: "category/:slug", element: <CategoryProductList /> },
          { path: "cart", element: <Cart /> },
          { 
            path: "user/profile", 
            element: <ProfileLayout />,
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: "overview", element: <ProfileOverview /> },
              { path: "favorites", element: <Favorites /> },
            ]
          },
          { path: "403", element: <Forbidden /> },
          { path: "500", element: <ServerError /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
