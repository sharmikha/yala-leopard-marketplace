// ============================================================
// MY SPONSORSHIPS
// ============================================================

async function loadMySponsorships() {
  const sponsorshipsGrid =
    document.getElementById("mySponsorshipsGrid");

  if (!sponsorshipsGrid) {
    console.warn(
      "mySponsorshipsGrid element not found."
    );
    return;
  }

  showSponsorshipsStatus(
    "Loading your sponsorship certificates...",
    false
  );

  try {
    const account =
      await getConnectedAccount();

    if (!account) {
      sponsorshipsGrid.innerHTML = `
        <div class="empty-sponsorships">
          <p>
            Connect your MetaMask wallet to view
            your sponsorship certificates.
          </p>
        </div>
      `;

      showSponsorshipsStatus(
        "Please connect your MetaMask wallet.",
        true
      );

      return;
    }

    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showSponsorshipsStatus(
        "Unable to connect to the smart contract.",
        true
      );
      return;
    }

    const leopards =
      await marketplaceContract.getAllLeopards();

    sponsorshipsGrid.innerHTML = "";

    const ownedLeopards = [];

    for (const leopard of leopards) {
      const tokenId =
        Number(leopard.tokenId);

      const currentOwner =
        await marketplaceContract.ownerOf(
          tokenId
        );

      if (
        currentOwner.toLowerCase() ===
        account.toLowerCase()
      ) {
        ownedLeopards.push({
          leopard,
          currentOwner,
        });
      }
    }

    if (ownedLeopards.length === 0) {
      sponsorshipsGrid.innerHTML = `
        <div class="empty-sponsorships">
          <p>
            You do not currently own any
            sponsorship certificates.
          </p>
        </div>
      `;

      showSponsorshipsStatus("", false);
      return;
    }

    for (const item of ownedLeopards) {
      const card =
        createSponsorshipCard(
          item.leopard
        );

      sponsorshipsGrid.appendChild(card);
    }

    showSponsorshipsStatus("", false);

  } catch (error) {
    console.error(
      "Failed to load sponsorship certificates:",
      error
    );

    showSponsorshipsStatus(
      "Could not load your sponsorship certificates.",
      true
    );
  }
}


// ============================================================
// CREATE SPONSORSHIP CARD
// ============================================================

