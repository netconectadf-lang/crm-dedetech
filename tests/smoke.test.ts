import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("fundação", () => {
  it("cn mescla classes do tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});
