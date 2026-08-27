
// LEOPARD DETAIL PAGE

function getTokenIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("tokenId");
}

async function getReadOnlyContractForDetail() {
  if (typeof window.ethereum === "undefined") {
    console.error("MetaMask is not available.");
    return null;
  }
  const detailProvider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, detailProvider);
}

const transactionTypes = ["Mint", "Initial Sponsorship", "Transfer / Gift", "Secondary Resale"];

async function loadLeopardDetail() {
  const statusEl = document.getElementById("leopardDetailStatus");
  const container = document.getElementById("leopardDetailContainer");
  const historyBody = document.getElementById("leopardHistoryTableBody");

  const tokenId = getTokenIdFromURL();
  if (!tokenId) {
    statusEl.textContent = "No leopard specified.";
    statusEl.classList.add("error");
    return;
  }

  try {
    const contract = await getReadOnlyContractForDetail();
    if (!contract) {
      statusEl.textContent = "Unable to connect to the blockchain.";
      statusEl.classList.add("error");
      return;
    }

    const leopard = await contract.getLeopard(tokenId);
    const currentOwner = await contract.ownerOf(tokenId);
    const priceEth = ethers.formatEther(leopard.price);

    container.innerHTML = `
      <div class="leopard-card" style="max-width:500px;">
        <img src="${leopard.imageURI}" alt="${leopard.name}" class="leopard-image">
        <h1>${leopard.name}</h1>
        <p><strong>Leopard ID:</strong> ${leopard.leopardId}</p>
        <p><strong>Territory:</strong> ${leopard.territory}</p>
        <p><strong>Conservation Status:</strong> ${leopard.conservationStatus}</p>
        <p>${leopard.description}</p>
        <p><strong>Price:</strong> ${priceEth} ETH</p>
        <p><strong>Current Certificate Holder:</strong> ${currentOwner}</p>
      </div>
    `;

    const history = await contract.getOwnershipHistory(tokenId);
    historyBody.innerHTML = history.length
      ? history.map((h) => {
          const type = transactionTypes[Number(h.transactionType)] || "Unknown";
          const price = ethers.formatEther(h.price);
          const date = new Date(Number(h.timestamp) * 1000).toLocaleString();
          const from = h.from === ethers.ZeroAddress ? "Mint" : h.from;
          return `<tr><td>${type}</td><td>${from}</td><td>${h.to}</td><td>${price} ETH</td><td>${date}</td></tr>`;
        }).join("")
      : `<tr><td colspan="5" class="placeholder-text">No history yet.</td></tr>`;

    statusEl.textContent = "";
  } catch (error) {
    console.error("Failed to load leopard detail:", error);
    statusEl.textContent = "Could not load this leopard's details.";
    statusEl.classList.add("error");
  }
}

document.addEventListener("DOMContentLoaded", loadLeopardDetail);