function createSponsorshipCard(leopard) {
  const tokenId =
    Number(leopard.tokenId);

  const priceEth =
    ethers.formatEther(leopard.price);

  const card =
    document.createElement("div");

  card.className =
    "sponsorship-card";

  let saleSection = "";

  if (leopard.forSale) {
    saleSection = `
      <p>
        <strong>Marketplace Status:</strong>
        Listed for Resale
      </p>

      <p>
        <strong>Resale Price:</strong>
        ${priceEth} ETH
      </p>

      <button
        type="button"
        class="cancel-sale-btn"
        data-token-id="${tokenId}"
      >
        Cancel Sale
      </button>
    `;
  } else {
    saleSection = `
      <p>
        <strong>Marketplace Status:</strong>
        Not Listed
      </p>

      <div class="resale-form">
        <input
          type="number"
          id="resalePrice-${tokenId}"
          placeholder="Resale price in ETH"
          min="0"
          step="0.001"
        >

        <button
          type="button"
          class="list-sale-btn"
          data-token-id="${tokenId}"
        >
          List for Resale
        </button>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="sponsorship-image-wrapper">
      <img
        src="${escapeSponsorshipHTML(
          leopard.imageURI
        )}"
        alt="${escapeSponsorshipHTML(
          leopard.name
        )}"
        class="sponsorship-image"
      >
    </div>

    <div class="sponsorship-card-body">

      <h3>
        ${escapeSponsorshipHTML(
          leopard.name
        )}
      </h3>

      <p>
        <strong>Certificate Token:</strong>
        #${tokenId}
      </p>

      <p>
        <strong>Leopard ID:</strong>
        ${escapeSponsorshipHTML(
          leopard.leopardId
        )}
      </p>

      <p>
        <strong>Territory:</strong>
        ${escapeSponsorshipHTML(
          leopard.territory
        )}
      </p>

      <p>
        <strong>Conservation Status:</strong>
        ${escapeSponsorshipHTML(
          leopard.conservationStatus
        )}
      </p>

      ${saleSection}

      <hr>

      <div class="transfer-section">

        <input
          type="text"
          id="recipient-${tokenId}"
          placeholder="Recipient wallet address"
        >

        <button
          type="button"
          class="transfer-btn"
          data-token-id="${tokenId}"
        >
          Gift / Transfer
        </button>

      </div>

      <button
        type="button"
        class="history-btn"
        data-token-id="${tokenId}"
      >
        View Ownership History
      </button>

    </div>
  `;


  // ----------------------------------------------------------
  // LIST FOR SALE BUTTON
  // ----------------------------------------------------------

  const listButton =
    card.querySelector(
      ".list-sale-btn"
    );

  if (listButton) {
    listButton.addEventListener(
      "click",
      async function () {
        const resalePriceInput =
          document.getElementById(
            `resalePrice-${tokenId}`
          );

        if (!resalePriceInput) {
          return;
        }

        await listCertificateForSale(
          tokenId,
          resalePriceInput.value
        );
      }
    );
  }


  // ----------------------------------------------------------
  // CANCEL SALE BUTTON
  // ----------------------------------------------------------

  const cancelButton =
    card.querySelector(
      ".cancel-sale-btn"
    );

  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      async function () {
        await cancelCertificateSale(
          tokenId
        );
      }
    );
  }


  // ----------------------------------------------------------
  // TRANSFER BUTTON
  // ----------------------------------------------------------

  const transferButton =
    card.querySelector(
      ".transfer-btn"
    );

  if (transferButton) {
    transferButton.addEventListener(
      "click",
      async function () {
        const recipientInput =
          document.getElementById(
            `recipient-${tokenId}`
          );

        if (!recipientInput) {
          return;
        }

        await transferCertificate(
          tokenId,
          recipientInput.value.trim()
        );
      }
    );
  }


  // ----------------------------------------------------------
  // HISTORY BUTTON
  // ----------------------------------------------------------

  const historyButton =
    card.querySelector(
      ".history-btn"
    );

  if (historyButton) {
    historyButton.addEventListener(
      "click",
      async function () {
        await showCertificateHistory(
          tokenId,
          leopard.name
        );
      }
    );
  }

  return card;
}


// ============================================================
// LIST CERTIFICATE FOR RESALE
// ============================================================

async function listCertificateForSale(
  tokenId,
  resalePrice
) {
  if (!resalePrice) {
    showSponsorshipsStatus(
      "Please enter a resale price.",
      true
    );
    return;
  }

  const priceNumber =
    Number(resalePrice);

  if (
    Number.isNaN(priceNumber) ||
    priceNumber <= 0
  ) {
    showSponsorshipsStatus(
      "Please enter a valid resale price.",
      true
    );
    return;
  }

  try {
    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showSponsorshipsStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    const resalePriceWei =
      ethers.parseEther(
        resalePrice.toString()
      );

    showSponsorshipsStatus(
      "Please confirm the resale listing in MetaMask...",
      false
    );

    const transaction =
      await marketplaceContract
        .listForSale(
          tokenId,
          resalePriceWei
        );

    showSponsorshipsStatus(
      "Listing transaction submitted. Waiting for confirmation...",
      false
    );

    await transaction.wait();

    showSponsorshipsStatus(
      "Certificate listed for resale successfully.",
      false
    );

    await loadMySponsorships();

  } catch (error) {
    console.error(
      "Listing failed:",
      error
    );

    showSponsorshipsStatus(
      getSponsorshipErrorMessage(
        error,
        "Could not list the certificate for resale."
      ),
      true
    );
  }
}


// ============================================================
// CANCEL RESALE LISTING
// ============================================================

async function cancelCertificateSale(
  tokenId
) {
  try {
    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showSponsorshipsStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    showSponsorshipsStatus(
      "Please confirm the cancellation in MetaMask...",
      false
    );

    const transaction =
      await marketplaceContract
        .cancelSale(tokenId);

    showSponsorshipsStatus(
      "Cancellation submitted. Waiting for confirmation...",
      false
    );

    await transaction.wait();

    showSponsorshipsStatus(
      "Resale listing cancelled successfully.",
      false
    );

    await loadMySponsorships();

  } catch (error) {
    console.error(
      "Sale cancellation failed:",
      error
    );

    showSponsorshipsStatus(
      getSponsorshipErrorMessage(
        error,
        "Could not cancel the resale listing."
      ),
      true
    );
  }
}


