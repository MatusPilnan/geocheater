const newGame = document.getElementById('newGame')
const status = document.getElementById('status')

function info(msg) {
  status.innerText = msg
}

let geoGuessrTab = undefined

chrome.tabs.query({ url: '*://*.geoguessr.com/*' }, (tabs) => {
  if (tabs) {
    geoGuessrTab = tabs[0]
    status.innerText = tabs.length + ' tabs found'
  } else {
    status.innerText = 'No GeoGuessr opened'
  }
});

newGame.addEventListener('click', async () => {
  if (geoGuessrTab) {
    const cookies = await chrome.cookies.getAll({domain: ".geoguessr.com"})
    info(`Clearing ${cookies.length} cookies`)
    for (const cookie of cookies) {
      await chrome.cookies.remove({name: cookie.name, url: "https://www" + cookie.domain + cookie.path})
    }
    info('Cookies cleared. Reloading...')
    await chrome.tabs.reload(geoGuessrTab.id, {bypassCache: true})
    info('Reloaded')
  } else {
    status.innerText = geoGuessrTab
  }
})
