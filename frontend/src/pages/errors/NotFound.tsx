import { useNavigate } from "react-router-dom";
import { ErrorPageContent } from "@/components/errors/ErrorPageContent";
import { ErrorPageMainColumn } from "@/components/errors/ErrorPageShell";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <ErrorPageMainColumn>
      <ErrorPageContent
        code="404"
        title="Không tìm thấy trang"
        description="Đường dẫn này không tồn tại hoặc đã được chuyển đi. Hãy quay về cửa hàng để tiếp tục chọn hoa bạn yêu thích."
        primary={{ label: "Về trang chủ", to: "/" }}
        secondary={{ label: "Quay lại", onClick: () => navigate(-1), variant: "secondary" }}
      />
    </ErrorPageMainColumn>
  );
}
