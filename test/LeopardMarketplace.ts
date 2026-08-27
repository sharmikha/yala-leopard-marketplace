import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.connect();

describe("LeopardMarketplace", function () {
  async function deployMarketplace() {
    const [owner, conservationFund, sponsor, otherUser] =
      await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("LeopardMarketplace");

    const marketplace = await Marketplace.deploy(
      conservationFund.address
    );

    await marketplace.waitForDeployment();

    return {
      marketplace,
      owner,
      conservationFund,
      sponsor,
      otherUser,
    };
  }

  describe("Deployment", function () {
    it("should set the deployer as the contract owner", async function () {
      const { marketplace, owner } =
        await deployMarketplace();

      expect(
        await marketplace.owner()
      ).to.equal(owner.address);
    });

    it("should set the correct conservation fund address", async function () {
      const {
        marketplace,
        conservationFund,
      } = await deployMarketplace();

      expect(
        await marketplace.conservationFund()
      ).to.equal(conservationFund.address);
    });

    it("should start with zero assets", async function () {
      const { marketplace } =
        await deployMarketplace();

      expect(
        await marketplace.totalAssets()
      ).to.equal(0n);
    });

    it("should start with zero transactions", async function () {
      const { marketplace } =
        await deployMarketplace();

      expect(
        await marketplace.totalTransactions()
      ).to.equal(0n);
    });
  });

  describe("Leopard Registration", function () {
    it("should allow the owner to register a leopard", async function () {
      const { marketplace, owner } =
        await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.tokenId).to.equal(1n);
      expect(leopard.leopardId).to.equal("YL-001");
      expect(leopard.name).to.equal("Natta");
      expect(leopard.territory).to.equal(
        "Yala Block 1"
      );
      expect(leopard.description).to.equal(
        "Adult male leopard"
      );
      expect(leopard.conservationStatus).to.equal(
        "Monitored"
      );
      expect(leopard.imageURI).to.equal(
        "https://example.com/natta.jpg"
      );
      expect(leopard.price).to.equal(
        sponsorshipPrice
      );
      expect(leopard.sponsored).to.equal(false);
      expect(leopard.forSale).to.equal(false);

      expect(
        await marketplace.ownerOf(1)
      ).to.equal(owner.address);

      expect(
        await marketplace.totalAssets()
      ).to.equal(1n);
    });

    it("should reject registration from a non-owner", async function () {
      const {
        marketplace,
        sponsor,
      } = await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await expect(
        marketplace
          .connect(sponsor)
          .registerLeopard(
            "YL-002",
            "Kuma",
            "Yala Block 2",
            "Adult female leopard",
            "Monitored",
            "https://example.com/kuma.jpg",
            sponsorshipPrice
          )
      ).to.be.revert(ethers);
    });

    it("should reject duplicate leopard IDs", async function () {
      const { marketplace } =
        await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      await expect(
        marketplace.registerLeopard(
          "YL-001",
          "Duplicate Leopard",
          "Yala Block 3",
          "Duplicate record",
          "Monitored",
          "https://example.com/duplicate.jpg",
          sponsorshipPrice
        )
      ).to.be.revertedWithCustomError(
        marketplace,
        "DuplicateLeopardId"
      );
    });

    it("should reject a zero sponsorship price", async function () {
      const { marketplace } =
        await deployMarketplace();

      await expect(
        marketplace.registerLeopard(
          "YL-003",
          "Sena",
          "Yala Block 3",
          "Adult leopard",
          "Monitored",
          "https://example.com/sena.jpg",
          0
        )
      ).to.be.revertedWithCustomError(
        marketplace,
        "InvalidPrice"
      );
    });

    it("should record the mint in ownership history", async function () {
      const { marketplace, owner } =
        await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      const history =
        await marketplace.getOwnershipHistory(1);

      expect(history.length).to.equal(1);

      expect(history[0].from).to.equal(
        ethers.ZeroAddress
      );

      expect(history[0].to).to.equal(
        owner.address
      );

      expect(history[0].price).to.equal(0n);

      expect(
        history[0].transactionType
      ).to.equal(0n);
    });
  });

  describe("Initial Sponsorship", function () {
    async function registerTestLeopard() {
      const {
        marketplace,
        owner,
        conservationFund,
        sponsor,
        otherUser,
      } = await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      return {
        marketplace,
        owner,
        conservationFund,
        sponsor,
        otherUser,
        sponsorshipPrice,
      };
    }

    it("should allow a user to sponsor an available leopard", async function () {
      const {
        marketplace,
        sponsor,
        sponsorshipPrice,
      } = await registerTestLeopard();

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.sponsored).to.equal(true);
      expect(leopard.forSale).to.equal(false);
    });

    it("should transfer the certificate to the sponsor", async function () {
      const {
        marketplace,
        sponsor,
        sponsorshipPrice,
      } = await registerTestLeopard();

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      expect(
        await marketplace.ownerOf(1)
      ).to.equal(sponsor.address);
    });

    it("should increase total transactions after sponsorship", async function () {
      const {
        marketplace,
        sponsor,
        sponsorshipPrice,
      } = await registerTestLeopard();

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      expect(
        await marketplace.totalTransactions()
      ).to.equal(1n);
    });

    it("should send 100% of the sponsorship payment to the conservation fund", async function () {
      const {
        marketplace,
        conservationFund,
        sponsor,
        sponsorshipPrice,
      } = await registerTestLeopard();

      const balanceBefore =
        await ethers.provider.getBalance(
          conservationFund.address
        );

      const tx = await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      await tx.wait();

      const balanceAfter =
        await ethers.provider.getBalance(
          conservationFund.address
        );

      expect(
        balanceAfter - balanceBefore
      ).to.equal(sponsorshipPrice);
    });

    it("should add the sponsor to participant tracking", async function () {
      const {
        marketplace,
        sponsor,
        sponsorshipPrice,
      } = await registerTestLeopard();

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      const participants =
        await marketplace.getParticipants();

      expect(
        participants
      ).to.include(sponsor.address);
    });

    it("should record sponsorship in ownership history", async function () {
      const {
        marketplace,
        owner,
        sponsor,
        sponsorshipPrice,
      } = await registerTestLeopard();

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      const history =
        await marketplace.getOwnershipHistory(1);

      expect(history.length).to.equal(2);

      const sponsorshipRecord =
        history[1];

      expect(
        sponsorshipRecord.from
      ).to.equal(owner.address);

      expect(
        sponsorshipRecord.to
      ).to.equal(sponsor.address);

      expect(
        sponsorshipRecord.price
      ).to.equal(sponsorshipPrice);

      expect(
        sponsorshipRecord.transactionType
      ).to.equal(1n);
    });

    it("should reject an incorrect sponsorship payment", async function () {
      const {
        marketplace,
        sponsor,
      } = await registerTestLeopard();

      const wrongAmount =
        ethers.parseEther("0.005");

      await expect(
        marketplace
          .connect(sponsor)
          .sponsorLeopard(
            1,
            { value: wrongAmount }
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "IncorrectPayment"
      );
    });

    it("should reject a sponsorship payment above the required price", async function () {
      const {
        marketplace,
        sponsor,
      } = await registerTestLeopard();

      const overpayment =
        ethers.parseEther("0.02");

      await expect(
        marketplace
          .connect(sponsor)
          .sponsorLeopard(
            1,
            { value: overpayment }
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "IncorrectPayment"
      );
    });

    it("should reject a second sponsorship attempt", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
        sponsorshipPrice,
      } = await registerTestLeopard();

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      await expect(
        marketplace
          .connect(otherUser)
          .sponsorLeopard(
            1,
            { value: sponsorshipPrice }
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "AlreadySponsored"
      );
    });
  });

  describe("Listing, Cancellation, and Secondary Resale", function () {
    async function prepareSponsoredLeopard() {
      const {
        marketplace,
        owner,
        conservationFund,
        sponsor,
        otherUser,
      } = await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      return {
        marketplace,
        owner,
        conservationFund,
        sponsor,
        otherUser,
        sponsorshipPrice,
      };
    }

    it("should allow the certificate owner to list for resale", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.forSale).to.equal(true);
      expect(leopard.price).to.equal(resalePrice);
    });

    it("should reject listing a certificate that is already listed", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      const firstPrice =
        ethers.parseEther("0.02");

      const secondPrice =
        ethers.parseEther("0.03");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          firstPrice
        );

      await expect(
        marketplace
          .connect(sponsor)
          .listForSale(
            1,
            secondPrice
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "AlreadyForSale"
      );

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.forSale).to.equal(true);
      expect(leopard.price).to.equal(firstPrice);
    });

    it("should reject a resale listing from a non-owner", async function () {
      const {
        marketplace,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await expect(
        marketplace
          .connect(otherUser)
          .listForSale(
            1,
            resalePrice
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "NotCertificateOwner"
      );
    });

    it("should reject a zero resale price", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace
          .connect(sponsor)
          .listForSale(
            1,
            0
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "InvalidPrice"
      );
    });

    it("should allow the owner to cancel a resale listing", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      await marketplace
        .connect(sponsor)
        .cancelSale(1);

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.forSale).to.equal(false);
    });

    it("should emit SaleCancelled when the owner cancels a resale listing", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      await expect(
        marketplace
          .connect(sponsor)
          .cancelSale(1)
      )
        .to.emit(
          marketplace,
          "SaleCancelled"
        )
        .withArgs(
          1n,
          sponsor.address
        );
    });

    it("should reject cancellation from a non-owner", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      await expect(
        marketplace
          .connect(otherUser)
          .cancelSale(1)
      ).to.be.revertedWithCustomError(
        marketplace,
        "NotCertificateOwner"
      );
    });

    it("should reject cancellation when the certificate is not listed", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace
          .connect(sponsor)
          .cancelSale(1)
      ).to.be.revertedWithCustomError(
        marketplace,
        "NotForSale"
      );

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.forSale).to.equal(false);
    });

    it("should allow another user to purchase a listed certificate", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      await marketplace
        .connect(otherUser)
        .purchaseResale(
          1,
          { value: resalePrice }
        );

      expect(
        await marketplace.ownerOf(1)
      ).to.equal(otherUser.address);

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.forSale).to.equal(false);
    });

    it("should send 90% of resale payment to the seller", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      const sellerBalanceBefore =
        await ethers.provider.getBalance(
          sponsor.address
        );

      await marketplace
        .connect(otherUser)
        .purchaseResale(
          1,
          { value: resalePrice }
        );

      const sellerBalanceAfter =
        await ethers.provider.getBalance(
          sponsor.address
        );

      const expectedSellerShare =
        (resalePrice * 90n) / 100n;

      expect(
        sellerBalanceAfter -
        sellerBalanceBefore
      ).to.equal(expectedSellerShare);
    });

    it("should send 10% of resale payment to the conservation fund", async function () {
      const {
        marketplace,
        conservationFund,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      const conservationBalanceBefore =
        await ethers.provider.getBalance(
          conservationFund.address
        );

      await marketplace
        .connect(otherUser)
        .purchaseResale(
          1,
          { value: resalePrice }
        );

      const conservationBalanceAfter =
        await ethers.provider.getBalance(
          conservationFund.address
        );

      const expectedConservationShare =
        resalePrice / 10n;

      expect(
        conservationBalanceAfter -
        conservationBalanceBefore
      ).to.equal(expectedConservationShare);
    });

    it("should increase total transactions after resale", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      await marketplace
        .connect(otherUser)
        .purchaseResale(
          1,
          { value: resalePrice }
        );

      expect(
        await marketplace.totalTransactions()
      ).to.equal(2n);
    });

    it("should record the resale in ownership history", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      await marketplace
        .connect(otherUser)
        .purchaseResale(
          1,
          { value: resalePrice }
        );

      const history =
        await marketplace.getOwnershipHistory(1);

      expect(history.length).to.equal(3);

      const resaleRecord =
        history[2];

      expect(
        resaleRecord.from
      ).to.equal(sponsor.address);

      expect(
        resaleRecord.to
      ).to.equal(otherUser.address);

      expect(
        resaleRecord.price
      ).to.equal(resalePrice);

      expect(
        resaleRecord.transactionType
      ).to.equal(3n);
    });

    it("should reject an incorrect resale payment", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await marketplace
        .connect(sponsor)
        .listForSale(
          1,
          resalePrice
        );

      const wrongAmount =
        ethers.parseEther("0.01");

      await expect(
        marketplace
          .connect(otherUser)
          .purchaseResale(
            1,
            { value: wrongAmount }
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "IncorrectPayment"
      );
    });

    it("should reject resale when the certificate is not listed", async function () {
      const {
        marketplace,
        otherUser,
      } = await prepareSponsoredLeopard();

      const resalePrice =
        ethers.parseEther("0.02");

      await expect(
        marketplace
          .connect(otherUser)
          .purchaseResale(
            1,
            { value: resalePrice }
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "NotForSale"
      );
    });
  });

  describe("Transfer / Gift and Conservation Fund", function () {
    async function prepareSponsoredLeopard() {
      const {
        marketplace,
        owner,
        conservationFund,
        sponsor,
        otherUser,
      } = await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      return {
        marketplace,
        owner,
        conservationFund,
        sponsor,
        otherUser,
        sponsorshipPrice,
      };
    }

    it("should allow the certificate owner to transfer the certificate", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      await marketplace
        .connect(sponsor)
        .transferCertificate(
          1,
          otherUser.address
        );

      expect(
        await marketplace.ownerOf(1)
      ).to.equal(otherUser.address);
    });

    it("should reject transfer from a non-owner", async function () {
      const {
        marketplace,
        otherUser,
        owner,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace
          .connect(otherUser)
          .transferCertificate(
            1,
            owner.address
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "NotCertificateOwner"
      );
    });

    it("should reject transfer to the zero address", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace
          .connect(sponsor)
          .transferCertificate(
            1,
            ethers.ZeroAddress
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "InvalidAddress"
      );
    });

    it("should reject transfer to the same owner", async function () {
      const {
        marketplace,
        sponsor,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace
          .connect(sponsor)
          .transferCertificate(
            1,
            sponsor.address
          )
      ).to.be.revertedWithCustomError(
        marketplace,
        "CannotTransferToSelf"
      );
    });

    it("should increase total transactions after transfer", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      await marketplace
        .connect(sponsor)
        .transferCertificate(
          1,
          otherUser.address
        );

      expect(
        await marketplace.totalTransactions()
      ).to.equal(2n);
    });

    it("should record the transfer in ownership history", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      await marketplace
        .connect(sponsor)
        .transferCertificate(
          1,
          otherUser.address
        );

      const history =
        await marketplace.getOwnershipHistory(1);

      expect(history.length).to.equal(3);

      const transferRecord =
        history[2];

      expect(
        transferRecord.from
      ).to.equal(sponsor.address);

      expect(
        transferRecord.to
      ).to.equal(otherUser.address);

      expect(
        transferRecord.price
      ).to.equal(0n);

      expect(
        transferRecord.transactionType
      ).to.equal(2n);
    });

    it("should add the transfer recipient to participant tracking", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      await marketplace
        .connect(sponsor)
        .transferCertificate(
          1,
          otherUser.address
        );

      const participants =
        await marketplace.getParticipants();

      expect(
        participants
      ).to.include(otherUser.address);
    });

    it("should allow the owner to update the conservation fund", async function () {
      const {
        marketplace,
        otherUser,
      } = await prepareSponsoredLeopard();

      await marketplace.updateConservationFund(
        otherUser.address
      );

      expect(
        await marketplace.conservationFund()
      ).to.equal(otherUser.address);
    });

    it("should reject conservation fund update from a non-owner", async function () {
      const {
        marketplace,
        sponsor,
        otherUser,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace
          .connect(sponsor)
          .updateConservationFund(
            otherUser.address
          )
      ).to.be.revert(ethers);
    });

    it("should reject zero address as conservation fund", async function () {
      const {
        marketplace,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace.updateConservationFund(
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(
        marketplace,
        "InvalidAddress"
      );
    });

    it("should reject setting the same conservation fund again", async function () {
      const {
        marketplace,
        conservationFund,
      } = await prepareSponsoredLeopard();

      await expect(
        marketplace.updateConservationFund(
          conservationFund.address
        )
      ).to.be.revertedWithCustomError(
        marketplace,
        "SameConservationFund"
      );
    });
  });

  describe("Read Functions", function () {
    it("should return all registered leopards", async function () {
      const { marketplace } =
        await deployMarketplace();

      const priceOne =
        ethers.parseEther("0.01");

      const priceTwo =
        ethers.parseEther("0.02");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        priceOne
      );

      await marketplace.registerLeopard(
        "YL-002",
        "Kuma",
        "Yala Block 2",
        "Adult female leopard",
        "Monitored",
        "https://example.com/kuma.jpg",
        priceTwo
      );

      const leopards =
        await marketplace.getAllLeopards();

      expect(leopards.length).to.equal(2);

      expect(
        leopards[0].tokenId
      ).to.equal(1n);

      expect(
        leopards[0].leopardId
      ).to.equal("YL-001");

      expect(
        leopards[0].name
      ).to.equal("Natta");

      expect(
        leopards[0].price
      ).to.equal(priceOne);

      expect(
        leopards[1].tokenId
      ).to.equal(2n);

      expect(
        leopards[1].leopardId
      ).to.equal("YL-002");

      expect(
        leopards[1].name
      ).to.equal("Kuma");

      expect(
        leopards[1].price
      ).to.equal(priceTwo);
    });

    it("should return the correct leopard by token ID", async function () {
      const { marketplace } =
        await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      const leopard =
        await marketplace.getLeopard(1);

      expect(leopard.tokenId).to.equal(1n);
      expect(leopard.leopardId).to.equal("YL-001");
      expect(leopard.name).to.equal("Natta");
      expect(leopard.territory).to.equal(
        "Yala Block 1"
      );
      expect(leopard.description).to.equal(
        "Adult male leopard"
      );
      expect(
        leopard.conservationStatus
      ).to.equal("Monitored");
      expect(leopard.imageURI).to.equal(
        "https://example.com/natta.jpg"
      );
      expect(leopard.price).to.equal(
        sponsorshipPrice
      );
    });

    it("should reject reading a leopard that does not exist", async function () {
      const { marketplace } =
        await deployMarketplace();

      await expect(
        marketplace.getLeopard(999)
      ).to.be.revertedWithCustomError(
        marketplace,
        "LeopardNotFound"
      );
    });

    it("should return ownership history for a sponsored leopard", async function () {
      const {
        marketplace,
        sponsor,
      } = await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      const history =
        await marketplace.getOwnershipHistory(1);

      expect(history.length).to.equal(2);

      expect(
        history[0].transactionType
      ).to.equal(0n);

      expect(
        history[1].transactionType
      ).to.equal(1n);
    });

    it("should return participant addresses", async function () {
      const {
        marketplace,
        owner,
        sponsor,
      } = await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      await marketplace
        .connect(sponsor)
        .sponsorLeopard(
          1,
          { value: sponsorshipPrice }
        );

      const participants =
        await marketplace.getParticipants();

      expect(
        participants
      ).to.include(owner.address);

      expect(
        participants
      ).to.include(sponsor.address);
    });

    it("should maintain the correct total asset count", async function () {
      const { marketplace } =
        await deployMarketplace();

      const sponsorshipPrice =
        ethers.parseEther("0.01");

      await marketplace.registerLeopard(
        "YL-001",
        "Natta",
        "Yala Block 1",
        "Adult male leopard",
        "Monitored",
        "https://example.com/natta.jpg",
        sponsorshipPrice
      );

      await marketplace.registerLeopard(
        "YL-002",
        "Kuma",
        "Yala Block 2",
        "Adult female leopard",
        "Monitored",
        "https://example.com/kuma.jpg",
        sponsorshipPrice
      );

      expect(
        await marketplace.totalAssets()
      ).to.equal(2n);
    });
  });
});