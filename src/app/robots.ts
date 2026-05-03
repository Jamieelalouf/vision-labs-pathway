import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/en/admin", "/fr/admin", "/en/portal", "/fr/portal", "/api"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
