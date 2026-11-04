import "./app/styles.css";
import { mountShell } from "./app/shell";

mountShell(document.getElementById("app")!);

// When a new version installs, the offline copy takes over at once; reload so the
// player sees it now instead of on their next visit. Skipped on the very first install.
if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}
