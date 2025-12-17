import { normalizeQueryParam } from "../../src/lib/query.ts";

describe("normalizeQueryParam", () => {

  it("should return empty array when param is undefined", () => {
    const result = normalizeQueryParam(undefined);
    expect(result).toEqual([]);
  });

  it("should return array with single string when param is a string", () => {
    const result = normalizeQueryParam("hello");
    expect(result).toEqual(["hello"]);
  });

  it("should return only strings when param is an array of strings", () => {
    const result = normalizeQueryParam(["hello", "world"]);
    expect(result).toEqual(["hello", "world"]);
  });

  it("should filter out non-string items (ParsedQs) in array", () => {
    const result = normalizeQueryParam(["hello", { key: "value" }]);
    expect(result).toEqual(["hello"]);
  });

  it("should return empty array when param is a ParsedQs object", () => {
    const result = normalizeQueryParam({ key: "value" });
    expect(result).toEqual([]);
  });

  it("should filter array of mixed string and ParsedQs objects", () => {
    const result = normalizeQueryParam(["hello", { key: "value" }]);
    expect(result).toEqual(["hello"]);
  });

});
