import { ErrorPageContent } from "@/components/errors/ErrorPageContent";
import { ErrorPageMainColumn } from "@/components/errors/ErrorPageShell";

export function Forbidden() {
  return (
    <ErrorPageMainColumn>
      <ErrorPageContent
        code="403"
        title="Không có quyền truy cập"
        description="Bạn chưa đăng nhập hoặc tài khoản không đủ quyền để xem nội dung này. Đăng nhập bằng tài khoản phù hợp hoặc quay lại trang chủ."
        primary={{ label: "Về trang chủ", to: "/" }}
        secondary={{ label: "Đăng nhập", to: "/login", variant: "secondary" }}
      />
    </ErrorPageMainColumn>
  );
}
