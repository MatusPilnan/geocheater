const {Guessr} = require("./guessr");
const {TemporaryMail} = require("./temporary-mail");
const {processMail} = require("./mail-processing");


function info(msg = 'BACKGROUND SCRIPT WORKS!') {
  console.log(msg)
}

async function updateLoadingOverlay(tabId, status) {
  await chrome.storage.local.set({geoCheaterStatus: status})
  await chrome.scripting.executeScript({
    target: {tabId},
    function: () => {
      let overlay = document.getElementById("geocheater-overlay")
      chrome.storage.local.get("geoCheaterStatus", ({geoCheaterStatus: status}) => {
        console.log(status)
        if (!overlay && status) {
          var css = '.lds-ring {\n' +
            '  display: inline-block;\n' +
            '  position: relative;\n' +
            '  width: 80px;\n' +
            '  height: 80px;\n' +
            '}\n' +
            '.lds-ring div {\n' +
            '  box-sizing: border-box;\n' +
            '  display: block;\n' +
            '  position: absolute;\n' +
            '  width: 64px;\n' +
            '  height: 64px;\n' +
            '  margin: 8px;\n' +
            '  border: 8px solid #fdd;\n' +
            '  border-radius: 50%;\n' +
            '  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;\n' +
            '  border-color: #fdd transparent transparent transparent;\n' +
            '}\n' +
            '.lds-ring div:nth-child(1) {\n' +
            '  animation-delay: -0.45s;\n' +
            '}\n' +
            '.lds-ring div:nth-child(2) {\n' +
            '  animation-delay: -0.3s;\n' +
            '}\n' +
            '.lds-ring div:nth-child(3) {\n' +
            '  animation-delay: -0.15s;\n' +
            '}\n' +
            '@keyframes lds-ring {\n' +
            '  0% {\n' +
            '    transform: rotate(0deg);\n' +
            '  }\n' +
            '  100% {\n' +
            '    transform: rotate(360deg);\n' +
            '  }\n' +
            '}'
          const head = document.head || document.getElementsByTagName('head')[0];
          const style = document.createElement('style');

          head.appendChild(style);
          style.appendChild(document.createTextNode(css));

          overlay = document.createElement("div");
          overlay.id = "geocheater-overlay";
          overlay.style.position = "fixed";
          overlay.style.background = "rgba(182, 182, 182, 0.8)";
          overlay.style.top = '0';
          overlay.style.bottom = '0';
          overlay.style.width = "100vw";
          overlay.style.zIndex = '9';
          overlay.style.display = "flex";
          overlay.style.justifyContent = "center";
          overlay.style.alignItems = "center";
          overlay.style.color = "#fdd";
          overlay.style.fontSize = "xx-large";
          overlay.style.fontWeight = 'bold';

          const loading = document.createElement("div");
          overlay.appendChild(loading);
          loading.style.display = 'flex';
          loading.style.flexDirection = 'column';
          loading.style.alignItems = "center";
          loading.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>';

          const statusElement = document.createElement("p");
          statusElement.id = "geocheater-status";
          statusElement.appendChild(document.createTextNode(status));
          loading.appendChild(statusElement);

          document.body.appendChild(overlay);
        } else if (overlay && !status) {
          overlay.parentElement.removeChild(overlay)
        } else {
          const statusElement = document.getElementById('geocheater-status')
          statusElement.textContent = status
        }
      })
    }
  })
}

const defaultPassword = "Papryka czerwona";

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  new Promise(async (resolve) => {
    const mail = new TemporaryMail();
    const guessr = new Guessr();
    var geoGuessrTab = request.geoGuessrTab

    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");

    if (!geoGuessrTab) {
      geoGuessrTab = await chrome.tabs.create({url: "https://www.geoguessr.com", active: false})
    }

    const update = async (status) => {
      info(status)
      await updateLoadingOverlay(geoGuessrTab.id, status)
    }

    await chrome.tabs.update(geoGuessrTab.id, {active: true});
    await update("Signing out...")

    const cookies = await chrome.cookies.getAll({domain: ".geoguessr.com"})
    info(`Clearing ${cookies.length} cookies`)
    for (const cookie of cookies) {
      await chrome.cookies.remove({name: cookie.name, url: "https://www" + cookie.domain + cookie.path})
    }
    info('Cookies cleared. Reloading...')
    await update("Reloading...")
    await chrome.tabs.reload(geoGuessrTab.id, {bypassCache: true})
    await update("Retrieving e-mail address...")

    if (request.forceNewMail) {
      await chrome.cookies.remove({name: "JSESSIONID", url: "https://10minutemail.com/"})
    }

    try {
      const mailAddress = await mail.getAddress()
      const mailCount = await mail.getMessageCount()
      await update(`Got e-mail address: ${mailAddress} (${mailCount}). Signing up...`)
      const signupResponse = await guessr.signup(mailAddress);
      await update(`Signed up with nick: ${signupResponse.nick}. Waiting for e-mail...`)
      const fromGG = await mail.waitForMessage(mailCount)
      await update(`Got message: ${fromGG[0].subject}`)
      const registrationLink = processMail(fromGG[fromGG.length - 1])
      await update(`Registration link: ${registrationLink} - ${geoGuessrTab.id}`)
      await chrome.tabs.update(geoGuessrTab.id, {active: true, url: registrationLink});
      let retries = 0
      let url = (await chrome.tabs.get(geoGuessrTab.id)).url
      while (!url.includes("https://www.geoguessr.com/profile/set-password")) {
        await update(`Waiting for set-password redirect (${geoGuessrTab.url}) (${retries})`)
        await new Promise(r => setTimeout(r, 1000));
        retries++;
        if (retries >= 30) {
          await update(undefined)
          resolve()
          return
        }
        url = (await chrome.tabs.get(geoGuessrTab.id)).url
      }
      const token = url.substring(url.lastIndexOf('/') + 1)
      await update(`Got token: ${token}`)
      await update(`Registering with password: ${defaultPassword}`)
      const passwordResponse = await guessr.setPassword(token, defaultPassword)
      await update(`Success! Password: ${defaultPassword}`)
      await chrome.tabs.update(geoGuessrTab.id, {active: true, url: "https://www.geoguessr.com"});
    } catch (e) {
      await update(e.toString())
    }
  })
  sendResponse()
})
