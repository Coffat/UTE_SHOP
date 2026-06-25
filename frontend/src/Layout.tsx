import { Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/ToastContext";
import { CustomerChatWidget } from "@/features/chat/customer/CustomerChatWidget";

import { CampaignPopup } from "@/components/common/CampaignPopup";

export function Layout() {
  return (
    <ToastProvider>
      <Header />
      <main className="flex flex-col gap-16 pb-16 md:gap-24 md:pb-24 lg:gap-[5.5rem] lg:pb-28">
        <Outlet />
      </main>
      <Footer />
      <CustomerChatWidget />
      <CampaignPopup />
    </ToastProvider>
  );
}
