// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
  showDashboardStatus(
    "Loading blockchain dashboard data...",
    false
  );

  try {
    const dashboardContract =
      await getDashboardContract();

    if (!dashboardContract) {
      showDashboardStatus(
        "Unable to connect to the blockchain.",
        true
      );
      return;
    }

    await Promise.all([
      loadDashboardTotals(
        dashboardContract
      ),

      loadTopHolders(
        dashboardContract
      ),

      loadOwnershipRecords(
        dashboardContract
      ),

      loadConservationFund(
        dashboardContract
      ),
    ]);

    showDashboardStatus(
      "",
      false
    );

  } catch (error) {
    console.error(
      "Dashboard loading failed:",
      error
    );

    showDashboardStatus(
      "Could not load dashboard data.",
      true
    );
  }
}


// ============================================================
// CREATE READ-ONLY CONTRACT
// ============================================================

async function getDashboardContract() {
  try {
    if (
      typeof window.ethereum ===
      "undefined"
    ) {
      console.error(
        "MetaMask is not available."
      );

      return null;
    }

    const dashboardProvider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      dashboardProvider
    );

  } catch (error) {
    console.error(
      "Could not create dashboard contract:",
      error
    );

    return null;
  }
}


// ============================================================
// TOTAL ASSETS + TOTAL TRANSACTIONS
// ============================================================

async function loadDashboardTotals(
  dashboardContract
) {
  const totalAssets =
    await dashboardContract
      .totalAssets();

  const totalTransactions =
    await dashboardContract
      .totalTransactions();

  const assetsElement =
    document.getElementById(
      "totalAssetsCount"
    );

  const transactionsElement =
    document.getElementById(
      "totalTransactionsCount"
    );

  if (assetsElement) {
    assetsElement.textContent =
      totalAssets.toString();
  }

  if (transactionsElement) {
    transactionsElement.textContent =
      totalTransactions.toString();
  }
}


// ============================================================
// TOP 10 CERTIFICATE HOLDERS
// ============================================================

