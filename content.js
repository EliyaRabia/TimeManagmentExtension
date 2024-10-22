chrome.storage.local.get("blockedSites", (data) => {
  const blockedSites = data.blockedSites || [];
  const currentUrl = window.location.hostname.replace(/^www\./, "");

  // Check if the current site is blocked
  updateBlockOverlay(blockedSites, currentUrl);
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockedSites") {
    chrome.storage.local.get("blockedSites", (data) => {
      const blockedSites = data.blockedSites || [];
      const currentUrl = window.location.hostname.replace(/^www\./, "");
      updateBlockOverlay(blockedSites, currentUrl);
    });
  }
});

function updateBlockOverlay(blockedSites, currentUrl) {
  const existingOverlay = document.getElementById("block-overlay");
  const isBlocked = blockedSites.includes(currentUrl);

  // If the site is blocked, show the overlay
  if (isBlocked) {
    if (!existingOverlay) {
      const overlay = document.createElement("div");
      overlay.id = "block-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      overlay.style.color = "white";
      overlay.style.display = "flex";
      overlay.style.flexDirection = "column";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "10000";
      overlay.innerHTML = `
        <h1>This site is blocked</h1>
        <p>You have added this site to the blocked list.</p>
        <button id="delete-blocked-site">Unblock Site</button>
      `;

      document.body.appendChild(overlay);

      document
        .getElementById("delete-blocked-site")
        .addEventListener("click", () => {
          chrome.storage.local.get("blockedSites", (data) => {
            let blockedSites = data.blockedSites || [];
            const index = blockedSites.indexOf(currentUrl);
            if (index > -1) {
              blockedSites.splice(index, 1);
              chrome.storage.local.set({ blockedSites }, () => {
                document.body.removeChild(overlay);
                // Notify the popup to update the blocked sites list
                chrome.runtime.sendMessage({
                  action: "updateBlockedSites",
                  blockedSites,
                });
              });
            }
          });
        });
    }
  } else {
    // If the site is not blocked, remove the overlay if it exists
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
  }
}
