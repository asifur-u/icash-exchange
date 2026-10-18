export type SocialLink = {
  id: "facebook" | "instagram" | "youtube" | "tiktok";
  label: string;
  href: string;
};

function cleanUrl(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

/** Public social pages — set NEXT_PUBLIC_SOCIAL_* in .env */
export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [
    {
      id: "facebook",
      label: "Facebook",
      href: cleanUrl(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK),
    },
    {
      id: "instagram",
      label: "Instagram",
      href: cleanUrl(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM),
    },
    {
      id: "youtube",
      label: "YouTube",
      href: cleanUrl(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE),
    },
    {
      id: "tiktok",
      label: "TikTok",
      href: cleanUrl(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK),
    },
  ];

  // Always keep Facebook + Instagram icons; extras only when URL is set.
  return links.filter((link) => {
    if (link.id === "facebook" || link.id === "instagram") return true;
    return Boolean(link.href);
  });
}
