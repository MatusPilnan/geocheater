const {Guessr} = require("./guessr");
const {processMail} = require("./mail-processing");
const {TemporaryMail} = require("./temporary-mail");
const newGame = document.getElementById('newGame')
const status = document.getElementById('status')

function info(msg = "hej halo") {
  status.innerText = msg
  console.log(msg)
}

var mail = new TemporaryMail();
var guessr = new Guessr();
let geoGuessrTab = undefined

chrome.tabs.query({url: '*://*.geoguessr.com/*'}, (tabs) => {
  if (tabs) {
    geoGuessrTab = tabs[0]
    status.innerText = tabs.length + ' tabs found'
  } else {
    status.innerText = 'No GeoGuessr opened'
  }
});

newGame.addEventListener('click', async () => {
  if (!geoGuessrTab) {
    geoGuessrTab = await chrome.tabs.create({url: "https://www.geoguessr.com", active: false})
  }
  const cookies = await chrome.cookies.getAll({domain: ".geoguessr.com"})
  info(`Clearing ${cookies.length} cookies`)
  for (const cookie of cookies) {
    await chrome.cookies.remove({name: cookie.name, url: "https://www" + cookie.domain + cookie.path})
  }
  info('Cookies cleared. Reloading...')
  await chrome.tabs.reload(geoGuessrTab.id, {bypassCache: true})

  // await chrome.cookies.remove({name: "JSESSIONID", url: "https://10minutemail.com/"})

  try {
    const mailAddress = await mail.getAddress()
    info(mailAddress)
    const signupResponse = await guessr.signup(mailAddress);
    info(signupResponse.nick)
    const fromGG = await mail.waitForMessage()
    const registrationLink = processMail(fromGG[0])
    await chrome.tabs.update(geoGuessrTab.id, {url: registrationLink})
    while (!geoGuessrTab.url.includes("https://www.geoguessr.com/profile/set-password")) {
      info("Waiting for set-password redirect " + geoGuessrTab.url)
      await new Promise(r => setTimeout(r, 1000));
    }
    const token = geoGuessrTab.url.substring(geoGuessrTab.url.lastIndexOf('/') + 1)
    info(`Got token: ${token}`)
    const passwordResponse = await guessr.setPassword(token)
    info("Success! Password: Papryka czerwona")
    await chrome.tabs.update(geoGuessrTab.id, {active: true, url: "https://www.geoguessr.com"});
  } catch (e) {
    info(e)
  }
})
// await chrome.tabs.update(geoGuessrTab.id, { active: true });
