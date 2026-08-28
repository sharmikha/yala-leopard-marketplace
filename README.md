# Yala Leopard Conservation Marketplace

This README explains how to run and check the Yala Leopard Conservation Marketplace from scratch.

The project can be checked in two ways:

- **Approach 1 – Hardhat Local Network:** Run, deploy and test the smart contract locally using Hardhat test accounts and local test ETH.
- **Approach 2 – Sepolia Testnet:** Run the complete deployed DApp using MetaMask and Sepolia test ETH.

---

## GitHub Repository

The complete source code, smart contract, frontend and automated tests are available at:

https://github.com/sharmikha/yala-leopard-marketplace

To download the project using Git:

```bash
git clone https://github.com/sharmikha/yala-leopard-marketplace.git
```

Then enter the project folder:

```bash
cd yala-leopard-marketplace
```

---

# Before You Start

The following software is required:

- Node.js
- npm
- Git
- Visual Studio Code
- MetaMask browser extension
- Live Server extension for Visual Studio Code

## 1. Install Node.js

Download and install Node.js from:

https://nodejs.org/

npm is installed automatically with Node.js.

After installation, open a terminal and check:

```bash
node --version
npm --version
```

Both commands should display a version number.

---

## 2. Install Git

Download Git from:

https://git-scm.com/

Check the installation:

```bash
git --version
```

---

## 3. Install Visual Studio Code

Download Visual Studio Code from:

https://code.visualstudio.com/

---

## 4. Install MetaMask

Install the MetaMask browser extension from:

https://metamask.io/

MetaMask is required when interacting with the DApp through either the local Hardhat blockchain or the Sepolia Testnet.

---

# Initial Project Setup

After cloning the repository, open a terminal inside the project folder:

```bash
cd yala-leopard-marketplace
```

Install all project dependencies:

```bash
npm install
```

This installs Hardhat, Ethers.js, OpenZeppelin, Mocha, Chai and the other packages required by the project.

Open the project in Visual Studio Code:

```bash
code .
```

If the `code` command is not available, open Visual Studio Code manually and select:

**File → Open Folder → yala-leopard-marketplace**

The project is now ready to run.

---

# Approach 1 – Hardhat Local Network

This approach can be used to check the smart contract without using the public Sepolia network.

Hardhat creates a temporary local Ethereum blockchain and provides test accounts containing local test ETH.

---

## Step 1 – Compile the Smart Contract

Open a terminal in Visual Studio Code:

**Terminal → New Terminal**

Run:

```bash
npx hardhat compile
```

This compiles the `LeopardMarketplace.sol` smart contract.

If the compilation completes without an error, the contract has compiled successfully.

---

## Step 2 – Run the Automated Tests

Run:

```bash
npx hardhat test
```

The automated tests check the major functions of the smart contract, including:

- Leopard registration
- Initial sponsorship
- Certificate ownership
- Resale listing
- Listing cancellation
- Secondary purchase
- Certificate transfer
- Conservation fund operations
- Ownership history
- Payment validation
- Invalid transaction handling
- Access control

The current test suite should finish with:

```text
50 passing
```

If only the smart contract and automated tests need to be checked, no further local setup is required.

To interact with the complete DApp on a local blockchain, continue with the following steps.

---

## Step 3 – Start the Hardhat Local Blockchain

Open a terminal and run:

```bash
npx hardhat node
```

Keep this terminal open.

The local Hardhat blockchain uses:

```text
Network Name: Hardhat Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

Hardhat will display several temporary test accounts and their private keys in the terminal.

These accounts contain local test ETH and can be used to test the DApp.

Typical Hardhat development accounts include:

```text
Account #0
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Account #1
0x70997970C51812dc3A010C7d01b50e0d17dc79C8

Account #2
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

Account #3
0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

Always use the accounts displayed by your own Hardhat terminal if they are different.

The private keys printed by Hardhat are development-only keys. Never use these accounts to hold real cryptocurrency.

