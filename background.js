let browsingData = {};
let blockedSites = [];
let lastNotificationClosedTime = Date.now(); // Track the last time the notification was closed

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
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "showBreakNotification",
        });
      }
    });
  }
}

// Call the function to analyze patterns every minute
setInterval(analyzePatterns, 60 * 1000);

// Receive message from content.js when the notification is closed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "notificationClosed") {
    lastNotificationClosedTime = Date.now();
    console.log("Notification closed, resetting timer");
  } else if (request.action === "updateBlockedSites") {
    blockedSites = request.blockedSites;
  }
});
