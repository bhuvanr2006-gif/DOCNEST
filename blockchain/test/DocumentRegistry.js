const { expect } = require("chai");

describe("DocumentRegistry", function () {
  it("registers a digest and rejects duplicates", async function () {
    const Registry = await ethers.getContractFactory("DocumentRegistry");
    const registry = await Registry.deploy();
    const digest = ethers.id("synthetic-document");
    await registry.register(digest);
    const result = await registry.verify(digest);
    expect(result.exists).to.equal(true);
    await expect(registry.register(digest)).to.be.revertedWith("already registered");
  });

  it("does not treat an unknown digest as registered", async function () {
    const Registry = await ethers.getContractFactory("DocumentRegistry");
    const registry = await Registry.deploy();
    const result = await registry.verify(ethers.id("missing"));
    expect(result.exists).to.equal(false);
  });
});
