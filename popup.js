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

document.getElementById("addSite").addEventListener("click", () => {
  const site = document.getElementById("blockList").value.trim();

  if (site) {
    const normalizedSite = normalizeSiteInput(site.toLowerCase());

    chrome.storage.local.get("blockedSites", (data) => {
      let blockedSites = data.blockedSites || [];

      // Add the normalized site if it doesn't already exist
      if (!blockedSites.includes(normalizedSite)) {
        blockedSites.push(normalizedSite);

        chrome.storage.local.set({ blockedSites }, () => {
          updateBlockedSitesList();

          // Clear the input field
          document.getElementById("blockList").value = "";

          // Notify the content script to update the blocked sites
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"],
              });
            });
          });
        });
      } else {
        alert("This site is already blocked.");
      }
    });
  }
});

function updateBlockedSitesList() {
  chrome.storage.local.get("blockedSites", (data) => {
    const blockedSites = data.blockedSites || [];
    const list = document.getElementById("blockedSites");
    list.innerHTML = "";

    blockedSites.forEach((site, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${site}</span>
        <button class="editSite" data-index="${index}">Edit</button>
        <button class="deleteSite" data-index="${index}">Delete</button>
      `;
      list.appendChild(li);
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll(".editSite").forEach((button) => {
      button.addEventListener("click", handleEditSite);
    });

    document.querySelectorAll(".deleteSite").forEach((button) => {
      button.addEventListener("click", handleDeleteSite);
    });
  });
}

function handleEditSite(event) {
  const index = event.target.dataset.index;

  chrome.storage.local.get("blockedSites", (data) => {
    let blockedSites = data.blockedSites || [];
    const site = blockedSites[index];
    const newSite = prompt("Edit site:", site);

    if (newSite) {
      const normalizedNewSite = normalizeSiteInput(newSite.toLowerCase());

      blockedSites[index] = normalizedNewSite;
      chrome.storage.local.set({ blockedSites }, () => {
        updateBlockedSitesList();
        // Notify the content script to update the blocked sites
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
}

function handleDeleteSite(event) {
  const index = event.target.dataset.index;

  chrome.storage.local.get("blockedSites", (data) => {
    let blockedSites = data.blockedSites || [];
    blockedSites.splice(index, 1);

    chrome.storage.local.set({ blockedSites }, () => {
      updateBlockedSitesList();
      // Notify the content script to update the blocked sites
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });
        });
      });
    });
  });
}

updateBlockedSitesList();