async function loadTopHolders(
  dashboardContract
) {
  const tableBody =
    document.getElementById(
      "topHoldersTableBody"
    );

  if (!tableBody) {
    console.warn(
      "topHoldersTableBody element not found."
    );
    return;
  }

  const participants =
    await dashboardContract
      .getParticipants();

  const holders = [];

  for (const address of participants) {
    const balance =
      await dashboardContract
        .balanceOf(
          address
        );

    /*
     * Only include wallets that currently
     * hold at least one certificate.
     */
    if (balance > 0n) {
      holders.push({
        address,
        balance,
      });
    }
  }


  /*
   * Ranking is performed in JavaScript
   * to avoid expensive on-chain sorting.
   */
  holders.sort(
    (a, b) => {
      if (
        a.balance >
        b.balance
      ) {
        return -1;
      }

      if (
        a.balance <
        b.balance
      ) {
        return 1;
      }

      return 0;
    }
  );


  const topTen =
    holders.slice(
      0,
      10
    );

  tableBody.innerHTML =
    "";

  if (
    topTen.length === 0
  ) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3">
          No certificate holders found.
        </td>
      </tr>
    `;

    return;
  }


  topTen.forEach(
    (holder, index) => {
      const row =
        document.createElement(
          "tr"
        );

      row.innerHTML = `
        <td>
          ${index + 1}
        </td>

        <td
          title="${escapeDashboardHTML(
            holder.address
          )}"
        >
          ${shortenDashboardAddress(
            holder.address
          )}
        </td>

        <td>
          ${holder.balance.toString()}
        </td>
      `;

      tableBody.appendChild(
        row
      );
    }
  );
}


// ============================================================
// OWNERSHIP / SPONSORSHIP RECORDS
// ============================================================

async function loadOwnershipRecords(
  dashboardContract
) {
  const tableBody =
    document.getElementById(
      "ownershipRecordsTableBody"
    );

  if (!tableBody) {
    console.warn(
      "ownershipRecordsTableBody element not found."
    );
    return;
  }

  const leopards =
    await dashboardContract
      .getAllLeopards();

  const records = [];


  const transactionTypes = [
    "Mint",
    "Initial Sponsorship",
    "Transfer / Gift",
    "Secondary Resale",
  ];


  for (const leopard of leopards) {
    const tokenId =
      Number(
        leopard.tokenId
      );

    const history =
      await dashboardContract
        .getOwnershipHistory(
          tokenId
        );

    for (
      const record
      of history
    ) {
      const typeIndex =
        Number(
          record.transactionType
        );

      records.push({
        tokenId,

        leopardId:
          leopard.leopardId,

        leopardName:
          leopard.name,

        from:
          record.from,

        to:
          record.to,

        price:
          record.price,

        timestamp:
          record.timestamp,

        transactionType:
          transactionTypes[
            typeIndex
          ] || "Unknown",
      });
    }
  }


  /*
   * Display newest blockchain
   * records first.
   */
  records.sort(
    (a, b) =>
      Number(
        b.timestamp
      ) -
      Number(
        a.timestamp
      )
  );


  tableBody.innerHTML =
    "";


  if (
    records.length === 0
  ) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          No ownership records found.
        </td>
      </tr>
    `;

    return;
  }


  for (
    const record
    of records
  ) {
    const row =
      document.createElement(
        "tr"
      );


    const date =
      new Date(
        Number(
          record.timestamp
        ) *
        1000
      );


    const priceEth =
      ethers.formatEther(
        record.price
      );


    row.innerHTML = `
      <td>
        #${record.tokenId}
      </td>

      <td>
        ${escapeDashboardHTML(
          record.leopardId
        )}
      </td>

      <td>
        ${escapeDashboardHTML(
          record.leopardName
        )}
      </td>

      <td>
        ${escapeDashboardHTML(
          record.transactionType
        )}
      </td>

      <td
        title="${escapeDashboardHTML(
          record.from
        )}"
      >
        ${formatDashboardAddress(
          record.from
        )}
      </td>

      <td
        title="${escapeDashboardHTML(
          record.to
        )}"
      >
        ${formatDashboardAddress(
          record.to
        )}
      </td>

      <td>
        ${priceEth} ETH
      </td>

      <td>
        ${escapeDashboardHTML(
          date.toLocaleString()
        )}
      </td>
    `;


    tableBody.appendChild(
      row
    );
  }
}


// ============================================================
// LOAD CONSERVATION FUND
// ============================================================

async function loadConservationFund(
  dashboardContract
) {
  try {
    const fundAddress =
      await dashboardContract
        .conservationFund();


    const fundElement =
      document.getElementById(
        "currentConservationFund"
      );


    if (fundElement) {
      fundElement.textContent =
        shortenDashboardAddress(
          fundAddress
        );

      fundElement.title =
        fundAddress;
    }

  } catch (error) {
    console.error(
      "Could not load conservation fund:",
      error
    );
  }
}

async function revealConservationFundPanelIfAdmin() {
  const panel = document.getElementById("conservationFundAdminPanel");
  if (!panel) return;

  try {
    const dashboardContract = await getDashboardContract();
    if (!dashboardContract) return;

    const account = await getConnectedAccount();
    if (!account) return; // wallet not connected yet — stays hidden

    const contractOwner = await dashboardContract.owner();

    if (account.toLowerCase() === contractOwner.toLowerCase()) {
      panel.style.display = "block";
    }
  } catch (error) {
    console.error("Could not verify admin status:", error);
  }
}


// ============================================================
// UPDATE CONSERVATION FUND
// ============================================================

