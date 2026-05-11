import { Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function Layout() {
  return (
    <>
      <Header />
      <main className="flex flex-col gap-20 md:gap-section pb-20 md:pb-section">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
