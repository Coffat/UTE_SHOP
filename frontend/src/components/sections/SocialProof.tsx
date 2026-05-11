import type { ReactElement } from "react";
import { BgImage } from "@/components/ui/BgImage";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { images } from "@/lib/images";

type Review = {
  id: string;
  rating: number;
  hasHalf?: boolean;
  quote: string;
  name: string;
  location: string;
  avatarUrl: string;
  avatarAlt: string;
  showQuoteIcon?: boolean;
  containerClass?: string;
};

const REVIEWS: Review[] = [
  {
    id: "mai-anh",
    rating: 5,
    quote:
      "\"Hoa rất đẹp, giao hàng đúng giờ. Đặc biệt bạn nhân viên tư vấn chọn hoa tông pastel làm mình cực kỳ ưng ý. Chắc chắn sẽ quay lại!\"",
    name: "Chị Mai Anh",
    location: "Khách hàng tại Hà Nội",
    avatarUrl: images.avatars.maiAnh.src,
    avatarAlt: images.avatars.maiAnh.alt,
    showQuoteIcon: true,
    containerClass: "md:ml-4",
  },
  {
    id: "tuan",
    rating: 4,
    hasHalf: true,
    quote:
      "\"Đóng gói siêu cẩn thận, hộp hoa sang trọng như hàng hiệu. Người nhận rất bất ngờ và hạnh phúc.\"",
    name: "Anh Tuấn",
    location: "Khách hàng tại TP.HCM",
    avatarUrl: images.avatars.anhTuan.src,
    avatarAlt: images.avatars.anhTuan.alt,
    containerClass: "md:mr-8 opacity-80 md:scale-95 origin-left",
  },
];

const GALLERY = [
  {
    ...images.gallery.petalsMarble,
    wrapperClass: "row-span-2 col-span-2 md:col-span-1",
  },
  {
    ...images.gallery.purpleRose,
    wrapperClass: "",
  },
  {
    ...images.gallery.handsBouquet,
    wrapperClass: "",
  },
  {
    ...images.gallery.floristWorkspace,
    wrapperClass: "col-span-2",
  },
];

function StarRow({ rating, hasHalf }: { rating: number; hasHalf?: boolean }) {
  const fullCount = hasHalf ? rating : rating;
  const stars: ReactElement[] = [];

  for (let i = 0; i < fullCount; i += 1) {
    stars.push(
      <MaterialIcon
        key={`full-${i}`}
        name="star"
        filled
        className="text-[18px]"
      />
    );
  }

  if (hasHalf) {
    stars.push(
      <MaterialIcon
        key="half"
        name="star_half"
        filled
        className="text-[18px]"
      />
    );
  }

  return <div className="flex gap-1 text-tertiary-fixed mb-3">{stars}</div>;
}

export function SocialProof() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="font-section-title text-deep-plum text-3xl sm:text-4xl lg:text-section-title mb-2">
            Khách hàng yêu thích
          </h2>
          <p className="font-body-standard text-dusk-gray">
            Hơn 10,000+ lời khen từ những khách hàng đã trải nghiệm dịch vụ của UTESHOP.
          </p>
        </div>

        <div className="flex flex-col gap-6 relative">
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className={`glass-panel p-6 rounded-3xl relative ${review.containerClass ?? ""}`}
            >
              {review.showQuoteIcon ? (
                <div className="absolute -left-6 -top-4 text-dreamy-purple opacity-30">
                  <MaterialIcon
                    name="format_quote"
                    filled
                    className="text-[60px]"
                  />
                </div>
              ) : null}

              <StarRow rating={review.rating} hasHalf={review.hasHalf} />

              <p className="font-body-standard text-midnight-purple italic mb-4">
                {review.quote}
              </p>

              <div className="flex items-center gap-3">
                <BgImage
                  src={review.avatarUrl}
                  alt={review.avatarAlt}
                  className="w-10 h-10 rounded-full border border-crystal-border"
                />
                <div>
                  <h5 className="font-ui-label text-deep-plum text-sm">
                    {review.name}
                  </h5>
                  <span className="text-xs text-dusk-gray font-body-standard">
                    {review.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[110px] sm:auto-rows-[130px] md:auto-rows-[150px] xl:auto-rows-[180px] 3xl:auto-rows-[220px]">
        {GALLERY.map((item) => (
          <div
            key={item.src}
            className={`rounded-2xl overflow-hidden shadow-md group ${item.wrapperClass}`}
          >
            <BgImage
              src={item.src}
              alt={item.alt}
              className="w-full h-full transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
