import { formatEther, parseEther } from "viem";
import hre from "hardhat";

async function main() {
  const escrow = await hre.viem.deployContract("FreelanceEscrow");

  console.log(
    `FreelanceEscrow deployed to ${escrow.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
