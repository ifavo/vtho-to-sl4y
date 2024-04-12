import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import type { SL4YMinter } from "../typechain-types";

describe("SL4YMinter", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        const [owner, anon, vault] = await ethers.getSigners();

        const VTHO = await ethers.getContractFactory("TestERC20");
        const vtho = await VTHO.deploy("VeThor Token", "VTHO");
        await vtho.waitForDeployment();

        const SL4Y = await ethers.getContractFactory("TestERC20");
        const sl4y = await SL4Y.deploy("SLAY Token", "SL4Y");
        await sl4y.waitForDeployment();


        const SlayMinter = await ethers.getContractFactory("SL4YMinter");
        const slayMinter = await upgrades.deployProxy(SlayMinter, [await vtho.getAddress(), await sl4y.getAddress(), vault.address], { kind: 'uups' }) as unknown as SL4YMinter;
        await slayMinter.waitForDeployment();

        return { slayMinter, owner, anon, vtho, sl4y, vault };
    }

    describe("Deployment", function () {
        it("sets SL4Y address correctly", async function () {
            const { slayMinter, sl4y } = await loadFixture(deployFixture);

            expect(await slayMinter.SL4Y()).to.equal(await sl4y.getAddress());
        });

        it("sets VTHO address correctly", async function () {
            const { slayMinter, vtho } = await loadFixture(deployFixture);

            expect(await slayMinter.VTHO()).to.equal(await vtho.getAddress());
        });

        it("sets Vault address correctly", async function () {
            const { slayMinter, vault } = await loadFixture(deployFixture);

            expect(await slayMinter.vault()).to.equal(vault);
        });
    });

    describe("setSL4YAddress(SL4YAddress)", function () {
        it("should allow ADMIN_ROLE to set SL4Y address", async function () {
            const { slayMinter, sl4y, owner } = await loadFixture(deployFixture);
            const NewSL4Y = await ethers.getContractFactory("TestERC20");
            const newSl4y = await NewSL4Y.deploy("New SLAY Token", "NSL4Y");
            await newSl4y.waitForDeployment();

            const newAddress = await newSl4y.getAddress()
            const oldAddress = await sl4y.getAddress()
            await expect(slayMinter.setSL4YAddress(newAddress))
                .to.emit(slayMinter, 'SL4YAddressChanged')
                .withArgs(oldAddress, newAddress);

            expect(await slayMinter.SL4Y()).to.equal(newAddress);
        });

        it("should revert if non-ADMIN_ROLE tries to set SL4Y address", async function () {
            const { slayMinter, anon } = await loadFixture(deployFixture);
            const NewSL4Y = await ethers.getContractFactory("TestERC20");
            const newSl4y = await NewSL4Y.deploy("New SLAY Token", "NSL4Y");
            await newSl4y.waitForDeployment();

            const ADMIN_ROLE = await slayMinter.ADMIN_ROLE();
            await expect(slayMinter.connect(anon).setSL4YAddress(await newSl4y.getAddress()))
                .to.be.revertedWith("AccessControl: account " + anon.address.toLowerCase() + " is missing role " + ADMIN_ROLE);
        });
    });


    describe("setVaultAddress(SL4YAddress)", function () {
        it("should allow ADMIN_ROLE to set SL4Y address", async function () {
            const { slayMinter, vault, anon } = await loadFixture(deployFixture);

            await expect(slayMinter.setVaultAddress(anon.address))
                .to.emit(slayMinter, 'VaultAddressChanged')
                .withArgs(vault.address, anon.address);

            expect(await slayMinter.vault()).to.equal(anon.address);
        });

        it("should revert if non-ADMIN_ROLE tries to set SL4Y address", async function () {
            const { slayMinter, anon } = await loadFixture(deployFixture);

            const ADMIN_ROLE = await slayMinter.ADMIN_ROLE();
            await expect(slayMinter.connect(anon).setVaultAddress(anon.address))
                .to.be.revertedWith("AccessControl: account " + anon.address.toLowerCase() + " is missing role " + ADMIN_ROLE);
        });
    });


    describe("setSwapRate(VTHOAmount, SL4YAmount)", function () {
        it("should allow ADMIN_ROLE to set swap rates", async function () {
            const { slayMinter, owner } = await loadFixture(deployFixture);
            const VTHOAmount = ethers.parseUnits("5000", "ether");
            const SL4YAmount = ethers.parseUnits("50", "ether");

            await expect(slayMinter.setSwapRate(VTHOAmount, SL4YAmount))
                .to.emit(slayMinter, 'SwapRateChanged')
                .withArgs(VTHOAmount, SL4YAmount);

            expect(await slayMinter.swapRates(VTHOAmount)).to.equal(SL4YAmount);
        });

        it("should revert if non-ADMIN_ROLE tries to set swap rates", async function () {
            const { slayMinter, anon } = await loadFixture(deployFixture);
            const VTHOAmount = ethers.parseUnits("5000", "ether");
            const SL4YAmount = ethers.parseUnits("50", "ether");

            const ADMIN_ROLE = await slayMinter.ADMIN_ROLE();
            await expect(slayMinter.connect(anon).setSwapRate(VTHOAmount, SL4YAmount))
                .to.be.revertedWith("AccessControl: account " + anon.address.toLowerCase() + " is missing role " + ADMIN_ROLE);
        });
    });

    describe("swapVTHOforSL4Y(_VTHOAmount)", function () {
        it("should allow swapping VTHO for SL4Y at defined rate", async function () {
            const { slayMinter, sl4y, vtho, owner } = await loadFixture(deployFixture);
            const VTHOAmount = ethers.parseUnits("5000", "ether");
            const SL4YAmountExpected = ethers.parseUnits("50", "ether");

            await slayMinter.setSwapRate(VTHOAmount, SL4YAmountExpected)
            await vtho.mint(owner.address, VTHOAmount);
            await vtho.connect(owner).approve(await slayMinter.getAddress(), VTHOAmount);
            await expect(slayMinter.swapVTHOforSL4Y(VTHOAmount))
                .to.emit(slayMinter, 'SL4YMinted')
                .withArgs(owner.address, VTHOAmount, SL4YAmountExpected);

            expect(await sl4y.balanceOf(owner.address)).to.equal(SL4YAmountExpected);
        });

        it("should transfer VTHO to vault on swap", async function () {
            const { slayMinter, vtho, owner, vault } = await loadFixture(deployFixture);
            const VTHOAmount = ethers.parseUnits("5000", "ether");
            const SL4YAmountExpected = ethers.parseUnits("50", "ether");

            await slayMinter.setSwapRate(VTHOAmount, SL4YAmountExpected)
            await vtho.mint(owner.address, VTHOAmount);
            await vtho.connect(owner).approve(await slayMinter.getAddress(), VTHOAmount);

            const initialVaultBalance = await vtho.balanceOf(vault.address);
            await slayMinter.swapVTHOforSL4Y(VTHOAmount);
            const finalVaultBalance = await vtho.balanceOf(vault.address);

            expect(finalVaultBalance - initialVaultBalance).to.equal(VTHOAmount);
        });

        it("should revert if swap rate is not defined", async function () {
            const { slayMinter } = await loadFixture(deployFixture);
            const VTHOAmount = ethers.parseUnits("1", "ether"); // Undefined rate

            await expect(slayMinter.swapVTHOforSL4Y(VTHOAmount))
                .to.be.revertedWith("Swap rate not defined");
        });
    });

    describe("claimToken(_tokenAddress, _amount)", function () {
        it("should allow admin to claim specified token amount", async function () {
            const { slayMinter, vtho, owner } = await loadFixture(deployFixture);
            const claimAmount = ethers.parseUnits("100", "ether");

            const tokenAddress = await vtho.getAddress();
            await vtho.mint(await slayMinter.getAddress(), ethers.parseUnits("1000", "ether"));
            await expect(() => slayMinter.claimToken(tokenAddress, claimAmount))
                .to.changeTokenBalances(vtho, [slayMinter, owner], [-claimAmount, claimAmount]);

            await expect(slayMinter.claimToken(tokenAddress, claimAmount))
                .to.emit(slayMinter, 'TokenClaimed')
                .withArgs(tokenAddress, owner.address, claimAmount);
        });

        it("should revert if non-admin tries to claim tokens", async function () {
            const { slayMinter, sl4y, anon } = await loadFixture(deployFixture);
            const claimAmount = ethers.parseUnits("100", "ether");

            const sl4yAddress = await sl4y.getAddress();
            const ADMIN_ROLE = await slayMinter.ADMIN_ROLE()
            await expect(slayMinter.connect(anon).claimToken(sl4yAddress, claimAmount))
                .to.be.revertedWith("AccessControl: account " + anon.address.toLowerCase() + " is missing role " + ADMIN_ROLE);
        });
    });

    describe("claimVet(_amount)", function () {
        it("should allow admin to claim specified VET amount", async function () {
            const { slayMinter, owner } = await loadFixture(deployFixture);
            const claimAmount = ethers.parseEther("1");

            await owner.sendTransaction({ to: await slayMinter.getAddress(), value: ethers.parseEther("10") });

            await expect(await slayMinter.claimVet(claimAmount))
                .to.changeEtherBalances([slayMinter, owner], [-claimAmount, claimAmount]);

            await expect(slayMinter.claimVet(claimAmount))
                .to.emit(slayMinter, 'VetClaimed')
                .withArgs(owner.address, claimAmount);
        });

        it("should revert if non-admin tries to claim VET", async function () {
            const { slayMinter, anon } = await loadFixture(deployFixture);
            const claimAmount = ethers.parseEther("10");

            const ADMIN_ROLE = await slayMinter.ADMIN_ROLE()
            await expect(slayMinter.connect(anon).claimVet(claimAmount))
                .to.be.revertedWith("AccessControl: account " + anon.address.toLowerCase() + " is missing role " + ADMIN_ROLE);
        });
    });
});
