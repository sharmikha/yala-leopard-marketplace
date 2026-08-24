let provider = null;
let signer = null;
let contract = null;
let connectedAccount = null;

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask is not installed. Please install MetaMask first.");
    return null;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);

    const accounts = await provider.send(
      "eth_requestAccounts",
      []
    );

    if (!accounts || accounts.length === 0) {
      alert("No MetaMask account was selected.");
      return null;
    }

    connectedAccount = accounts[0];

    signer = await provider.getSigner();

    contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    updateWalletUI();
    await updateRegisterNavVisibility();

    return connectedAccount;
  } catch (error) {
    console.error("Wallet connection failed:", error);

    alert(
      "Could not connect to MetaMask. Please try again."
    );

    return null;
  }
}

function updateWalletUI() {
  const walletButton =
    document.getElementById("connectWalletBtn");

  const walletAddress =
    document.getElementById("walletAddress");

  if (walletButton && connectedAccount) {
    walletButton.textContent = "Wallet Connected";
  }

  if (walletAddress && connectedAccount) {
    walletAddress.textContent =
      shortenAddress(connectedAccount);
  }
}

function shortenAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function getConnectedContract() {
  if (!contract) {
    const account = await connectWallet();

    if (!account) {
      return null;
    }
  }

  return contract;
}

async function getConnectedAccount() {
  if (connectedAccount) {
    return connectedAccount;
  }

  if (typeof window.ethereum === "undefined") {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (!accounts || accounts.length === 0) {
      return null;
    }

    connectedAccount = accounts[0];

    provider = new ethers.BrowserProvider(
      window.ethereum
    );

    signer = await provider.getSigner();

    contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    updateWalletUI();

    return connectedAccount;
  } catch (error) {
    console.error(
      "Could not get connected account:",
      error
    );

    return null;
  }
}

function handleAccountsChanged(accounts) {
  if (!accounts || accounts.length === 0) {
    connectedAccount = null;
    signer = null;
    contract = null;

    const walletButton =
      document.getElementById("connectWalletBtn");

    const walletAddress =
      document.getElementById("walletAddress");

    if (walletButton) {
      walletButton.textContent = "Connect Wallet";
    }

    if (walletAddress) {
      walletAddress.textContent = "";
    }

    return;
  }

  connectedAccount = accounts[0];

  window.location.reload();
}

function handleChainChanged() {
  window.location.reload();
}

if (typeof window.ethereum !== "undefined") {
  window.ethereum.on(
    "accountsChanged",
    handleAccountsChanged
  );

  window.ethereum.on(
    "chainChanged",
    handleChainChanged
  );
}

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    const walletButton =
      document.getElementById("connectWalletBtn");

    if (walletButton) {
      walletButton.addEventListener(
        "click",
        connectWallet
      );
    }

    await getConnectedAccount();
    await updateRegisterNavVisibility();
  }
);

async function updateRegisterNavVisibility() {
  const registerLink = document.getElementById("registerNavLink");
  if (!registerLink) return;

  try {
    if (typeof window.ethereum === "undefined") return;

    const readProvider = new ethers.BrowserProvider(window.ethereum);
    const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length === 0) return; // no wallet connected — stays hidden

    const contractOwner = await readContract.owner();

    if (accounts[0].toLowerCase() === contractOwner.toLowerCase()) {
      registerLink.style.display = "inline";
    }
  } catch (error) {
    console.error("Could not check admin status for nav:", error);
  }
}