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
import { Cart } from "./pages/Cart";
import { ProfileLayout } from "./pages/ProfileLayout";
import { ProfileOverview } from "./pages/ProfileOverview";
import { Favorites } from "./pages/Favorites";

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
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: "products", element: <ProductList /> },
          { path: "product/:id", element: <ProductDetail /> },
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
          { 
            path: "admin/profile", 
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
