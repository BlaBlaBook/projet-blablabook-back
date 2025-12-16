import { describe, it } from "node:test";
import assert from "node:assert";
import { extractAccessTokenFromRequest } from "./token.ts";

describe("extractAccessTokenFromRequest", () => {

  // Test extracting token from the Authorization header
  it("should extract token from Authorization header", () => {
    const req = { headers: { authorization: "Bearer abc123" }, cookies: {} } as any;

    // Call the function under test
    const token = extractAccessTokenFromRequest(req);

    // Assert that the token is correctly extracted from the header
    assert.equal(token, "abc123");
  });

  // Test extracting token from cookies when header is missing
  it("should extract token from cookies if header missing", () => {
    const req = { headers: {}, cookies: { accessToken: "cookie123" } } as any;

    // Call the function under test
    const token = extractAccessTokenFromRequest(req);

    // Assert that the token is correctly extracted from cookies
    assert.equal(token, "cookie123");
  });

  // Test behavior when no token is provided
  it("should throw if token not provided", () => {
    const req = { headers: {}, cookies: {} } as any;

    try {
      extractAccessTokenFromRequest(req);
      assert.fail("Expected error not thrown");
    } catch (err: any) {
      // Assert that the correct error message is thrown
      assert.equal(err.message, "Access token not provided in Authorization headers or Cookies");
    }
  });

});
