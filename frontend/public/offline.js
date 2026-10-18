(function () {
  var button = document.getElementById('retry');
  var status = document.getElementById('status');

  function say(message) {
    status.textContent = message;
  }

  function reloadRequestedPage() {
    // This page is served at the URL the user asked for, so reloading retries that page.
    window.location.reload();
  }

  function retry() {
    button.disabled = true;
    say('Checking your connection...');
    // "sw-bypass" makes the service worker skip this request so it really tests the network.
    fetch('/manifest.json?sw-bypass=' + Date.now(), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('offline');
        say('Back online. Reloading...');
        reloadRequestedPage();
      })
      .catch(function () {
        say('Still offline. Check your connection and try again.');
        button.disabled = false;
      });
  }

  button.addEventListener('click', retry);
  window.addEventListener('online', retry);
})();
