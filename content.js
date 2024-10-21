// content.js

let notificationVisible = false;

function showBreakNotification() {
  if (notificationVisible) return;

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
  notificationVisible = true;

  document
    .getElementById("close-notification")
    .addEventListener("click", () => {
      document.body.removeChild(notification);
      notificationVisible = false;
      chrome.runtime.sendMessage({ action: "notificationClosed" }); // שליחת הודעה ל-background.js
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showBreakNotification") {
    console.log("Received break notification");
    showBreakNotification();
  }
});
