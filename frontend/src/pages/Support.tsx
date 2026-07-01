import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/store/hooks";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/components/ui/ToastContext";
import { api } from "@/lib/api";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Tôi có thể thay đổi hoặc hủy đơn hàng sau khi đặt không?",
    answer: "Bạn có thể thay đổi thông tin giao hàng hoặc hủy đơn hàng miễn phí trong vòng 30 phút kể từ thời điểm đặt hàng thành công. Sau thời gian này hoặc khi Florist của chúng tôi đã bắt đầu cắm hoa, rất tiếc UTE_SHOP không thể hỗ trợ thay đổi hay hoàn tiền. Vui lòng liên hệ Hotline hỗ trợ khẩn cấp để được tư vấn nhanh nhất."
  },
  {
    question: "UTE_SHOP giao hoa trong những khoảng thời gian nào?",
    answer: "Chúng tôi hỗ trợ dịch vụ giao hoa tận nơi từ 7:00 đến 21:00 hàng ngày, kể cả ngày lễ Tết và chủ nhật. Quý khách có thể chọn giao hàng theo khung giờ linh hoạt (mỗi khung 2 giờ) hoặc chỉ định giờ giao hàng chính xác (có thể phát sinh phụ phí nhỏ đối với các yêu cầu giao giờ đặc biệt hoặc ngoài giờ hành chính)."
  },
  {
    question: "Hình thức thanh toán của cửa hàng gồm những gì?",
    answer: "UTE_SHOP chấp nhận đa dạng phương thức thanh toán an toàn bao gồm Chuyển khoản ngân hàng trực tiếp (QR Code nhanh), ví điện tử MoMo, hoặc thanh toán qua thẻ nội địa/quốc tế. Đối với các đơn đặt trước có giá trị cao, chúng tôi hỗ trợ đặt cọc tối thiểu 30% và thanh toán phần còn lại khi nhận hoa."
  },
  {
    question: "Hoa nhận được không giống hình mẫu hoặc bị hư hại thì giải quyết thế nào?",
    answer: "Với cam kết chất lượng tuyệt đối, UTE_SHOP luôn gửi ảnh chụp thành phẩm thực tế để quý khách duyệt trước khi đi giao. Nếu sản phẩm thực tế bị hư hại, dập nát quá 20% trong quá trình vận chuyển, vui lòng chụp ảnh/quay video gửi ngay cho chúng tôi trong vòng 2 giờ kể từ khi nhận hoa. Chúng tôi cam kết thiết kế lại, giao mới miễn phí hoặc hoàn tiền 100%."
  },
  {
    question: "Cửa hàng có thiết kế hoa theo yêu cầu riêng biệt không?",
    answer: "Chắc chắn rồi! UTE_SHOP tự hào sở hữu đội ngũ Florist chuyên nghiệp sẵn sàng hiện thực hóa mọi ý tưởng của bạn. Bạn chỉ cần gửi mẫu hoa ưa thích, ngân sách dự kiến và thông điệp mong muốn truyền tải, chúng tôi sẽ tư vấn và thiết kế riêng cho bạn tác phẩm hoa nghệ thuật độc bản và hoàn hảo nhất."
  }
];

