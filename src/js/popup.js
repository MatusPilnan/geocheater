const newGame = document.getElementById('newGame')
const status = document.getElementById('status')

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
  chrome.runtime.sendMessage({geoGuessrTab}, function(response) {
    console.log(response);
  });

})
