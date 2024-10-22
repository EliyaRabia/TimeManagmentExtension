let browsingData = {};
let blockedSites = [];
let lastNotificationClosedTime = Date.now(); // Track the last time the notification was closed
let notificationVisible = {}; // Track whether the notification is currently visible per tab

// Load blocked sites from storage
chrome.storage.local.get("blockedSites", (data) => {
  if (data.blockedSites) {
    blockedSites = data.blockedSites;
  }
});

// Track all pages visited
chrome.webNavigation.onCompleted.addListener((details) => {
  const url = new URL(details.url);
  const domain = url.hostname.replace(/^www\./, ""); // Normalize domain

  if (!browsingData[domain]) {
    browsingData[domain] = { timeSpent: 0, lastVisit: Date.now() };
  } else {
    browsingData[domain].lastVisit = Date.now();
  }

  console.log("Visited:", domain, browsingData[domain]);
});

// Analyze browsing data and patterns
function analyzePatterns() {
  let now = Date.now();

  Object.keys(browsingData).forEach((domain) => {
    let site = browsingData[domain];
    site.timeSpent += now - site.lastVisit;
    site.lastVisit = now;

    console.log("Analyzing:", domain, site);

    // Check if the site should be blocked
    if (blockedSites.includes(domain) && site.timeSpent > 30 * 60 * 1000) {
      // 30 minutes
      chrome.tabs.query({ url: `*://${domain}/*` }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.remove(tab.id));
      });
    }
  });

  // Recommend a break
  const totalActiveTime = Object.values(browsingData).reduce(
    (acc, curr) => acc + curr.timeSpent,
    0
  );

  console.log("Total active time:", totalActiveTime);

  // Check if the total active time exceeds 1 minute
  if (
    totalActiveTime > 1 * 60 * 1000 &&
    now - lastNotificationClosedTime > 1 * 60 * 1000
  ) {
    console.log("Sending break notification");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        if (!notificationVisible[tab.id]) {
          notificationVisible[tab.id] = true; // Set the flag to indicate the notification is visible for this tab
          chrome.tabs.sendMessage(tab.id, {
            action: "showBreakNotification",
          });
        }
      });
    });
  }
}

// Call the function to analyze patterns every minute
setInterval(analyzePatterns, 60 * 1000);

// Receive message from content.js when the notification is closed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "notificationClosed") {
    lastNotificationClosedTime = Date.now();
    notificationVisible[sender.tab.id] = false; // Reset the flag when the notification is closed for this tab
    console.log("Notification closed, resetting timer for tab:", sender.tab.id);
  } else if (request.action === "updateBlockedSites") {
    blockedSites = request.blockedSites;
  }
});
