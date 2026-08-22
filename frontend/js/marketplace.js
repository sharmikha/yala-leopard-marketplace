let marketplaceContractRead = null;

async function getReadOnlyContract() {
  try {
    if (!provider) {
      if (typeof window.ethereum === "undefined") {
        console.error("MetaMask is not available.");
        return null;
      }

      provider = new ethers.BrowserProvider(window.ethereum);
    }

    marketplaceContractRead = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    return marketplaceContractRead;
  } catch (error) {
    console.error("Could not create read-only contract:", error);
    return null;
  }
}

async function loadMarketplace() {
  const marketplaceGrid =
    document.getElementById("marketplaceGrid");

  if (!marketplaceGrid) {
    console.warn("marketplaceGrid element not found.");
    return;
  }

  showMarketplaceStatus(
    "Loading leopard sponsorships...",
    false
  );

  try {
    const readContract =
      await getReadOnlyContract();

    if (!readContract) {
      showMarketplaceStatus(
        "Unable to connect to the blockchain.",
        true
      );
      return;
    }

    const leopards =
      await readContract.getAllLeopards();

    marketplaceGrid.innerHTML = "";

    if (!leopards || leopards.length === 0) {
      marketplaceGrid.innerHTML = `
        <div class="empty-marketplace">
          <p>No leopards have been registered yet.</p>
        </div>
      `;

      showMarketplaceStatus("", false);
      return;
    }

    for (const leopard of leopards) {
      const card =
        await createLeopardCard(
          readContract,
          leopard
        );

      marketplaceGrid.appendChild(card);
    }

    showMarketplaceStatus("", false);
  } catch (error) {
    console.error(
      "Failed to load marketplace:",
      error
    );

    showMarketplaceStatus(
      "Could not load marketplace data.",
      true
    );
  }
}

async function createLeopardCard(
  readContract,
  leopard
) {
  const tokenId =
    Number(leopard.tokenId);

  const currentOwner =
    await readContract.ownerOf(tokenId);

  const priceEth =
    ethers.formatEther(leopard.price);

  const card =
    document.createElement("div");

  card.className = "leopard-card";

  const statusText =
    leopard.forSale
      ? "Listed for Resale"
      : leopard.sponsored
      ? "Sponsored"
      : "Available for Sponsorship";

  let actionButton = "";

  if (!leopard.sponsored) {
    actionButton = `
      <button
        class="sponsor-btn"
        data-token-id="${tokenId}"
        data-price="${priceEth}"
      >
        Sponsor Leopard
      </button>
    `;
  } else if (leopard.forSale) {
    actionButton = `
      <button
        class="resale-btn"
        data-token-id="${tokenId}"
        data-price="${priceEth}"
      >
        Purchase Certificate
      </button>
    `;
  } else {
    actionButton = `
      <button disabled>
        Currently Sponsored
      </button>
    `;
  }

  card.innerHTML = `
    <div class="leopard-image-wrapper">
      <img
        src="${escapeHTML(leopard.imageURI)}"
        alt="${escapeHTML(leopard.name)}"
        class="leopard-image"
      >
    </div>

    <div class="leopard-card-body">
      <h3>
        ${escapeHTML(leopard.name)}
      </h3>

      <p>
        <strong>Leopard ID:</strong>
        ${escapeHTML(leopard.leopardId)}
      </p>

      <p>
        <strong>Territory:</strong>
        ${escapeHTML(leopard.territory)}
      </p>

      <p>
        <strong>Conservation Status:</strong>
        ${escapeHTML(
          leopard.conservationStatus
        )}
      </p>

      <p>
        <strong>Status:</strong>
        ${statusText}
      </p>

      <p>
        <strong>Price:</strong>
        ${priceEth} ETH
      </p>

      <p>
        <strong>Current Certificate Holder:</strong>
        ${shortenAddress(currentOwner)}
      </p>

      <button
        class="view-details-btn"
        data-token-id="${tokenId}"
        type="button"
      >
        View Details
      </button>

      ${actionButton}
    </div>
  `;

  const sponsorButton =
    card.querySelector(".sponsor-btn");

  if (sponsorButton) {
    sponsorButton.addEventListener(
      "click",
      async function () {
        await sponsorLeopardFromMarketplace(
          tokenId,
          leopard.price
        );
      }
    );
  }

  const resaleButton =
    card.querySelector(".resale-btn");

  if (resaleButton) {
    resaleButton.addEventListener(
      "click",
      async function () {
        await purchaseResaleFromMarketplace(
          tokenId,
          leopard.price
        );
      }
    );
  }

  const detailsButton =
    card.querySelector(".view-details-btn");

  if (detailsButton) {
    detailsButton.addEventListener(
      "click",
      function () {
        showLeopardDetails(
          leopard,
          currentOwner
        );
      }
    );
  }

  return card;
}

