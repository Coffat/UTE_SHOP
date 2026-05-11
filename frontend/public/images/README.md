# UTESHOP Image Assets

Thư mục này chứa toàn bộ ảnh tĩnh dùng trong UTESHOP frontend. Tất cả file ở đây
đều được Next.js phục vụ trực tiếp tại đường dẫn `/images/<subfolder>/<file>`.

> Quản lý đường dẫn tập trung tại [`lib/images.ts`](../../lib/images.ts).
> Khi thay/đổi tên file, cập nhật cả constant trong file đó.

## Cấu trúc thư mục

```
public/images/
├── hero/         # Ảnh nền của Hero Section
├── products/     # Ảnh các sản phẩm hoa (best sellers, listing,...)
├── campaigns/    # Ảnh banner cho seasonal/marketing campaign
├── gallery/      # Ảnh Instagram-style gallery (Social Proof)
└── avatars/      # Ảnh đại diện khách hàng (Reviews)
```

## Naming convention

Dùng `snake_case`, mô tả ngắn theo vị trí dùng:

| Section | File mong đợi | Kích thước gợi ý |
| :--- | :--- | :--- |
| Hero | `hero/hero_section_background.jpg` | 1200x1200 (square crop OK) |
| Products | `products/lavender_dream.jpg` | 600x600 |
| Products | `products/blush_whisper.jpg` | 600x600 |
| Products | `products/purple_symphony.jpg` | 600x600 |
| Products | `products/pure_elegance.jpg` | 600x600 |
| Campaigns | `campaigns/mothers_day_collection.jpg` | 1600x800 (2:1 banner) |
| Gallery | `gallery/gallery_petals_marble.jpg` | 800x800 (item lớn 2x2) |
| Gallery | `gallery/gallery_purple_rose.jpg` | 400x400 |
| Gallery | `gallery/gallery_hands_bouquet.jpg` | 400x400 |
| Gallery | `gallery/gallery_florist_workspace.jpg` | 800x400 |
| Avatars | `avatars/avatar_mai_anh.jpg` | 80x80 (square) |
| Avatars | `avatars/avatar_anh_tuan.jpg` | 80x80 (square) |

## Định dạng

- Ưu tiên `.webp` hoặc `.avif` cho ảnh lớn (hero, campaign) để giảm dung lượng.
- `.jpg` cho ảnh chụp sản phẩm chất lượng cao.
- `.png` chỉ khi cần nền trong suốt.

## Tone & art direction

Ảnh phải tuân theo design system Neo-Glassmorphism Pastel (xem [`design.md`](../../design.md)):

- Tông pastel: lavender, ivory, blush pink, soft purple.
- Ánh sáng tự nhiên, mềm mại, airy.
- Tránh saturated/contrast cao, không dùng filter lạnh (xanh biển/xám lạnh).

## Cách dùng trong code

```ts
import { images } from "@/lib/images";

// Dùng cho CSS background (BgImage component)
<BgImage src={images.hero.background.src} alt={images.hero.background.alt} />

// Dùng cho next/image
<Image
  src={images.products.lavenderDream.src}
  alt={images.products.lavenderDream.alt}
  width={600}
  height={600}
/>
```

Mỗi entry trong `lib/images.ts` có:

- `src`: đường dẫn `/images/...` (local) hoặc URL remote.
- `alt`: mô tả nghệ thuật / accessibility.

Khi có ảnh thật, chỉ cần đổi `src` từ URL `lh3.googleusercontent.com` sang
`/images/hero/hero_section_background.jpg` trong [`lib/images.ts`](../../lib/images.ts) — không cần sửa component.
