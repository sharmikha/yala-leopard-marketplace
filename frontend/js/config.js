const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function conservationFund() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function totalTransactions() view returns (uint256)",

  "function registerLeopard(string _leopardId, string _name, string _territory, string _description, string _conservationStatus, string _imageURI, uint256 _sponsorshipPrice)",

  "function sponsorLeopard(uint256 _tokenId) payable",

  "function listForSale(uint256 _tokenId, uint256 _resalePrice)",

  "function cancelSale(uint256 _tokenId)",

  "function purchaseResale(uint256 _tokenId) payable",

  "function transferCertificate(uint256 _tokenId, address _recipient)",

  "function updateConservationFund(address _newConservationFund)",

  "function getLeopard(uint256 _tokenId) view returns (tuple(uint256 tokenId, string leopardId, string name, string territory, string description, string conservationStatus, string imageURI, uint256 price, bool sponsored, bool forSale))",

  "function getAllLeopards() view returns (tuple(uint256 tokenId, string leopardId, string name, string territory, string description, string conservationStatus, string imageURI, uint256 price, bool sponsored, bool forSale)[])",

  "function getOwnershipHistory(uint256 _tokenId) view returns (tuple(address from, address to, uint256 price, uint256 timestamp, uint8 transactionType)[])",

  "function getParticipants() view returns (address[])",

  "function ownerOf(uint256 tokenId) view returns (address)",

  "function balanceOf(address owner) view returns (uint256)"
];