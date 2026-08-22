import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LeopardMarketplaceModule = buildModule(
  "LeopardMarketplaceModule",
  (m) => {
    const conservationFund = m.getParameter(
      "conservationFund"
    );

    const leopardMarketplace = m.contract(
      "LeopardMarketplace",
      [conservationFund]
    );

    return { leopardMarketplace };
  }
);

export default LeopardMarketplaceModule;