function analyzeUserBehavior(browsingData) {
  let activeTime = Object.values(browsingData).reduce(
    (acc, site) => acc + site.timeSpent,
    0
  );

  let breakRecommendation = "Keep going!";

  if (activeTime > 60 * 60 * 1000) {
    breakRecommendation = "It's time for a break!";
  }

  return breakRecommendation;
}

setInterval(() => {
  chrome.storage.local.get("browsingData", (data) => {
    const browsingData = data.browsingData || {};
    const recommendation = analyzeUserBehavior(browsingData);

    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/icon32.png",
      title: "Recommendation",
      message: recommendation,
    });
  });
}, 10 * 60 * 1000); // בדיקה כל 10 דקות
