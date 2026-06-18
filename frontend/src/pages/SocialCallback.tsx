import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setAuthSessionFlag } from "../lib/authSession";

export const SocialCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Exchange token for session cookies
      api
        .post("/api/v1/auth/social-exchange", { token })
        .then((response) => {
          setAuthSessionFlag();
          const redirectUrl = response.data?.data?.redirectUrl || "/user/profile";
          navigate(redirectUrl, { replace: true });
        })
        .catch((err) => {
          console.error("Social login exchange failed", err);
          setError("Xác thực mạng xã hội thất bại. Vui lòng thử lại.");
          setTimeout(() => navigate("/login?error=social_auth_failed", { replace: true }), 3000);
        });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <h2 className="text-xl font-semibold text-red-500 mb-4">{error}</h2>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Đang xử lý đăng nhập...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
};
