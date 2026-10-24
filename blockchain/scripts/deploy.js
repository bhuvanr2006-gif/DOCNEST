const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Registry = await hre.ethers.getContractFactory("DocumentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  const payload = { address, network: hre.network.name };
  fs.writeFileSync(path.join(__dirname, "..", "deployed.json"), JSON.stringify(payload, null, 2));
  console.log("DocumentRegistry deployed to", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
