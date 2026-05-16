import { BgImage } from "@/components/ui/BgImage";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { images } from "@/lib/images";

const REVIEWS = [
  {
    id: "1",
    name: "Chị Mai Anh",
    role: "Hà Nội",
    quote: "Hoa rất đẹp, giao đúng giờ. Shop tư vấn tông pastel rất hợp — mình cực kỳ ưng ý!",
    avatar: images.avatars.maiAnh,
  },
  {
    id: "2",
    name: "Anh Tuấn",
    role: "TP.HCM",
    quote: "Đóng gói cẩn thận, hộp sang. Người nhận bất ngờ và rất vui — cảm ơn UTESHOP!",
    avatar: images.avatars.anhTuan,
  },
  {
    id: "3",
    name: "Chị Lan Hương",
    role: "Đà Nẵng",
    quote: "Lần đầu đặt online mà chất lượng vượt mong đợi. Sẽ quay lại cho dịp sinh nhật bé.",
    avatar: images.avatars.lanHuong,
  },
] as const;

function Stars() {
  return (
    <div className="flex gap-0.5 text-star-rating" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <MaterialIcon key={i} name="star" filled className="text-[18px]" />
      ))}
    </div>
  );
}

export function CustomerTestimonials() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile md:px-margin-desktop lg:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <h2 className="font-home-heading mb-10 text-center text-2xl font-bold text-primary sm:mb-12 sm:text-3xl md:text-4xl">
        Khách hàng nói gì
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {REVIEWS.map((r) => (
          <article
            key={r.id}
            className="relative flex flex-col rounded-3xl border border-crystal-border bg-pure-ivory p-6 pb-12 shadow-[0_12px_36px_rgba(49,27,146,0.06)]"
          >
            <div className="mb-4 flex items-center gap-3">
              <BgImage
                src={r.avatar.src}
                alt={r.avatar.alt}
                className="h-12 w-12 shrink-0 rounded-full border border-crystal-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-home-heading truncate font-bold text-deep-plum">{r.name}</p>
                <Stars />
              </div>
            </div>
            <p className="font-home-heading flex-1 text-sm leading-relaxed text-midnight-purple/90">{r.quote}</p>
            <p className="font-home-heading absolute bottom-5 right-5 text-sm font-bold text-primary">5/5</p>
          </article>
        ))}
      </div>
    </section>
  );
}
