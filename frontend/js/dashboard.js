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
      loadDashboardTotals(dashboardContract),
      loadTopHolders(dashboardContract),
      loadOwnershipRecords(dashboardContract),
    ]);

    showDashboardStatus("", false);

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
    await dashboardContract.totalAssets();

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
      await dashboardContract.balanceOf(
        address
      );

    /*
     * Only include wallets that currently hold
     * at least one sponsorship certificate.
     */
    if (balance > 0n) {
      holders.push({
        address,
        balance,
      });
    }
  }

  /*
   * Top-holder ranking is intentionally performed
   * in JavaScript rather than inside Solidity.
   *
   * This avoids expensive on-chain sorting and gas.
   */
  holders.sort(
    (a, b) => {
      if (a.balance > b.balance) {
        return -1;
      }

      if (a.balance < b.balance) {
        return 1;
      }

      return 0;
    }
  );

  const topTen =
    holders.slice(0, 10);

  tableBody.innerHTML = "";

  if (topTen.length === 0) {
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
        document.createElement("tr");

      row.innerHTML = `
        <td>
          ${index + 1}
        </td>

        <td title="${escapeDashboardHTML(
          holder.address
        )}">
          ${shortenDashboardAddress(
            holder.address
          )}
        </td>

        <td>
          ${holder.balance.toString()}
        </td>
      `;

      tableBody.appendChild(row);
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
      Number(leopard.tokenId);

    const history =
      await dashboardContract
        .getOwnershipHistory(
          tokenId
        );

    for (const record of history) {
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
   * Display newest blockchain records first.
   */
  records.sort(
    (a, b) =>
      Number(b.timestamp) -
      Number(a.timestamp)
  );

  tableBody.innerHTML = "";

  if (records.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          No ownership records found.
        </td>
      </tr>
    `;

    return;
  }

  for (const record of records) {
    const row =
      document.createElement("tr");

    const date =
      new Date(
        Number(record.timestamp) *
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

      <td title="${escapeDashboardHTML(
        record.from
      )}">
        ${formatDashboardAddress(
          record.from
        )}
      </td>

      <td title="${escapeDashboardHTML(
        record.to
      )}">
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

    tableBody.appendChild(row);
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
    address.slice(0, 6) +
    "..." +
    address.slice(-4)
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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {
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
      );

    if (dashboardExists) {
      await loadDashboard();
    }
  }
);