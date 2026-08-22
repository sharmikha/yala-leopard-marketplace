// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LeopardMarketplace is ERC721, Ownable, ReentrancyGuard {

    // =============================================================
    // CUSTOM ERRORS
    // =============================================================

    error InvalidAddress();
    error EmptyLeopardId();
    error EmptyName();
    error EmptyImageURI();
    error InvalidPrice();
    error DuplicateLeopardId();
    error LeopardNotFound();
    error AlreadySponsored();
    error IncorrectPayment();
    error CurrentOwnerCannotSponsor();
    error NotCertificateOwner();
    error NotSponsored();
    error NotForSale();
    error AlreadyForSale();
    error CannotBuyOwnCertificate();
    error CannotTransferToSelf();
    error ConservationPaymentFailed();
    error SellerPaymentFailed();
    error SameConservationFund();
    error DirectTransferDisabled();

    // =============================================================
    // ENUM
    // =============================================================

    enum TransactionType {
        MINT,
        SPONSORSHIP,
        TRANSFER,
        RESALE
    }

    // =============================================================
    // DATA STRUCTURES
    // =============================================================

    struct Leopard {
        uint256 tokenId;
        string leopardId;
        string name;
        string territory;
        string description;
        string conservationStatus;
        string imageURI;
        uint256 price;
        bool sponsored;
        bool forSale;
    }

    struct OwnershipRecord {
        address from;
        address to;
        uint256 price;
        uint256 timestamp;
        TransactionType transactionType;
    }

    // =============================================================
    // STATE VARIABLES
    // =============================================================

    address payable public conservationFund;

    uint256 public totalAssets;
    uint256 public totalTransactions;

    mapping(uint256 => Leopard) private leopards;
    mapping(string => bool) private leopardIdExists;
    mapping(uint256 => OwnershipRecord[]) private ownershipHistory;

    address[] private participants;
    mapping(address => bool) private knownParticipant;

    // Used to ensure ownership changes only happen through
    // approved marketplace functions.
    bool private marketplaceTransfer;

    // =============================================================
    // EVENTS
    // =============================================================

    event LeopardRegistered(
        uint256 indexed tokenId,
        string leopardId,
        string name,
        uint256 price
    );

    event LeopardSponsored(
        uint256 indexed tokenId,
        address indexed sponsor,
        uint256 price
    );

    event CertificateListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event SaleCancelled(
        uint256 indexed tokenId,
        address indexed owner
    );

    event CertificateResold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    event CertificateTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    event ConservationFundUpdated(
        address indexed oldFund,
        address indexed newFund
    );

    // =============================================================
    // CONSTRUCTOR
    // =============================================================

    constructor(address payable _conservationFund)
        ERC721("Yala Leopard Sponsorship Certificate", "YLSC")
        Ownable(msg.sender)
    {
        if (_conservationFund == address(0)) {
            revert InvalidAddress();
        }

        conservationFund = _conservationFund;
    }

    // =============================================================
    // REGISTER LEOPARD
    // =============================================================

    function registerLeopard(
        string calldata _leopardId,
        string calldata _name,
        string calldata _territory,
        string calldata _description,
        string calldata _conservationStatus,
        string calldata _imageURI,
        uint256 _sponsorshipPrice
    ) external onlyOwner {
        if (bytes(_leopardId).length == 0) {
            revert EmptyLeopardId();
        }

        if (bytes(_name).length == 0) {
            revert EmptyName();
        }

        if (bytes(_imageURI).length == 0) {
            revert EmptyImageURI();
        }

        if (_sponsorshipPrice == 0) {
            revert InvalidPrice();
        }

        if (leopardIdExists[_leopardId]) {
            revert DuplicateLeopardId();
        }

        unchecked {
            totalAssets++;
        }

        uint256 tokenId = totalAssets;

        leopards[tokenId] = Leopard({
            tokenId: tokenId,
            leopardId: _leopardId,
            name: _name,
            territory: _territory,
            description: _description,
            conservationStatus: _conservationStatus,
            imageURI: _imageURI,
            price: _sponsorshipPrice,
            sponsored: false,
            forSale: false
        });

        leopardIdExists[_leopardId] = true;

        // Mint the sponsorship certificate initially to the admin.
        _safeMint(msg.sender, tokenId);

        // Include the admin in holder tracking.
        _addParticipant(msg.sender);

        ownershipHistory[tokenId].push(
            OwnershipRecord({
                from: address(0),
                to: msg.sender,
                price: 0,
                timestamp: block.timestamp,
                transactionType: TransactionType.MINT
            })
        );

        emit LeopardRegistered(
            tokenId,
            _leopardId,
            _name,
            _sponsorshipPrice
        );
    }

    // =============================================================
    // INITIAL SPONSORSHIP
    // =============================================================

    function sponsorLeopard(uint256 _tokenId)
        external
        payable
        nonReentrant
    {
        _requireExists(_tokenId);

        Leopard storage leopard = leopards[_tokenId];

        if (leopard.sponsored) {
            revert AlreadySponsored();
        }

        if (msg.value != leopard.price) {
            revert IncorrectPayment();
        }

        address currentOwner = ownerOf(_tokenId);

        if (msg.sender == currentOwner) {
            revert CurrentOwnerCannotSponsor();
        }

        leopard.sponsored = true;
        leopard.forSale = false;

        _controlledTransfer(
            currentOwner,
            msg.sender,
            _tokenId
        );

        _addParticipant(msg.sender);

        ownershipHistory[_tokenId].push(
            OwnershipRecord({
                from: currentOwner,
                to: msg.sender,
                price: msg.value,
                timestamp: block.timestamp,
                transactionType: TransactionType.SPONSORSHIP
            })
        );

        unchecked {
            totalTransactions++;
        }

        // Initial sponsorship:
        // 100% of the payment goes to the Conservation Fund.
        (bool success, ) = conservationFund.call{
            value: msg.value
        }("");

        if (!success) {
            revert ConservationPaymentFailed();
        }

        emit LeopardSponsored(
            _tokenId,
            msg.sender,
            msg.value
        );
    }

    // =============================================================
    // LIST CERTIFICATE FOR RESALE
    // =============================================================

    function listForSale(
        uint256 _tokenId,
        uint256 _resalePrice
    ) external {
        _requireExists(_tokenId);

        if (ownerOf(_tokenId) != msg.sender) {
            revert NotCertificateOwner();
        }

        Leopard storage leopard = leopards[_tokenId];

        if (!leopard.sponsored) {
            revert NotSponsored();
        }

        if (leopard.forSale) {
            revert AlreadyForSale();
        }

        if (_resalePrice == 0) {
            revert InvalidPrice();
        }

        leopard.price = _resalePrice;
        leopard.forSale = true;

        emit CertificateListed(
            _tokenId,
            msg.sender,
            _resalePrice
        );
    }

    // =============================================================
    // CANCEL RESALE LISTING
    // =============================================================

    function cancelSale(uint256 _tokenId) external {
        _requireExists(_tokenId);

        if (ownerOf(_tokenId) != msg.sender) {
            revert NotCertificateOwner();
        }

        Leopard storage leopard = leopards[_tokenId];

        if (!leopard.forSale) {
            revert NotForSale();
        }

        leopard.forSale = false;

        emit SaleCancelled(
            _tokenId,
            msg.sender
        );
    }

    // =============================================================
    // SECONDARY RESALE
    // =============================================================

    function purchaseResale(uint256 _tokenId)
        external
        payable
        nonReentrant
    {
        _requireExists(_tokenId);

        Leopard storage leopard = leopards[_tokenId];

        if (!leopard.forSale) {
            revert NotForSale();
        }

        address seller = ownerOf(_tokenId);

        if (msg.sender == seller) {
            revert CannotBuyOwnCertificate();
        }

        if (msg.value != leopard.price) {
            revert IncorrectPayment();
        }

        // 10% conservation contribution.
        uint256 conservationShare = msg.value / 10;

        // Remaining 90% goes to the seller.
        uint256 sellerShare = msg.value - conservationShare;

        leopard.forSale = false;

        _controlledTransfer(
            seller,
            msg.sender,
            _tokenId
        );

        _addParticipant(msg.sender);

        ownershipHistory[_tokenId].push(
            OwnershipRecord({
                from: seller,
                to: msg.sender,
                price: msg.value,
                timestamp: block.timestamp,
                transactionType: TransactionType.RESALE
            })
        );

        unchecked {
            totalTransactions++;
        }

        (bool sellerPaid, ) = payable(seller).call{
            value: sellerShare
        }("");

        if (!sellerPaid) {
            revert SellerPaymentFailed();
        }

        (bool conservationPaid, ) = conservationFund.call{
            value: conservationShare
        }("");

        if (!conservationPaid) {
            revert ConservationPaymentFailed();
        }

        emit CertificateResold(
            _tokenId,
            seller,
            msg.sender,
            msg.value
        );
    }

    // =============================================================
    // TRANSFER / GIFT CERTIFICATE
    // =============================================================

    function transferCertificate(
        uint256 _tokenId,
        address _recipient
    ) external {
        _requireExists(_tokenId);

        if (ownerOf(_tokenId) != msg.sender) {
            revert NotCertificateOwner();
        }

        if (_recipient == address(0)) {
            revert InvalidAddress();
        }

        if (_recipient == msg.sender) {
            revert CannotTransferToSelf();
        }

        Leopard storage leopard = leopards[_tokenId];

        if (!leopard.sponsored) {
            revert NotSponsored();
        }

        // Remove the certificate from the marketplace
        // if it was listed for resale.
        leopard.forSale = false;

        address previousOwner = msg.sender;

        _controlledTransfer(
            previousOwner,
            _recipient,
            _tokenId
        );

        _addParticipant(_recipient);

        ownershipHistory[_tokenId].push(
            OwnershipRecord({
                from: previousOwner,
                to: _recipient,
                price: 0,
                timestamp: block.timestamp,
                transactionType: TransactionType.TRANSFER
            })
        );

        unchecked {
            totalTransactions++;
        }

        emit CertificateTransferred(
            _tokenId,
            previousOwner,
            _recipient
        );
    }

    // =============================================================
    // UPDATE CONSERVATION FUND
    // =============================================================

    function updateConservationFund(
        address payable _newConservationFund
    ) external onlyOwner {
        if (_newConservationFund == address(0)) {
            revert InvalidAddress();
        }

        if (_newConservationFund == conservationFund) {
            revert SameConservationFund();
        }

        address oldFund = conservationFund;

        conservationFund = _newConservationFund;

        emit ConservationFundUpdated(
            oldFund,
            _newConservationFund
        );
    }

    // =============================================================
    // READ FUNCTIONS
    // =============================================================

    function getLeopard(
        uint256 _tokenId
    ) external view returns (Leopard memory) {
        _requireExists(_tokenId);

        return leopards[_tokenId];
    }

    function getAllLeopards()
        external
        view
        returns (Leopard[] memory)
    {
        Leopard[] memory allLeopards =
            new Leopard[](totalAssets);

        for (uint256 i = 0; i < totalAssets; ) {
            allLeopards[i] = leopards[i + 1];

            unchecked {
                ++i;
            }
        }

        return allLeopards;
    }

    function getOwnershipHistory(
        uint256 _tokenId
    )
        external
        view
        returns (OwnershipRecord[] memory)
    {
        _requireExists(_tokenId);

        return ownershipHistory[_tokenId];
    }

    function getParticipants()
        external
        view
        returns (address[] memory)
    {
        return participants;
    }

    // =============================================================
    // INTERNAL HELPERS
    // =============================================================

    function _requireExists(
        uint256 _tokenId
    ) internal view {
        if (_ownerOf(_tokenId) == address(0)) {
            revert LeopardNotFound();
        }
    }

    function _addParticipant(
        address _participant
    ) internal {
        if (!knownParticipant[_participant]) {
            knownParticipant[_participant] = true;
            participants.push(_participant);
        }
    }

    function _controlledTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal {
        marketplaceTransfer = true;

        _transfer(
            _from,
            _to,
            _tokenId
        );

        marketplaceTransfer = false;
    }

    // =============================================================
    // CONTROL ERC-721 OWNERSHIP CHANGES
    // =============================================================

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override
        returns (address)
    {
        address currentOwner = _ownerOf(tokenId);

        /*
         * Minting is allowed because a newly created token
         * does not yet have a current owner.
         *
         * Once the token exists, ownership changes are allowed
         * only through this marketplace's controlled functions.
         */
        if (
            currentOwner != address(0) &&
            !marketplaceTransfer
        ) {
            revert DirectTransferDisabled();
        }

        return super._update(
            to,
            tokenId,
            auth
        );
    }
}