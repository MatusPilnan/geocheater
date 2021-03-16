const $ = require('jquery')

function processMail(mail) {
  const content = mail.bodyHtmlContent
  const mailDom = $(content, document)
  const registrationLink = mailDom.find('a:contains("Complete registration")')[0].href
  console.log(registrationLink)
  return registrationLink
}

module.exports = {
  processMail
}