// ============================================================
// TRANSFER / GIFT CERTIFICATE
// ============================================================

async function transferCertificate(
  tokenId,
  recipient
) {
  if (!recipient) {
    showSponsorshipsStatus(
      "Please enter the recipient wallet address.",
      true
    );
    return;
  }

  if (!ethers.isAddress(recipient)) {
    showSponsorshipsStatus(
      "Please enter a valid Ethereum wallet address.",
      true
    );
    return;
  }

  try {
    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showSponsorshipsStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    const currentAccount =
      await getConnectedAccount();

    if (
      currentAccount &&
      currentAccount.toLowerCase() ===
      recipient.toLowerCase()
    ) {
      showSponsorshipsStatus(
        "You cannot transfer the certificate to your own wallet.",
        true
      );
      return;
    }

    showSponsorshipsStatus(
      "Please confirm the certificate transfer in MetaMask...",
      false
    );

    const transaction =
      await marketplaceContract
        .transferCertificate(
          tokenId,
          recipient
        );

    showSponsorshipsStatus(
      "Transfer submitted. Waiting for confirmation...",
      false
    );

    await transaction.wait();

    showSponsorshipsStatus(
      "Sponsorship certificate transferred successfully.",
      false
    );

    await loadMySponsorships();

  } catch (error) {
    console.error(
      "Certificate transfer failed:",
      error
    );

    showSponsorshipsStatus(
      getSponsorshipErrorMessage(
        error,
        "Could not transfer the sponsorship certificate."
      ),
      true
    );
  }
}


// ============================================================
// OWNERSHIP HISTORY
// ============================================================

async function showCertificateHistory(
  tokenId,
  leopardName
) {
  try {
    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showSponsorshipsStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    const history =
      await marketplaceContract
        .getOwnershipHistory(tokenId);

    if (!history || history.length === 0) {
      alert(
        "No ownership history was found."
      );
      return;
    }

    const transactionTypes = [
      "Mint",
      "Initial Sponsorship",
      "Transfer / Gift",
      "Secondary Resale",
    ];

    let historyText =
      `${leopardName} - Ownership History\n\n`;

    history.forEach(
      (record, index) => {
        const transactionType =
          transactionTypes[
            Number(
              record.transactionType
            )
          ] || "Unknown";

        const date =
          new Date(
            Number(record.timestamp) *
            1000
          );

        const price =
          ethers.formatEther(
            record.price
          );

        historyText +=
          `${index + 1}. ${transactionType}\n`;

        historyText +=
          `From: ${record.from}\n`;

        historyText +=
          `To: ${record.to}\n`;

        historyText +=
          `Price: ${price} ETH\n`;

        historyText +=
          `Date: ${date.toLocaleString()}\n\n`;
      }
    );

    alert(historyText);

  } catch (error) {
    console.error(
      "Could not load ownership history:",
      error
    );

    showSponsorshipsStatus(
      "Could not retrieve ownership history.",
      true
    );
  }
}


// ============================================================
// STATUS MESSAGE
// ============================================================

function showSponsorshipsStatus(
  message,
  isError
) {
  const statusElement =
    document.getElementById(
      "sponsorshipsStatus"
    );

  if (!statusElement) {
    if (message) {
      if (isError) {
        console.error(message);
      } else {
        console.log(message);
      }
    }

    return;
  }

  statusElement.textContent =
    message;

  if (isError) {
    statusElement.classList.add(
      "error"
    );

    statusElement.classList.remove(
      "success"
    );
  } else {
    statusElement.classList.add(
      "success"
    );

    statusElement.classList.remove(
      "error"
    );
  }
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function getSponsorshipErrorMessage(
  error,
  defaultMessage
) {
  if (
    error?.code === 4001 ||
    error?.code ===
      "ACTION_REJECTED"
  ) {
    return (
      "Transaction was cancelled in MetaMask."
    );
  }

  if (error?.shortMessage) {
    console.error(
      "Blockchain error:",
      error.shortMessage
    );
  }

  return defaultMessage;
}


// ============================================================
// SAFE HTML OUTPUT
// ============================================================

function escapeSponsorshipHTML(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ============================================================
// LOAD PAGE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    if (
      document.getElementById(
        "mySponsorshipsGrid"
      )
    ) {
      await loadMySponsorships();
    }
  }
);