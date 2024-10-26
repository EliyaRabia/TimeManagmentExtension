function normalizeSiteInput(siteInput) {
  let url;

  try {
    // Attempt to create a URL object from the input
    url = new URL(siteInput);
    return url.hostname.replace(/^www\./, ""); // Remove "www." for consistency
  } catch (e) {
    // If it fails, we handle it as a simple domain name
    const domainParts = siteInput.split(".");
    if (domainParts.length === 1) {
      return `${siteInput}.com`; // For inputs like "youtube"
    }
    return siteInput.replace(/^www\./, ""); // Remove "www." for consistency
  }
}

chrome.storage.local.get("blockedSites", (data) => {
  const blockedSites = data.blockedSites || [];
  const currentUrl = normalizeSiteInput(window.location.hostname);

  // Check if the current site is blocked
  updateBlockOverlay(blockedSites, currentUrl);
});

// Listen for messages from popup.js and background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBlockedSites") {
    chrome.storage.local.get("blockedSites", (data) => {
      const blockedSites = data.blockedSites || [];
      const currentUrl = normalizeSiteInput(window.location.hostname);
      updateBlockOverlay(blockedSites, currentUrl);
    });
  } else if (request.action === "showBreakNotification") {
    chrome.storage.local.get("blockedSites", (data) => {
      const blockedSites = data.blockedSites || [];
      const currentUrl = normalizeSiteInput(window.location.hostname);
      if (!blockedSites.includes(currentUrl)) {
        showBreakNotification();
      }
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
        <p>.You have added this site to the blocked list</p>
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
                // Notify the background script to restart the time counting
                chrome.runtime.sendMessage({
                  action: "unblockSite",
                  url: currentUrl,
                });
                // Re-execute content scripts on all open tabs
                chrome.tabs.query({}, (tabs) => {
                  tabs.forEach((tab) => {
                    chrome.scripting.executeScript({
                      target: { tabId: tab.id },
                      files: ["content.js"],
                    });
                  });
                });
              });
            }
          });
        });

      // Notify the background script to pause the time counting
      chrome.runtime.sendMessage({
        action: "blockSite",
        url: currentUrl,
      });
    }
  } else {
    // If the site is not blocked, remove the overlay if it exists
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
  }
}

function showBreakNotification() {
  const existingNotification = document.getElementById("break-notification");
  if (existingNotification) {
    document.body.removeChild(existingNotification);
  }

  const notification = document.createElement("div");
  notification.id = "break-notification";
  notification.style.position = "fixed";
  notification.style.top = "50%";
  notification.style.left = "50%";
  notification.style.transform = "translate(-50%, -50%)";
  notification.style.backgroundColor = "#f8f9fa";
  notification.style.border = "2px solid #007bff";
  notification.style.padding = "30px";
  notification.style.zIndex = "10000";
  notification.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.5)";
  notification.style.borderRadius = "10px";
  notification.style.textAlign = "center";
  notification.style.fontFamily = "Arial, sans-serif";
  notification.style.color = "#333";
  notification.innerHTML = `
    <h2 style="margin: 0 0 10px; color: #007bff;">Time for a break!</h2>
    <p style="margin: 0 0 20px;">You've been active for a minute. Take a short break.</p>
    <button id="close-notification" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
  `;

  document.body.appendChild(notification);

  // Ensure the event listener is attached correctly
  document
    .getElementById("close-notification")
    .addEventListener("click", () => {
      document.body.removeChild(notification);
      chrome.runtime.sendMessage({ action: "notificationClosed" }); // Send message to background.js
    });
}
