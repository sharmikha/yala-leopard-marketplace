async function registerLeopard() {
  const leopardIdInput =
    document.getElementById("leopardId");

  const leopardNameInput =
    document.getElementById("leopardName");

  const territoryInput =
    document.getElementById("territory");

  const descriptionInput =
    document.getElementById("description");

  const conservationStatusInput =
    document.getElementById("conservationStatus");

  const imageURIInput =
    document.getElementById("imageURI");

  const sponsorshipPriceInput =
    document.getElementById("sponsorshipPrice");

  const statusElement =
    document.getElementById("registrationStatus");

  if (
    !leopardIdInput ||
    !leopardNameInput ||
    !territoryInput ||
    !descriptionInput ||
    !conservationStatusInput ||
    !imageURIInput ||
    !sponsorshipPriceInput
  ) {
    console.error(
      "Registration form elements are missing."
    );
    return;
  }

  const leopardId =
    leopardIdInput.value.trim();

  const leopardName =
    leopardNameInput.value.trim();

  const territory =
    territoryInput.value.trim();

  const description =
    descriptionInput.value.trim();

  const conservationStatus =
    conservationStatusInput.value.trim();

  const imageURI =
    imageURIInput.value.trim();

  const sponsorshipPrice =
    sponsorshipPriceInput.value.trim();

  if (
    !leopardId ||
    !leopardName ||
    !territory ||
    !description ||
    !conservationStatus ||
    !imageURI ||
    !sponsorshipPrice
  ) {
    showRegistrationStatus(
      "Please complete all fields.",
      true
    );
    return;
  }

  const priceNumber =
    Number(sponsorshipPrice);

  if (
    Number.isNaN(priceNumber) ||
    priceNumber <= 0
  ) {
    showRegistrationStatus(
      "Please enter a valid sponsorship price.",
      true
    );
    return;
  }

  try {
    showRegistrationStatus(
      "Connecting wallet...",
      false
    );

    const marketplaceContract =
      await getConnectedContract();

    if (!marketplaceContract) {
      showRegistrationStatus(
        "Please connect your MetaMask wallet.",
        true
      );
      return;
    }

    const account =
      await getConnectedAccount();

    if (!account) {
      showRegistrationStatus(
        "Wallet is not connected.",
        true
      );
      return;
    }

    const adminAddress =
      await marketplaceContract.owner();

    if (
      account.toLowerCase() !==
      adminAddress.toLowerCase()
    ) {
      showRegistrationStatus(
        "Only the contract administrator can register leopards.",
        true
      );
      return;
    }

    const sponsorshipPriceWei =
      ethers.parseEther(sponsorshipPrice);

    showRegistrationStatus(
      "Please confirm the transaction in MetaMask...",
      false
    );

    const transaction =
      await marketplaceContract.registerLeopard(
        leopardId,
        leopardName,
        territory,
        description,
        conservationStatus,
        imageURI,
        sponsorshipPriceWei
      );

    showRegistrationStatus(
      "Transaction submitted. Waiting for confirmation...",
      false
    );

    await transaction.wait();

    showRegistrationStatus(
      "Leopard registered successfully.",
      false
    );

    clearRegistrationForm();

  } catch (error) {
    console.error(
      "Leopard registration failed:",
      error
    );

    let message =
      "Leopard registration failed.";

    if (
      error?.code === 4001 ||
      error?.code === "ACTION_REJECTED"
    ) {
      message =
        "Transaction was cancelled in MetaMask.";
    }

    showRegistrationStatus(
      message,
      true
    );
  }
}

function showRegistrationStatus(
  message,
  isError
) {
  const statusElement =
    document.getElementById("registrationStatus");

  if (!statusElement) {
    if (isError) {
      console.error(message);
    } else {
      console.log(message);
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

function clearRegistrationForm() {
  const form =
    document.getElementById("registerLeopardForm");

  if (form) {
    form.reset();
  }
}

document.addEventListener(
  "DOMContentLoaded",
  function () {
    const registerButton =
      document.getElementById("registerLeopardBtn");

    if (registerButton) {
      registerButton.addEventListener(
        "click",
        async function (event) {
          event.preventDefault();

          await registerLeopard();
        }
      );
    }
  }
);