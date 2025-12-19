import type { Request } from "express";
import { extractAccessTokenFromRequest } from "../../../src/lib/token.ts";

describe("extractAccessTokenFromRequest", () => {

  it("should extract token from Authorization header", () => {
    const req = { headers: { authorization: "Bearer abc123" }, cookies: {} } as unknown as Request;

    const token = extractAccessTokenFromRequest(req);

    expect(token).toBe("abc123");
  });

  it("should extract token from cookies if header missing", () => {
    const req = { headers: {}, cookies: { accessToken: "cookie123" } } as unknown as Request;

    const token = extractAccessTokenFromRequest(req);

    expect(token).toBe("cookie123");
  });

  it("should throw if token not provided", () => {
    const req = { headers: {}, cookies: {} } as unknown as Request;

    expect(() => extractAccessTokenFromRequest(req))
      .toThrow("Access token not provided in Authorization headers or Cookies");
  });

});
