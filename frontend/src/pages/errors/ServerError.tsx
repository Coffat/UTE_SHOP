import { ErrorPageContent } from "@/components/errors/ErrorPageContent";
import { ErrorPageMainColumn } from "@/components/errors/ErrorPageShell";

export function ServerError() {
  return (
    <ErrorPageMainColumn>
      <ErrorPageContent
        code="500"
        title="Đã xảy ra lỗi"
        description="Hệ thống tạm thời không phản hồi đúng. Vui lòng thử lại sau ít phút — UTESHOP luôn sẵn sàng đồng hành cùng bạn."
        primary={{ label: "Tải lại trang", onClick: () => window.location.reload() }}
        secondary={{ label: "Về trang chủ", to: "/", variant: "secondary" }}
      />
    </ErrorPageMainColumn>
  );
}
