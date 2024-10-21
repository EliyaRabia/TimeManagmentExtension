let browsingData = {};
let blockedSites = ["facebook.com", "youtube.com"];
let lastNotificationClosedTime = Date.now(); // משתנה גלובלי לעקוב אחרי הזמן האחרון שבו ההודעה נסגרה

// מעקב אחרי כל העמודים שנכנסים אליהם
chrome.webNavigation.onCompleted.addListener((details) => {
  const url = new URL(details.url);
  const domain = url.hostname;

  if (!browsingData[domain]) {
    browsingData[domain] = { timeSpent: 0, lastVisit: Date.now() };
  } else {
    browsingData[domain].lastVisit = Date.now();
  }

  console.log("Visited:", domain, browsingData[domain]);
});

// ניתוח נתוני גלישה וניתוח דפוסים
function analyzePatterns() {
  let now = Date.now();

  Object.keys(browsingData).forEach((domain) => {
    let site = browsingData[domain];
    site.timeSpent += now - site.lastVisit;
    site.lastVisit = now;

    console.log("Analyzing:", domain, site);

    if (blockedSites.includes(domain) && site.timeSpent > 30 * 60 * 1000) {
      // 30 דקות
      chrome.tabs.query({ url: `*://${domain}/*` }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.remove(tab.id));
      });
    }
  });

  // המלצה על הפסקה
  const totalActiveTime = Object.values(browsingData).reduce(
    (acc, curr) => acc + curr.timeSpent,
    0
  );

  console.log("Total active time:", totalActiveTime);

  if (
    totalActiveTime > 1 * 60 * 1000 &&
    now - lastNotificationClosedTime > 1 * 60 * 1000
  ) {
    // דקה של פעילות ודקה מאז ההודעה האחרונה נסגרה
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

// קריאה לפונקציה לניתוח דפוסים כל דקה
setInterval(analyzePatterns, 60 * 1000);

// קבלת הודעה מ-content.js כאשר ההודעה נסגרת
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "notificationClosed") {
    lastNotificationClosedTime = Date.now();
    console.log("Notification closed, resetting timer");
  }
});
