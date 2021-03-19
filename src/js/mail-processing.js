function processMail(mail) {
  const content = mail.bodyHtmlContent
  const anchor = content.match(/<a(.|\n|\r)*?Complete registration(.|\n|\r)*?<\/a>/)[0]
  console.log(anchor)
  return anchor.match(/href="(.*?)"/)[1].toString()
}

module.exports = {
  processMail
}
