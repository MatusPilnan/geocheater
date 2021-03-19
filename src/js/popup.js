const newGame = document.getElementById('newGame')
const status = document.getElementById('status')
const forceNewMail = document.getElementById('forceNewMail')
const countdown = document.getElementById('countdown')
const currentEmail = document.getElementById('currentEmail')

function updateEmail({geocheaterLastEmail: email}) {
  const remaining = Math.round((email.expires - Date.now()) / 1000)
  console.log(email)
  if (remaining >= 0) {
    currentEmail.innerText = `Current e-mail: ${email.address}`
    countdown.innerText = `New e-mail in: ${Math.floor(remaining / 60)}:${remaining % 60}`
  } else {
    currentEmail.innerText = 'No e-mail active.'
    countdown.style.display = 'none'
  }
}

window.setInterval(() => {
  chrome.storage.local.get("geocheaterLastEmail", updateEmail)
}, 1000)

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
  chrome.runtime.sendMessage({geoGuessrTab, forceNewMail: forceNewMail.checked}, function(response) {
    console.log(response);
  });

})
