document.getElementById("addSite").addEventListener("click", () => {
  const site = document.getElementById("blockList").value.trim();

  if (site) {
    chrome.storage.local.get("blockedSites", (data) => {
      let blockedSites = data.blockedSites || [];
      blockedSites.push(site);

      chrome.storage.local.set({ blockedSites }, () => {
        updateBlockedSitesList();
      });
    });
  }
});

function updateBlockedSitesList() {
  chrome.storage.local.get("blockedSites", (data) => {
    const blockedSites = data.blockedSites || [];
    const list = document.getElementById("blockedSites");
    list.innerHTML = "";

    blockedSites.forEach((site) => {
      const li = document.createElement("li");
      li.textContent = site;
      list.appendChild(li);
    });
  });
}

updateBlockedSitesList();
