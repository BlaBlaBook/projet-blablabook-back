import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeQueryParam } from "./query.ts";

describe("normalizeQueryParam", () => {

  // Test when the parameter is undefined
  it("should return empty array when param is undefined", () => {
    const result = normalizeQueryParam(undefined);
    assert.deepEqual(result, []);
  });

  // Test when the parameter is a single string
  it("should return array with single string when param is a string", () => {
    const result = normalizeQueryParam("hello");
    assert.deepEqual(result, ["hello"]);
  });

  // Test when the parameter is an array of strings
  it("should return only strings when param is an array of strings", () => {
    const result = normalizeQueryParam(["hello", "world"]);
    assert.deepEqual(result, ["hello", "world"]);
  });

  // Test filtering of non-string items in an array (e.g., ParsedQs objects)
  it("should filter out non-string items (ParsedQs) in array", () => {
    const result = normalizeQueryParam(["hello", { key: "value" }]);
    assert.deepEqual(result, ["hello"]);
  });

  // Test when the parameter is a single ParsedQs object
  it("should return empty array when param is a ParsedQs object", () => {
    const result = normalizeQueryParam({ key: "value" });
    assert.deepEqual(result, []);
  });

  // Test mixed arrays of strings and ParsedQs objects
  it("should filter array of mixed string and ParsedQs objects", () => {
    const result = normalizeQueryParam(["hello", { key: "value" }]);
    assert.deepEqual(result, ["hello"]);
  });

});
