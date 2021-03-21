class TemporaryMail {
  constructor(
    frequency = 10000,
    endpoints = {
      address: "https://10minutemail.com/session/address",
      count: "https://10minutemail.com/messages/messageCount",
      msgsAfter: "https://10minutemail.com/messages/messagesAfter/"
    }
  ) {
    this.frequency = frequency;
    this.endpoints = endpoints;
  }

  /**
   * Gets email from an account with last game older than 24hrs, or a new email from 10MinuteMail
   * @returns {Promise<(*|boolean)[]>} An array containing the email address (0) and a flag indicating if it is a new address (1)
   */
  async getAddress(forceNew = false) {
    const geocheaterEmails = (await new Promise(async resolve => {
      chrome.storage.local.get("geocheaterEmails", ({geocheaterEmails}) => {
        resolve(geocheaterEmails)
      })
    })) || {}

    if (!forceNew && Object.keys(geocheaterEmails).length > 0) {
      const accounts = Object.entries(geocheaterEmails)
      const availableAccounts = accounts.filter((account) => {
        return Date.now() - account[1].nextGame >= 0
      })
      if (availableAccounts.length > 0) {
        chrome.storage.local.get("geocheaterLastEmail", ({geocheaterLastEmail: lastEmail}) => {
          chrome.storage.local.set({"geocheaterLastEmail": {address: lastEmail.address, expires: lastEmail.expires}})})
        return [availableAccounts[0][0], false]
      }
    }

    const address = (await (await fetch(this.endpoints.address)).json())['address']
    chrome.storage.local.get("geocheaterLastEmail", ({geocheaterLastEmail: lastEmail}) => {
      if (!lastEmail || address !== lastEmail.address) {
        chrome.storage.local.set({"geocheaterLastEmail": {address, expires: Date.now() + 1000 * 60 * 10}})
      }
    })
    geocheaterEmails[address] = {nextGame: Date.now() - 1}
    console.log(geocheaterEmails)
    chrome.storage.local.set({geocheaterEmails})
    return [address, true]

  }

  async getMessageCount() {
    return (await (await fetch(this.endpoints.count)).json())['messageCount']
  }

  async getMessageAfter(n = 0) {
    return (await (await fetch(this.endpoints.msgsAfter + n)).json())
  }

  async waitForMessage(after = 0) {
    while (true) {
      const messages = await this.getMessageAfter(after);
      const fromGG = messages.filter((mail) => {
        return mail.subject === "GeoGuessr - Complete your registration"
      })
      if (fromGG.length > 0) {
        return fromGG
      }
      console.log("No mail.")
      await new Promise(r => setTimeout(r, this.frequency));
    }
  }

}

module.exports = {
  TemporaryMail
}