async function updateConservationFundFromDashboard() {
  const addressInput =
    document.getElementById(
      "newConservationFund"
    );


  if (!addressInput) {
    console.error(
      "Conservation fund input not found."
    );
    return;
  }


  const newAddress =
    addressInput.value.trim();


  if (!newAddress) {
    showConservationFundStatus(
      "Please enter a wallet address.",
      true
    );
    return;
  }


  if (
    !ethers.isAddress(
      newAddress
    )
  ) {
    showConservationFundStatus(
      "Please enter a valid Ethereum address.",
      true
    );
    return;
  }


  if (
    newAddress.toLowerCase() ===
    ethers.ZeroAddress.toLowerCase()
  ) {
    showConservationFundStatus(
      "The zero address cannot be used as the conservation fund.",
      true
    );
    return;
  }


  try {
    const marketplaceContract =
      await getConnectedContract();


    if (!marketplaceContract) {
      showConservationFundStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }


    const account =
      await getConnectedAccount();


    if (!account) {
      showConservationFundStatus(
        "Wallet is not connected.",
        true
      );
      return;
    }


    const contractOwner =
      await marketplaceContract
        .owner();


    if (
      account.toLowerCase() !==
      contractOwner.toLowerCase()
    ) {
      showConservationFundStatus(
        "Only the contract administrator can update the conservation fund.",
        true
      );
      return;
    }


    const currentFund =
      await marketplaceContract
        .conservationFund();


    if (
      currentFund.toLowerCase() ===
      newAddress.toLowerCase()
    ) {
      showConservationFundStatus(
        "This address is already the conservation fund.",
        true
      );
      return;
    }


    showConservationFundStatus(
      "Please confirm the transaction in MetaMask...",
      false
    );


    const transaction =
      await marketplaceContract
        .updateConservationFund(
          newAddress
        );


    showConservationFundStatus(
      "Transaction submitted. Waiting for confirmation...",
      false
    );


    await transaction.wait();


    showConservationFundStatus(
      "Conservation fund updated successfully.",
      false
    );


    addressInput.value =
      "";


    const dashboardContract =
      await getDashboardContract();


    if (dashboardContract) {
      await loadConservationFund(
        dashboardContract
      );
    }

  } catch (error) {
    console.error(
      "Conservation fund update failed:",
      error
    );


    if (
      error?.code === 4001 ||
      error?.code ===
        "ACTION_REJECTED"
    ) {
      showConservationFundStatus(
        "Transaction was cancelled in MetaMask.",
        true
      );

      return;
    }


    showConservationFundStatus(
      "Could not update the conservation fund.",
      true
    );
  }
}


// ============================================================
// CONSERVATION FUND STATUS
// ============================================================

function showConservationFundStatus(
  message,
  isError
) {
  const statusElement =
    document.getElementById(
      "conservationFundStatus"
    );


  if (!statusElement) {
    if (isError) {
      console.error(
        message
      );
    } else {
      console.log(
        message
      );
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
// ADDRESS FORMATTING
// ============================================================

function shortenDashboardAddress(
  address
) {
  if (!address) {
    return "";
  }

  return (
    address.slice(
      0,
      6
    ) +
    "..." +
    address.slice(
      -4
    )
  );
}


function formatDashboardAddress(
  address
) {
  if (!address) {
    return "";
  }


  if (
    address.toLowerCase() ===
    ethers.ZeroAddress.toLowerCase()
  ) {
    return "Mint";
  }


  return shortenDashboardAddress(
    address
  );
}


// ============================================================
// DASHBOARD STATUS
// ============================================================

function showDashboardStatus(
  message,
  isError
) {
  const statusElement =
    document.getElementById(
      "dashboardStatus"
    );


  if (!statusElement) {
    if (message) {
      if (isError) {
        console.error(
          message
        );
      } else {
        console.log(
          message
        );
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
// SAFE HTML OUTPUT
// ============================================================

function escapeDashboardHTML(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}



// PAGE LOAD


document.addEventListener(
  "DOMContentLoaded",
  async function () {

    const updateFundButton =
      document.getElementById(
        "updateConservationFundBtn"
      );


    if (updateFundButton) {
      updateFundButton.addEventListener(
        "click",
        async function () {
          await updateConservationFundFromDashboard();
        }
      );
    }


    const dashboardExists =
      document.getElementById(
        "totalAssetsCount"
      ) ||
      document.getElementById(
        "totalTransactionsCount"
      ) ||
      document.getElementById(
        "topHoldersTableBody"
      ) ||
      document.getElementById(
        "ownershipRecordsTableBody"
      ) ||
      document.getElementById(
        "currentConservationFund"
      );


    if (dashboardExists) {
      await loadDashboard();
      await revealConservationFundPanelIfAdmin();
    }
  }
);