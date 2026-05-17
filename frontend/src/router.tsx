import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { Forbidden } from "./pages/errors/Forbidden";
import { NotFound } from "./pages/errors/NotFound";
import { RouteErrorPage } from "./pages/errors/RouteErrorPage";
import { ServerError } from "./pages/errors/ServerError";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { UserProfile } from "./pages/UserProfile";
import { ProductList } from "./pages/ProductList";
import { ProductDetail } from "./pages/ProductDetail";

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
          { path: "user/profile", element: <UserProfile /> },
          { path: "admin/profile", element: <UserProfile /> },
          { path: "403", element: <Forbidden /> },
          { path: "500", element: <ServerError /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
