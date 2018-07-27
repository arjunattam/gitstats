const assert = require("assert");
const url = require("url");

describe("bitbucket pagination", function() {
  it("should parse url query params", function() {
    const parsed = url.parse(
      "https://api.bitbucket.org/2.0/repositories/pypy/pypy/commits?page=1",
      true
    );
    assert.deepEqual(parsed.query, { page: "1" });
  });
});
