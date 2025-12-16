import { describe, it } from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import { decodeJWT } from "./token.ts";
import { config } from "../../config.ts";

describe("decodeJWT", () => {

  // Test decoding a valid JWT token
  it("should decode a valid token", () => {
    const payload = { userId: "123", userRole: "admin" };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });

    // Call the function under test
    const decoded = decodeJWT(token);

    // Assert that the payload is correctly decoded
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.userRole, payload.userRole);
  });

  // Test that a malformed token throws the expected error
  it("should throw for malformed token", () => {
    try {
      decodeJWT("invalid.token.here");
      assert.fail("Expected error not thrown");
    } catch (err: any) {
      // Verify that the error message matches the expected one
      assert.equal(err.message, "Provided access token is malformed");
    }
  });

  // Test that an expired token throws the expected error
  it("should throw for expired token", () => {
    const payload = { userId: "123", userRole: "admin" };
    // Generate a token that is already expired
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "-1s" });

    try {
      decodeJWT(token);
      assert.fail("Expected error not thrown");
    } catch (err: any) {
      // Verify that the error message indicates token expiration
      assert.equal(err.message, "Provided access token is expired");
    }
  });

});