async function sponsorLeopardFromMarketplace(
  tokenId,
  sponsorshipPrice
) {
  try {
    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showMarketplaceStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    const account =
      await getConnectedAccount();

    if (!account) {
      showMarketplaceStatus(
        "Wallet is not connected.",
        true
      );
      return;
    }

    showMarketplaceStatus(
      "Please confirm the sponsorship transaction in MetaMask...",
      false
    );

    const transaction =
      await marketplaceContract
        .sponsorLeopard(
          tokenId,
          {
            value: sponsorshipPrice,
          }
        );

    showMarketplaceStatus(
      "Sponsorship transaction submitted. Waiting for confirmation...",
      false
    );

    await transaction.wait();

    showMarketplaceStatus(
      "Leopard sponsored successfully.",
      false
    );

    await loadMarketplace();
  } catch (error) {
    console.error(
      "Sponsorship failed:",
      error
    );

    showMarketplaceStatus(
      getTransactionErrorMessage(
        error,
        "Sponsorship failed."
      ),
      true
    );
  }
}

async function purchaseResaleFromMarketplace(
  tokenId,
  resalePrice
) {
  try {
    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showMarketplaceStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    const account =
      await getConnectedAccount();

    if (!account) {
      showMarketplaceStatus(
        "Wallet is not connected.",
        true
      );
      return;
    }

    const currentOwner =
      await marketplaceContract.ownerOf(
        tokenId
      );

    if (
      currentOwner.toLowerCase() ===
      account.toLowerCase()
    ) {
      showMarketplaceStatus(
        "You already own this sponsorship certificate.",
        true
      );
      return;
    }

    showMarketplaceStatus(
      "Please confirm the resale purchase in MetaMask...",
      false
    );

    const transaction =
      await marketplaceContract
        .purchaseResale(
          tokenId,
          {
            value: resalePrice,
          }
        );

    showMarketplaceStatus(
      "Resale transaction submitted. Waiting for confirmation...",
      false
    );

    await transaction.wait();

    showMarketplaceStatus(
      "Sponsorship certificate purchased successfully.",
      false
    );

    await loadMarketplace();
  } catch (error) {
    console.error(
      "Resale purchase failed:",
      error
    );

    showMarketplaceStatus(
      getTransactionErrorMessage(
        error,
        "Certificate purchase failed."
      ),
      true
    );
  }
}

function showLeopardDetails(
  leopard,
  currentOwner
) {
  const priceEth =
    ethers.formatEther(leopard.price);

  const message = `
${leopard.name}

Leopard ID: ${leopard.leopardId}
Territory: ${leopard.territory}
Conservation Status: ${leopard.conservationStatus}
Description: ${leopard.description}
Price: ${priceEth} ETH
Current Certificate Holder: ${currentOwner}
  `.trim();

  alert(message);
}

function showMarketplaceStatus(
  message,
  isError
) {
  const statusElement =
    document.getElementById("marketplaceStatus");

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

  statusElement.textContent = message;

  if (isError) {
    statusElement.classList.add("error");
    statusElement.classList.remove("success");
  } else {
    statusElement.classList.add("success");
    statusElement.classList.remove("error");
  }
}

function getTransactionErrorMessage(
  error,
  defaultMessage
) {
  if (
    error?.code === 4001 ||
    error?.code === "ACTION_REJECTED"
  ) {
    return "Transaction was cancelled in MetaMask.";
  }

  const reason =
    error?.reason ||
    error?.shortMessage ||
    error?.message;

  if (reason) {
    console.error(
      "Blockchain error:",
      reason
    );
  }

  return defaultMessage;
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    if (
      document.getElementById(
        "marketplaceGrid"
      )
    ) {
      await loadMarketplace();
    }
  }
);