---

## Step 4 – Add Hardhat Localhost to MetaMask

Open MetaMask and add a custom network using:

```text
Network Name: Hardhat Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

Save the network.

Then select:

```text
Hardhat Localhost
```

---

## Step 5 – Import a Hardhat Test Account

Look at the terminal where `npx hardhat node` is running.

Hardhat displays a private key underneath each test account.

Copy the private key for the account you want to use.

In MetaMask:

1. Open the account menu.
2. Select **Import account**.
3. Paste the Hardhat private key.
4. Import the account.
5. Select the **Hardhat Localhost** network.

The account should now display its local test ETH.

For testing, different accounts can be used for different roles:

```text
Account #0 → Administrator / Contract Owner
Account #1 → Sponsor
Account #2 → Secondary Buyer
Account #3 → Conservation Fund
```

---

## Step 6 – Prepare the Local Deployment Parameter

The `LeopardMarketplace` contract requires a Conservation Fund address when it is deployed.

Create a file called:

```text
ignition/parameters.json
```

Add:

```json
{
  "LeopardMarketplaceModule": {
    "conservationFund": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  }
}
```

The address above uses Hardhat Account #3 as the local Conservation Fund.

If your Hardhat accounts are different, replace it with one of the addresses displayed by your Hardhat node.

---

## Step 7 – Deploy the Contract Locally

Keep the first terminal running:

```bash
npx hardhat node
```

Open a second terminal and run:

```bash
npx hardhat ignition deploy ignition/modules/LeopardMarketplace.ts --network localhost --parameters ignition/parameters.json
```

Wait for the deployment to complete.

Hardhat Ignition will display the deployed `LeopardMarketplace` contract address.

Copy this contract address because it is required by the frontend.

The account used for deployment becomes the contract administrator/owner.

---

## Step 8 – Change the Frontend to the Local Contract

Open:

```text
frontend/js/config.js
```

The submitted version contains the Sepolia contract address.

Change:

```javascript
const CONTRACT_ADDRESS = "0x9F8E847b107bC786F21Dab4586dff9c5BB62E69A";
```

to the new local contract address displayed after the Hardhat deployment.

For example:

```javascript
const CONTRACT_ADDRESS = "YOUR_LOCAL_CONTRACT_ADDRESS";
```

Save the file.

Do not use the Sepolia contract address while MetaMask is connected to Hardhat Localhost.

---

## Step 9 – Install Live Server

In Visual Studio Code:

1. Open **Extensions**.
2. Search for **Live Server**.
3. Install the Live Server extension.

---

## Step 10 – Start the Frontend

Open:

```text
frontend/index.html
```

Right-click `index.html` and select:

**Open with Live Server**

The DApp will normally open at:

```text
http://127.0.0.1:5500/frontend/index.html
```

If Live Server selects another port, use the address opened automatically in the browser.

Note that:

```text
http://127.0.0.1:8545
```

is the Hardhat blockchain RPC address.

The following is the frontend website address:

```text
http://127.0.0.1:5500/frontend/index.html
```

They are two different addresses.

---

## Step 11 – Connect MetaMask

Before connecting:

1. Make sure `npx hardhat node` is still running.
2. Select **Hardhat Localhost** in MetaMask.
3. Select an imported Hardhat account.
4. Open the DApp.
5. Click **Connect Wallet**.
6. Approve the connection in MetaMask.

The DApp should now communicate with the locally deployed smart contract.

---

## Step 12 – Test the Administrator Functions

The account that deploys the smart contract becomes the contract owner.

Connect MetaMask using that account to access administrator functions.

Only the administrator can view and use:

```text
Register Leopard
Conservation Fund Administration
```

If a normal user account is connected, these administrator options remain hidden.

The administrator can register a leopard and update the Conservation Fund address.

---

## Step 13 – Test with Different Users

After registering a leopard as the administrator, switch MetaMask accounts to test different functions.

A simple local testing flow is:

```text
Administrator
     ↓
