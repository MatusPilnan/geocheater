const newGame = document.getElementById('newGame')
const status = document.getElementById('status')
const forceNewMail = document.getElementById('forceNewMail')
const countdown = document.getElementById('countdown')
const currentEmail = document.getElementById('currentEmail')
const accountList = document.getElementById('accountList')

function updateRemainingTime(element, nextGame) {
  const delta = Math.floor((nextGame - Date.now()) / 1000)
  const hours = Math.floor(delta / (60 * 60));
  const minutes = Math.floor((delta % (60 * 60)) / 60);
  const seconds = Math.floor(delta % 60);
  if (delta < 0) {
    element.innerText = 'NOW'
  } else {
    element.innerText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function addAccount(email, nextGame) {
  const account = document.createElement('tr')
  account.className = 'account';

  const emailElement = document.createElement('td')
  emailElement.innerText = email;

  const remainingElement = document.createElement('td')
  remainingElement.classList.add('remaining')
  if (Date.now() - nextGame >= 0) {
    remainingElement.innerText = 'NOW'
    remainingElement.classList.add('available')
  } else {
    window.setInterval(() => {
      updateRemainingTime(remainingElement, nextGame)
    })
  }


  account.appendChild(emailElement)
  account.appendChild(remainingElement)
  accountList.appendChild(account)
}

function updateCountdown(expires) {
  const remaining = Math.round((expires - Date.now()) / 1000)
  if (remaining >= 0) {
    countdown.innerText = `New e-mail in: ${Math.floor(remaining / 60)}:${remaining % 60}`
  } else {
    countdown.innerText = 'New 10MinuteMail available.'
  }
}

chrome.storage.local.get("geocheaterEmails", ({geocheaterEmails}) => {
  console.log(geocheaterEmails)
  const accounts = Object.entries(geocheaterEmails || {})
  accounts.sort((a, b) => {return a[1].nextGame - b[1].nextGame})
  for (const [email, details] of accounts) {
    addAccount(email, details.nextGame)
    // geocheaterEmails[email].details.nextGame = Date.now() + 1000 * 60 * 60 * 24
  }
  // chrome.storage.local.set({geocheaterEmails})
})

chrome.storage.local.get("geocheaterLastEmail", ({geocheaterLastEmail: email}) => {
  if (!email) {
    return
  }
  currentEmail.innerText = `Last used e-mail: ${email.address}`
  const remaining = Math.round((email.expires - Date.now()) / 1000)
  if (remaining >= 0) {
    window.setInterval(() => {
      updateCountdown(email.expires)
    })
  } else {
    updateCountdown(0)
  }
})


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
