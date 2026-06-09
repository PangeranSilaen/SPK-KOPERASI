import { describe, it, expect } from "vitest";
import { formatDecimal } from "@/lib/format";

describe("formatDecimal", () => {
  it("membulatkan ke 3 desimal", () => {
    expect(formatDecimal(0.3666)).toBe("0.367");
    expect(formatDecimal(1.2449)).toBe("1.245");
  });

  it("selalu menampilkan 3 desimal walau bilangan bulat", () => {
    expect(formatDecimal(12.3)).toBe("12.300");
    expect(formatDecimal(1)).toBe("1.000");
    expect(formatDecimal(0)).toBe("0.000");
  });
});
