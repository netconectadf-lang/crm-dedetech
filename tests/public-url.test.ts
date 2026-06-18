import { afterEach, describe, expect, it } from "vitest";

import { publicSiteUrl } from "@/lib/public-url";

const ORIGINAL_ENV = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_URL: process.env.VERCEL_URL,
};

afterEach(() => {
  restoreEnv("NEXT_PUBLIC_APP_URL", ORIGINAL_ENV.NEXT_PUBLIC_APP_URL);
  restoreEnv("NEXT_PUBLIC_SITE_URL", ORIGINAL_ENV.NEXT_PUBLIC_SITE_URL);
  restoreEnv("VERCEL_URL", ORIGINAL_ENV.VERCEL_URL);
});

function restoreEnv(key: keyof typeof ORIGINAL_ENV, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("publicSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL when it is a valid origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/path";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    delete process.env.VERCEL_URL;

    expect(publicSiteUrl()).toBe("https://example.com");
  });

  it("falls back to NEXT_PUBLIC_APP_URL when site URL is empty", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    delete process.env.VERCEL_URL;

    expect(publicSiteUrl()).toBe("http://localhost:3000");
  });

  it("falls back to the production URL when env values are invalid", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "dedetech.test";
    process.env.NEXT_PUBLIC_APP_URL = "localhost:3000";
    delete process.env.VERCEL_URL;

    expect(publicSiteUrl()).toBe("https://dedetech-crm.vercel.app");
  });
});
