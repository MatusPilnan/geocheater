class Guessr {
  constructor(endpoints = {
    signup: "https://www.geoguessr.com/api/v3/accounts/signup",
    setPassword: "https://www.geoguessr.com/api/v3/profiles/setpassword"
  }) {
    this.endpoints = endpoints;
  }

  async signup(email) {
    return await (await fetch(this.endpoints.signup, {
      body: JSON.stringify({ email: email }),
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })).json()
  }

  async setPassword(token, password= "Papryka czerwona") {
    return await fetch(this.endpoints.setPassword, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        password
      })
    })
  }

}

module.exports = {
  Guessr
}