export function Support() {
  const { showToast } = useToast();
  const profile = useAppSelector((state) => state.profile.profile);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"ORDER" | "PAYMENT" | "PRODUCT" | "OTHER">("ORDER");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // FAQ Expand state
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Auto fill form if logged in
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      showToast("Vui lòng điền đầy đủ tất cả các trường thông tin bắt buộc.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/api/v1/support/tickets", {
        fullName,
        email,
        phone,
        subject,
        category,
        message
      });

      if (response.data.success) {
        showToast("Gửi yêu cầu hỗ trợ thành công! Chúng tôi sẽ phản hồi sớm nhất qua email/SĐT.", "success");
        // Reset form except user details
        setSubject("");
        setMessage("");
        if (!profile) {
          setFullName("");
          setEmail("");
          setPhone("");
        }
      } else {
        showToast(response.data.message || "Gửi yêu cầu hỗ trợ thất bại.", "error");
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.";
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pure-ivory via-lavender-mist/10 to-pure-ivory pt-24 pb-16 md:pt-32">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1440px] px-2 md:px-6">
        
        {/* Center Animated Headline */}
        <section className="text-center max-w-2xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-slogan text-3xl text-primary block mb-2"
          >
            Chăm sóc khách hàng
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-section-title text-[44px] leading-tight text-deep-plum mb-4 md:text-[52px]"
          >
            Chúng Tôi Có Thể <span className="text-primary italic font-serif font-normal">Giúp Gì</span> Cho Bạn?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-dusk-gray text-base leading-relaxed"
          >
            Đội ngũ UTE_SHOP luôn sẵn sàng đồng hành cùng bạn 24/7. Tìm câu trả lời nhanh chóng tại góc Hỏi đáp thường gặp hoặc gửi trực tiếp yêu cầu hỗ trợ chuyên sâu cho chúng tôi.
          </motion.p>
        </section>

        {/* Two Columns Support Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: FAQ Accordion (7 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-lg bg-soft-amethyst/60 text-primary flex items-center justify-center">
                <MaterialIcon name="help_outline" className="text-[20px]" />
              </div>
              <h2 className="font-home-heading text-xl font-extrabold text-deep-plum">Câu hỏi thường gặp (FAQs)</h2>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div 
                    key={idx}
                    className={`glass-panel overflow-hidden rounded-[20px] border transition-[background-color,border-color,box-shadow] duration-300 ${
                      isExpanded 
                        ? "border-primary/30 bg-white shadow-[0_8px_30px_rgba(168,85,247,0.04)]" 
                        : "border-crystal-border/80 bg-pure-ivory/55 hover:border-primary/20 hover:bg-pure-ivory/80"
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(idx)}
                      className="w-full flex items-center justify-between p-5 text-left transition-colors focus:outline-none"
                    >
                      <span className={`font-home-heading text-sm font-bold transition-colors duration-200 ${
                        isExpanded ? "text-primary" : "text-midnight-purple"
                      }`}>
                        {faq.question}
                      </span>
                      <div className={`shrink-0 ml-4 flex size-6 items-center justify-center rounded-full bg-soft-amethyst/30 text-primary transition-transform duration-300 ${
                        isExpanded ? "rotate-180 bg-primary text-pure-ivory" : ""
                      }`}>
                        <MaterialIcon name="keyboard_arrow_down" className="text-[18px]" />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-crystal-border/40 font-sans text-xs text-dusk-gray leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Quick Contact Info boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-4">
              <div className="glass-panel p-5 rounded-[22px] border border-crystal-border bg-pure-ivory/60 flex items-start gap-4">
                <div className="size-10 rounded-xl bg-soft-amethyst/40 text-primary flex items-center justify-center shrink-0">
                  <MaterialIcon name="call" className="text-[20px]" />
                </div>
                <div>
                  <h4 className="font-home-heading text-xs font-extrabold text-midnight-purple mb-1">Hotline hỗ trợ nhanh</h4>
                  <p className="font-sans text-sm font-bold text-primary">0901 234 567</p>
                  <p className="text-[10px] text-dusk-gray mt-0.5">Hỗ trợ khẩn cấp (7:00 - 22:00)</p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-[22px] border border-crystal-border bg-pure-ivory/60 flex items-start gap-4">
                <div className="size-10 rounded-xl bg-soft-amethyst/40 text-primary flex items-center justify-center shrink-0">
                  <MaterialIcon name="mail" className="text-[20px]" />
                </div>
                <div>
                  <h4 className="font-home-heading text-xs font-extrabold text-midnight-purple mb-1">Email chăm sóc</h4>
                  <p className="font-sans text-sm font-bold text-primary">support@uteshop.vn</p>
                  <p className="text-[10px] text-dusk-gray mt-0.5">Phản hồi chậm nhất trong 12h làm việc</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column Right: Support Request Form (5 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-lg bg-soft-amethyst/60 text-primary flex items-center justify-center">
                <MaterialIcon name="rate_review" className="text-[20px]" />
              </div>
              <h2 className="font-home-heading text-xl font-extrabold text-deep-plum">Gửi yêu cầu trợ giúp</h2>
            </div>

            <div className="glass-panel rounded-[28px] p-6 md:p-8 border border-crystal-border/80 bg-pure-ivory/80 shadow-[0_15px_45px_rgba(168,85,247,0.06)] relative overflow-hidden group">
              {/* Premium gradient side decorations */}
              <div className="absolute -top-10 -right-10 size-32 rounded-full bg-soft-amethyst/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {/* Fullname input */}
                <div>
                  <label className="block text-xs font-bold text-midnight-purple/80 mb-1.5 font-home-heading">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-crystal-border/80 bg-white/50 px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                    <MaterialIcon name="person" className="text-[18px] text-dusk-gray" />
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={profile !== null && profile.fullName !== undefined}
                      className="w-full bg-transparent text-xs font-semibold text-midnight-purple placeholder-dusk-gray outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Email input */}
                <div>
                  <label className="block text-xs font-bold text-midnight-purple/80 mb-1.5 font-home-heading">
                    Địa chỉ Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-crystal-border/80 bg-white/50 px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                    <MaterialIcon name="mail" className="text-[18px] text-dusk-gray" />
                    <input
                      type="email"
                      placeholder="nguyenvana@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={profile !== null && profile.email !== undefined}
                      className="w-full bg-transparent text-xs font-semibold text-midnight-purple placeholder-dusk-gray outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Phone input */}
                <div>
                  <label className="block text-xs font-bold text-midnight-purple/80 mb-1.5 font-home-heading">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-crystal-border/80 bg-white/50 px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                    <MaterialIcon name="call" className="text-[18px] text-dusk-gray" />
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={profile !== null && profile.phone !== undefined}
                      className="w-full bg-transparent text-xs font-semibold text-midnight-purple placeholder-dusk-gray outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Subject & Category inline row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-midnight-purple/80 mb-1.5 font-home-heading">
                      Danh mục <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-crystal-border/80 bg-white/50 px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-primary/40 focus-within:bg-white">
                      <MaterialIcon name="category" className="text-[18px] text-dusk-gray" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-transparent text-xs font-bold text-midnight-purple outline-none appearance-none cursor-pointer"
                      >
                        <option value="ORDER">Đơn hàng</option>
                        <option value="PAYMENT">Thanh toán</option>
                        <option value="PRODUCT">Sản phẩm</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject input */}
                  <div>
                    <label className="block text-xs font-bold text-midnight-purple/80 mb-1.5 font-home-heading">
                      Tiêu đề <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-crystal-border/80 bg-white/50 px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                      <MaterialIcon name="title" className="text-[18px] text-dusk-gray" />
                      <input
                        type="text"
                        placeholder="Vấn đề cần hỗ trợ"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-midnight-purple placeholder-dusk-gray outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Message input */}
                <div>
                  <label className="block text-xs font-bold text-midnight-purple/80 mb-1.5 font-home-heading">
                    Nội dung yêu cầu <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-crystal-border/80 bg-white/50 px-3 py-2.5 text-xs font-semibold text-midnight-purple placeholder-dusk-gray outline-none transition-[border-color,background-color,box-shadow] duration-300 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
                    required
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-full login-gradient-bg py-3 px-6 text-xs font-extrabold text-pure-ivory shadow-md transition-[box-shadow,filter,opacity] duration-300 hover:shadow-lg hover:brightness-105 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-pure-ivory border-t-transparent" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <>
                      <MaterialIcon name="send" className="text-[16px]" />
                      <span>Gửi yêu cầu hỗ trợ</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
