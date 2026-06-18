import { FacebookGlyph, GoogleGlyph } from "@/icons";

const providers = [
  { name: "Google" as const, Glyph: GoogleGlyph, endpoint: "/api/v1/auth/google" },
  { name: "Facebook" as const, Glyph: FacebookGlyph, endpoint: "/api/v1/auth/facebook" },
];

export function AuthSocialOAuthSection() {
  const handleSocialLogin = (endpoint: string) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    window.location.href = apiBase ? `${apiBase}${endpoint}` : endpoint;
  };

  return (
    <>
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-crystal-border" />
        <span className="font-ui-label text-xs uppercase tracking-wide text-dusk-gray">hoặc</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-crystal-border" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        {providers.map(({ name, Glyph, endpoint }) => (
          <button
            key={name}
            type="button"
            onClick={() => handleSocialLogin(endpoint)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/55 bg-pure-ivory/30 py-4 backdrop-blur-sm transition hover:bg-pure-ivory/45 cursor-pointer"
            style={{ WebkitBackdropFilter: "blur(8px)" }}
          >
            <Glyph className="size-7 sm:size-8" />
            <span className="font-ui-label text-[11px] font-medium text-deep-plum sm:text-xs">{name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
