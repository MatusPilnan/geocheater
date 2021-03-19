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

  async getAddress() {
    return (await (await fetch(this.endpoints.address)).json())['address']
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
      const fromGG = messages.filter((mail) => {return mail.subject === "GeoGuessr - Complete your registration"})
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
