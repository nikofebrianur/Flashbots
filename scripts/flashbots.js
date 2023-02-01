const {
	FlashbotsBundleProvider,
} = require("@flashbots/ethers-provider-bundle");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { EDIT_DISTANCE_THRESHOLD } = require("hardhat/internal/constants");
require("dotenv").config({ path: ".env" });

async function main() {
	const fakeNFT = await ethers.getContractFactory("FakeNFT");
	const FakeNFT = await fakeNFT.deploy();
	await FakeNFT.deployed();
	console.log("Address of Fake NFT Contract:", FakeNFT.address);

	const provider = new ethers.providers.WebSocketProvider(
		process.env.QUICKNODE_WS_URL,
		"goerli"
	);

	const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

	const flashbotsProvider = await FlashbotsBundleProvider.create(
		provider,
		signer,
		"https://relay-goerli.flashbots.net",
		"goerli"
	);

	provider.on("block", async (blockNumber) => {
		console.log("Block Number: ", blockNumber);
		const bundleResponse = await flashbotsProvider.sendBundle(
			[
				{
					transaction: {
						// ChainId for the Goerli network
						chainId: 5,
						// EIP-1559
						type: 2,
						// Value of 1 FakeNFT
						value: ethers.utils.parseEther("0.01"),
						// Address of the FakeNFT
						to: FakeNFT.address,
						// In the data field, we pass the function selctor of the mint function
						data: FakeNFT.interface.getSighash("mint()"),
						// Max Gas Fes you are willing to pay
						maxFeePerGas: BigNumber.from(10).pow(9).mul(3),
						// Max Priority gas fees you are willing to pay
						maxPriorityFeePerGas: BigNumber.from(10).pow(9).mul(2),
					},
					signer: signer,
				},
			],
			blockNumber + 1
		);
		// If an error is present, log it
		if ("error" in bundleResponse) {
			console.log(bundleResponse.error.message);
		}
	});
}

main();