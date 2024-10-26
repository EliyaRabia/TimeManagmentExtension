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
  console.log("Add Site button clicked, site:", site);

  if (site) {
    const normalizedSite = normalizeSiteInput(site.toLowerCase());
    console.log("Normalized site:", normalizedSite);

    chrome.storage.local.get("blockedSites", (data) => {
      let blockedSites = data.blockedSites || [];
      console.log("Current blocked sites:", blockedSites);

      // Add the normalized site if it doesn't already exist
      if (!blockedSites.includes(normalizedSite)) {
        blockedSites.push(normalizedSite);
        console.log("Updated blocked sites:", blockedSites);

        chrome.storage.local.set({ blockedSites }, () => {
          updateBlockedSitesList();
          console.log("Blocked sites updated in storage");

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

document.getElementById("openSettings").addEventListener("click", () => {
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("settingsContent").style.display = "block";
  // Fetch and display the break time from storage
  chrome.storage.local.get("breakTime", (data) => {
    const breakTime = data.breakTime || 60;
    document.getElementById("breakTime").value = breakTime;
    document.getElementById(
      "currentBreakTime"
    ).textContent = `Current set up time is ${breakTime} minutes`;
  });
});

document.getElementById("goBack").addEventListener("click", () => {
  document.getElementById("settingsContent").style.display = "none";
  document.getElementById("mainContent").style.display = "block";
});

document.getElementById("setBreakTime").addEventListener("click", () => {
  const breakTime = parseInt(document.getElementById("breakTime").value, 10);
  if (!isNaN(breakTime) && breakTime > 0) {
    chrome.storage.local.set({ breakTime });
    chrome.runtime.sendMessage({ action: "updateBreakTime", breakTime });
    document.getElementById(
      "currentBreakTime"
    ).textContent = `Current set up time is ${breakTime} minutes`;
    console.log("Break time set to:", breakTime, "minutes");
  } else {
    alert("Please enter a valid break time.");
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

// Load settings from storage
chrome.storage.local.get(["breakTime"], (data) => {
  if (data.breakTime) {
    document.getElementById("breakTime").value = data.breakTime;
    document.getElementById(
      "currentBreakTime"
    ).textContent = `Current set up time is ${data.breakTime} minutes`;
  } else {
    document.getElementById(
      "currentBreakTime"
    ).textContent = `Current set up time is 60 minutes`;
  }
});
