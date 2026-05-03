import type { MetadataRoute } from "next";

const routes = [
  "",
  "/pathway",
  "/cohorts",
  "/faq",
  "/register",
  "/login",
  "/signup",
  "/forgot-password"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();

  return ["fr", "en"].flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7
    }))
  );
}