Register Leopard
     ↓
Switch to Sponsor Account
     ↓
Sponsor Leopard
     ↓
Sponsor Receives ERC-721 Certificate
     ↓
List Certificate for Resale
     ↓
Switch to Buyer Account
     ↓
Purchase Certificate
     ↓
90% → Seller
10% → Conservation Fund
     ↓
Ownership History Updated
```

MetaMask will ask for confirmation whenever a blockchain transaction is required.

---

## Stopping the Local Hardhat Network

To stop Hardhat, return to the terminal running:

```bash
npx hardhat node
```

Press:

```text
Ctrl + C
```

The local blockchain is temporary. Restarting it creates a fresh local blockchain, so the contract may need to be deployed again.

---

# Approach 2 – Sepolia Testnet

This is the easiest way to check the complete submitted DApp.

The `LeopardMarketplace` smart contract has already been deployed to the Ethereum Sepolia Testnet, so the contract does not need to be deployed again.

---

## Sepolia Network Details

```text
Network: Ethereum Sepolia Testnet
Chain ID: 11155111
```

### Deployed LeopardMarketplace Contract

```text
0x9F8E847b107bC786F21Dab4586dff9c5BB62E69A
```

### Conservation Fund Address

```text
0xE039c3Ab51D19f24a1C4dBa06B548fa23d0F7dC4
```

### Administrator / Contract Owner

```text
0xBDC889D62B5A9dBb32De6d60001113F5a0D5c7D2
```

The administrator wallet is required to access the administrator-only functionality.

---

## Step 1 – Check the Frontend Contract Address

Open:

```text
frontend/js/config.js
```

For Sepolia, the contract address should be:

```javascript
const CONTRACT_ADDRESS = "0x9F8E847b107bC786F21Dab4586dff9c5BB62E69A";
```

If the file was changed while testing Hardhat locally, change it back to this Sepolia contract address and save the file.

---

## Step 2 – Select Sepolia in MetaMask

Open MetaMask.

Select:

```text
Sepolia
```

If Sepolia is not displayed, enable test networks in MetaMask and select the Ethereum Sepolia Test Network.

Do not use Hardhat Localhost when testing the deployed Sepolia version.

---

## Step 3 – Obtain Sepolia Test ETH

Transactions on Sepolia require a small amount of Sepolia ETH for test gas fees.

Sepolia ETH has no real monetary value.

If the selected wallet does not contain Sepolia ETH, obtain test ETH from a Sepolia faucet.

After receiving it, check that the balance appears in MetaMask while Sepolia is selected.

---

## Step 4 – Start the Frontend

If Live Server has not already been installed:

1. Open Visual Studio Code.
2. Open **Extensions**.
3. Search for **Live Server**.
4. Install it.

Then open:

```text
frontend/index.html
```

Right-click and select:

**Open with Live Server**

The application will normally open at:

```text
http://127.0.0.1:5500/frontend/index.html
```

The exact port may be different if port 5500 is already in use.

---

## Step 5 – Connect MetaMask

Make sure MetaMask is:

```text
Unlocked
Connected to Sepolia
Using an account with Sepolia test ETH
```

Then:

1. Click **Connect Wallet** in the DApp.
2. MetaMask will open.
3. Select the required account.
4. Approve the connection.
5. The connected wallet address will appear in the DApp.

The DApp is now connected to the deployed Sepolia smart contract.

---

# Administrator Access on Sepolia

Two areas of the DApp are restricted to the contract administrator:

```text
Register Leopard
Conservation Fund Administration
```

These options only become visible when the connected MetaMask wallet matches the smart contract owner.

### Administrator Address

```text
0xBDC889D62B5A9dBb32De6d60001113F5a0D5c7D2
```

When the administrator wallet is connected, the DApp displays:

- **Register Leopard** in the navigation
- **Conservation Fund Administration** on the Dashboard

When a normal user wallet is connected, these administrator controls remain hidden.

The smart contract also enforces administrator access, so hiding the frontend controls is not the only protection.

---

# Main DApp Pages

## Home

```text
http://127.0.0.1:5500/frontend/index.html
```

---

## Marketplace

```text
http://127.0.0.1:5500/frontend/marketplace.html
```

This page displays registered leopards and available sponsorship or resale options.

---

## My Certificates

```text
http://127.0.0.1:5500/frontend/my-sponsorships.html
```

This page displays certificates owned by the connected wallet.

Certificate owners can:

- List a certificate for resale
- Cancel a resale listing
- Transfer/gift a certificate
- View certificate ownership history

---

## Dashboard

```text
http://127.0.0.1:5500/frontend/dashboard.html
```

The dashboard displays information including:

- Total registered assets
- Total blockchain transactions
- Top certificate holders
- Ownership records
- Conservation Fund information

The Conservation Fund Administration area is only visible to the contract administrator.

---

## Register Leopard

```text
http://127.0.0.1:5500/frontend/register.html
```

This page is only available to the contract administrator.

---

# Confirming Transactions with MetaMask

Actions that change blockchain data require a MetaMask confirmation.

For example:

```text
Select Action in DApp
        ↓
