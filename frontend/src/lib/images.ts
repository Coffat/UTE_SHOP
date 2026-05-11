/**
 * Central registry for all static image URLs used on the homepage.
 *
 * When you add real files under `public/images/`, change each `src` from the
 * remote URL to a local path like `/images/hero/hero_section_background.webp`.
 *
 * See `public/images/README.md` for folder layout & naming conventions.
 */

export type ImageAsset = {
  src: string;
  alt: string;
};

export const images = {
  hero: {
    background: {
      src: "/images/hero/hero_section_background.png",
      alt: "A hyper-realistic, elegant floral arrangement featuring pastel purple and white roses, peonies, and delicate greenery, softly lit by morning sunlight. The setting is a minimalist, modern room with bright, airy light-mode aesthetics. The overall color palette emphasizes lavender, ivory, and soft greens, creating a serene, dreamy, and poetic atmosphere perfect for a premium digital floral boutique.",
    } satisfies ImageAsset,
  },

  products: {
    lavenderDream: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBMJ3-Ea78WayHPejlpSsoKWf1DwuqSaorqxZlE1AYjedTSblB_rw4YLRo3EfhUKAFUeK0uA58HUTegsNVoC7VtCq1xEhmSyyYGFwP2nEwZnDoKBLVVQuSgBHrrkRcGazkkBg7znr9K5u6fFHr5fcZS1_i64eKHiXxwnT3D5zhVM2xGOKUbjYd8luykmalu7UFC-ksfGICcmQF00nJbLC67Jd0hlDnEziL4cuRHV4RrJkozf_Nm3pPj7NM9upneSv9mKYqkmgDaizM",
      // Local: "/images/products/lavender_dream.webp",
      alt: "A beautiful close-up of a pastel pink and soft purple peony bouquet elegantly wrapped in minimalist frosted paper. The lighting is soft and airy studio light, creating a dreamy light-mode neo-glassmorphism aesthetic against a clean, extremely soft lavender background.",
    } satisfies ImageAsset,
    blushWhisper: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkGhQKhNnsTQNcM_rC8J39dS63WTeSMiDze5Tsbbt1KCmDyPoayq0VAr0vVKKdTVEbXoFfYBQG9fFXBBu7E1ELlkRuMXsCTNFz--Q-ZpThT3mjPeL5hAWp6nW695YiyULbKPmoTVUybg--Mi_P6NI-DmV7HMiiR9qSc4VSXB60ECR5g6yLXasWSLCZw_bQKFUFRw2GJTAyqafgdVxTiJz9hkUKroOCPupeEtV4y4cFquqDpbJKWoIcgLWcJhjaQ0Dm3A455Cfye-g",
      // Local: "/images/products/blush_whisper.webp",
      alt: "An elegant, modern arrangement of delicate blush pink tulips and white ranunculus in a clear glass vase. The scene is brightly lit with natural window light, reflecting softly off the glass. The background is a soft, pristine ivory color, matching a modern light-mode digital boutique aesthetic perfectly.",
    } satisfies ImageAsset,
    purpleSymphony: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDysIEo02W9N261jOSacMu-nD2cPoS1aDCI_GV3VTTvY73MjTWGDs279UpPCJqaGHJOsSr85iFhV77maiQlgcUkuANVx-OL7nyXFUv8FWaA8EE-PNYjkU5T7aoIy82xgcNQdPCasnYCor2dxYu9vuN0GlLoZQG2xxkqu6yJMPDb72kOj-Bjztu3Mkfp47O7tV1hHdowFotEi0be7PMaYdpUSEI7GuzVqN6lcn9Keyp1_n4_TO3MWI3D46dzReeGieLuLkpcdhAOqVg",
      // Local: "/images/products/purple_symphony.webp",
      alt: "A sophisticated digital shop product photo showing a vibrant yet pastel-toned bouquet of purple lisianthus, white hydrangeas, and eucalyptus leaves. Set against a luminous, minimal backdrop of lavender mist color, emphasizing a dreamy, premium floral design aesthetic.",
    } satisfies ImageAsset,
    pureElegance: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfsWnNw4MKxqVcCeLg1GGERN9IJDWiZAG3V2us6po9uKjLAerhrUi_ggSCEl7uRlQTOHCmhiCmoSooQaFHK9AkBoNU55Sfc-IiZVO98LUAtINcQ_WmTEAETI_dagUR4ZlToNDF_1Rl_N8HjEutW1BvHanUjkWoKT9BhHlX2v0-Fu_K33dY6RL2zd53KEZQnkx-G2o8gVnSwpk4fpc6Vj93RqjTaiPMelguUKQYiFLAqPjOWyZ1Kp-dtHAxowDokfh6QqngRoCvrT4",
      // Local: "/images/products/pure_elegance.webp",
      alt: "A delicate and minimalist arrangement of pure white orchids and subtle green ferns in an elegant ceramic pot. The image features a bright, airy aesthetic with ultra-soft lighting, perfectly complementing a modern light-theme digital boutique environment centered on natural beauty.",
    } satisfies ImageAsset,
  },

  campaigns: {
    mothersDay: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC99UKcgUE7S2NPIobsQBhi_Tt23vPpaJgfo2ctOLGuIJw9VJtoa7pcF0Gv2JJXcYy6fbmaj5wzFnY5zA6ud-XbhEgkhVl35kb5C6cKel4-ri7RuvXCs6ldKyRvPC1IUlSaisBUmttC22xEpLmuCH2jtn4Z7-yVfBaie6hZyKqVqDJ3gbsYg6Req_jamcUmOUAgEdinHLdyuBDqHcBJeWRNFHW6AJ27qI9b5ww8Js5x-dusrPbSI5RJjhixetGe118hrH4VMD5Hs2g",
      // Local: "/images/campaigns/mothers_day_collection.webp",
      alt: "A wide, cinematic shot of a lavish mother's day floral arrangement featuring luxurious pink and purple carnations, orchids, and soft foliage. The background is slightly out of focus, bathed in warm, romantic, soft natural light. The aesthetic is neo-glassmorphism inspired, highly elegant, serene, with a delicate pastel color scheme.",
    } satisfies ImageAsset,
  },

  gallery: {
    petalsMarble: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp4Oo_A1y38qTQuopx1UM-uv4CZrUawtgBk_pVGLh4jR0gVSZXWGY5K4oRXYwUjepMgTj8nOqaFzP8iw8JH-_eSV7-IwZiVY6hToJkXmMgDi4_VOJxRa_eeWazlyyg8FMiK38NY1-HwiVbBrc8hwkevbiCrbs37V9zQRRaXyGCylzxywQBp0hmT90Z4LpVmua2hCOdOA2kNKITnshBr9FfUqbUokw5pXmogSkTLXseUC7ZuQK-dcw-YpRyQ6_-AHDsXQtGFUuk2iQ",
      // Local: "/images/gallery/gallery_petals_marble.webp",
      alt: "An artistic, Instagram-style top-down photo of scattered pastel flower petals and a small minimalist vase on a pristine white marble table. The lighting is extremely bright and soft, creating a serene, dreamy aesthetic suitable for a modern digital florist gallery.",
    } satisfies ImageAsset,
    purpleRose: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7QN3UUFue_C2tIVM2xFdo3gIEsLy3MbZUH3zYqyim7QQpVYortDxgFgEhgtEHRo-AZO6JKhlZGZXZafMRzS7GVxhoI_XnOcCtaEUcBti0eXcgxwDNzPX86IECBxXJb8GZejGUs-4lGiyTwYLiegW58l4k-l9LcNtFfHB1q002GuG7213CCml1M9wwQ5sLfpd8ahwnWWJ2SWEnZ5l__wzFKSUiVJZ_hsa6vXfHVZvJQk5YQwU1KfIUqepbCl1eqP7GK9WCMoswRss",
      // Local: "/images/gallery/gallery_purple_rose.webp",
      alt: "A close-up aesthetic shot of a single blooming light purple rose against a blurred lavender background. Soft bokeh effect. The image is light, airy, and fits a high-end neo-glassmorphism floral shop visual language.",
    } satisfies ImageAsset,
    handsBouquet: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmIe43UIrD-ZrkAdsgdt3YhseawpC2bPOEft8wf79TGHYiU18_MzY16MucnjF9eyTqNg7aX5qTIlL6KfTma3U7-fW71E7_BEMaARUs-EZ5iHYXnLle0rgegCs-EwOy-TWWefvBiiAtQkxfKFCf8nZD8hrcY6hZA-nGnB5Jfn3jlfWGvsCYL7vy_ROXgydA_nbK6_CR3wDf_pnpGbNAdg7h-0x64Ox3BWNXz-a7g9Qi9DQyyLmOuvMp9R8ytezziaufIGktjxE-n0M",
      // Local: "/images/gallery/gallery_hands_bouquet.webp",
      alt: "A soft-focus lifestyle image showing a person's hands holding a beautifully wrapped bouquet of white and blush peonies. Warm, golden hour lighting filters through a window, creating an emotional and deeply poetic visual for a high-end boutique.",
    } satisfies ImageAsset,
    floristWorkspace: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3_tvm5edys-HMLKhyO1riLSTT2khdEMg3qAXm8yE8OEtr9l0fHV3En09EjRGLeduJf0RaU_P6Vx57p8CZ77uNuLEnJG3DP-RHuDlnJZs3gQxnaTdWG6kfqkdC5U-KfjRAQR6KMvXYaieVRwBc-lG2Ofnxiy2lMcUtCAn3w4pwEb5HjC9H-_kAIYZiR8hl8uH8EAQlttOWtLabbUcQCyErjojq8topoXjVypZDOIK_G6I6jbElL0N6VAMrn7oOGEolYgf6JLlgNcc",
      // Local: "/images/gallery/gallery_florist_workspace.webp",
      alt: "A wide, aesthetic shot of a rustic yet modern florist workspace. Baskets of fresh lavender, shears, and delicate wrapping paper sit on a clean wooden desk. The space is flooded with bright, ethereal light, matching a dreamy pastel UI theme.",
    } satisfies ImageAsset,
  },

  avatars: {
    maiAnh: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeA924tgP7WvaX_ntUDl_8Sc_OugAlSkD-fuoYCdlMXXmwdCW9cGogR22bEf85k_qlFAd2jUrnmumyKEGORmUJLn-AYpq8QCto3JDaDDvO9eDnaCOVZUPQ5Q1ReEpKP_vSsj890UREgDKBv3Fgd4hRHESxdCQXgEbtGSbF8fZdU9UXS_HS4wpYRXs2T5UXueInyBpazfdh1xDqfiRPaU-Cg2I8kYF_bBm7jYnAPSDYNBZ7R5yK2XMWoS8EVOoT5iiOujFk-y9Hj4c",
      // Local: "/images/avatars/avatar_mai_anh.webp",
      alt: "A small circular avatar placeholder image showing a softly lit, happy customer portrait, blending seamlessly with the elegant pastel UI aesthetics of the digital boutique.",
    } satisfies ImageAsset,
    anhTuan: {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBV4tPY2Z9XmvDTLph2Z22gXF4L_y_ipJummnz1v7SshWoe5hZkhIppTXgvcSkEnaX_g3r9rRCwNUNuXrDKeWcbGJJ_TZrToyq5YOiVMMi-qEQsPvArmJ4WVk65CtnpV7rs3VMZsYoARtZTQhAB9k6M1Cws1v-JfESc2Vb8Wju1ngN0yb9MXFyvCiMZkbzuKmtNUPCJLXjveBWoqvm2ShYU-IR9twDzTwBqct6FF7gZ_GXjwn03G1K785NwPQYr3VkZdxiX_yBAuU",
      // Local: "/images/avatars/avatar_anh_tuan.webp",
      alt: "A small circular avatar placeholder image showing a softly lit portrait, matching the neo-glassmorphism digital boutique aesthetic.",
    } satisfies ImageAsset,
  },
} as const;
