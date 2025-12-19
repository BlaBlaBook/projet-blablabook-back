import jwt from "jsonwebtoken";
import { config } from "../../../config.ts";
import { decodeJWT } from "../../../src/lib/token.ts";

describe("decodeJWT", () => {

  it("should decode a valid token", () => {
    const payload = { userId: "123", userRole: "admin" };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "1h" });

    const decoded = decodeJWT(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.userRole).toBe(payload.userRole);
  });

  it("should throw for malformed token", () => {
    expect(() => decodeJWT("invalid.token.here"))
      .toThrow("Provided access token is malformed");
  });

  it("should throw for expired token", () => {
    const payload = { userId: "123", userRole: "admin" };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "-1s" });

    expect(() => decodeJWT(token))
      .toThrow("Provided access token is expired");
  });

});