MetaMask Opens
        ↓
Review Transaction
        ↓
Click Confirm
        ↓
Transaction Sent
        ↓
Wait for Blockchain Confirmation
        ↓
DApp Updates
```

MetaMask confirmation is required for operations such as:

- Registering a leopard
- Sponsoring a leopard
- Listing a certificate
- Cancelling a sale
- Purchasing a resale certificate
- Transferring a certificate
- Updating the Conservation Fund

---

# Sepolia Transaction Verification

Sepolia transactions can be independently checked using Sepolia Etherscan:

https://sepolia.etherscan.io/

Search for the deployed contract address:

```text
0x9F8E847b107bC786F21Dab4586dff9c5BB62E69A
```

Etherscan can be used to check:

- Transaction status
- Sender and receiver addresses
- ERC-721 certificate transfers
- Smart contract events
- Gas fees
- ETH payments
- Secondary-sale payment distribution

---

# Quick Start – Hardhat

For someone who only wants to compile and test the smart contract locally:

```bash
git clone https://github.com/sharmikha/yala-leopard-marketplace.git
cd yala-leopard-marketplace
npm install
npx hardhat compile
npx hardhat test
```

Expected result:

```text
50 passing
```

To start the local blockchain:

```bash
npx hardhat node
```

Local blockchain:

```text
http://127.0.0.1:8545
```

---

# Quick Start – Sepolia DApp

For someone who wants to check the complete deployed application:

```text
1. Clone the GitHub repository
2. Run npm install
3. Open the project in Visual Studio Code
4. Install Live Server
5. Install and unlock MetaMask
6. Select the Sepolia Test Network
7. Make sure the wallet has Sepolia test ETH
8. Open frontend/index.html with Live Server
9. Click Connect Wallet
10. Approve the MetaMask connection
11. Use the DApp
```

Frontend:

```text
http://127.0.0.1:5500/frontend/index.html
```

Sepolia contract:

```text
0x9F8E847b107bC786F21Dab4586dff9c5BB62E69A
```

---

# Important Notes

- No real ETH is required to test this project.
- Sepolia uses test ETH.
- Hardhat uses local test ETH.
- `http://127.0.0.1:8545` is the local Hardhat blockchain RPC address.
- `http://127.0.0.1:5500/frontend/index.html` is the local frontend address.
- The frontend contract address must match the blockchain network selected in MetaMask.
- Use the Sepolia contract address when MetaMask is connected to Sepolia.
- Use the locally deployed contract address when MetaMask is connected to Hardhat Localhost.
- Only the contract owner can register leopards or administer the Conservation Fund.
- Never upload wallet private keys, `.env` values or other sensitive credentials to GitHub.