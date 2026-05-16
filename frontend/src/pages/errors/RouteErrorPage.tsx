import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorPageContent } from "@/components/errors/ErrorPageContent";
import { ErrorPageShell } from "@/components/errors/ErrorPageShell";

function messageFromUnknown(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  return undefined;
}

export function RouteErrorPage() {
  const error = useRouteError();
  const detail = messageFromUnknown(error);

  if (!isRouteErrorResponse(error)) {
    return (
      <ErrorPageShell>
        <ErrorPageContent
          code="!"
          title="Đã có lỗi xảy ra"
          description={
            detail ?? "Ứng dụng gặp sự cố không mong muốn. Bạn có thể tải lại trang hoặc quay về trang chủ."
          }
          primary={{ label: "Về trang chủ", to: "/" }}
          secondary={{ label: "Tải lại trang", onClick: () => window.location.reload(), variant: "secondary" }}
          footer={import.meta.env.DEV && detail ? <p className="font-mono text-xs text-dusk-gray">{detail}</p> : undefined}
        />
      </ErrorPageShell>
    );
  }

  const status = error.status;
  const statusText = error.statusText || undefined;

  if (status === 404) {
    return (
      <ErrorPageShell>
        <ErrorPageContent
          code="404"
          title="Không tìm thấy"
          description={
            statusText && statusText !== "Not Found"
              ? statusText
              : "Nội dung bạn yêu cầu không tồn tại hoặc đã được gỡ bỏ."
          }
          primary={{ label: "Về trang chủ", to: "/" }}
          secondary={{ label: "Tải lại trang", onClick: () => window.location.reload(), variant: "secondary" }}
        />
      </ErrorPageShell>
    );
  }

  if (status === 403) {
    return (
      <ErrorPageShell>
        <ErrorPageContent
          code="403"
          title="Không có quyền truy cập"
          description={
            statusText && statusText !== "Forbidden"
              ? statusText
              : "Bạn không có quyền thực hiện thao tác này. Hãy đăng nhập hoặc dùng tài khoản khác."
          }
          primary={{ label: "Về trang chủ", to: "/" }}
          secondary={{ label: "Đăng nhập", to: "/login", variant: "secondary" }}
        />
      </ErrorPageShell>
    );
  }

  if (status >= 500) {
    return (
      <ErrorPageShell>
        <ErrorPageContent
          code={String(status)}
          title="Lỗi máy chủ"
          description={
            statusText && statusText !== "Internal Server Error"
              ? statusText
              : "Máy chủ gặp sự cố. Vui lòng thử lại sau hoặc quay về trang chủ."
          }
          primary={{ label: "Tải lại trang", onClick: () => window.location.reload() }}
          secondary={{ label: "Về trang chủ", to: "/", variant: "secondary" }}
          footer={import.meta.env.DEV && detail ? <p className="font-mono text-xs text-dusk-gray">{detail}</p> : undefined}
        />
      </ErrorPageShell>
    );
  }

  const fallbackDetail = detail;

  return (
    <ErrorPageShell>
      <ErrorPageContent
        code={String(status)}
        title="Đã có lỗi xảy ra"
        description={
          statusText ||
          fallbackDetail ||
          "Ứng dụng gặp sự cố không mong muốn. Bạn có thể tải lại trang hoặc quay về trang chủ."
        }
        primary={{ label: "Về trang chủ", to: "/" }}
        secondary={{ label: "Tải lại trang", onClick: () => window.location.reload(), variant: "secondary" }}
        footer={
          import.meta.env.DEV && fallbackDetail ? (
            <p className="font-mono text-xs text-dusk-gray">{fallbackDetail}</p>
          ) : undefined
        }
      />
    </ErrorPageShell>
  );
}
