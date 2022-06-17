  require('./settings')
  const { default: chikaConnect, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@adiwajshing/baileys")
  const { state, saveState } = useSingleFileAuthState(`./${sessionName}.json`)
  const pino = require('pino')
  const { Boom } = require('@hapi/boom')
  const fs = require('fs')
  const cfonts  = require('cfonts')
  const yargs = require('yargs/yargs')
  const chalk = require('chalk')
  const FileType = require('file-type')
  const path = require('path')
  const _ = require('lodash')
  const PhoneNumber = require('awesome-phonenumber')
  const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
  const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/myfunc')

  // Language
  const  { ind } = require(`./language`)
  lang = ind // Language

  var low
  try {
  low = require('lowdb')
  } catch (e) {
  low = require('./lib/lowdb')
  }

  const { Low, JSONFile } = low
  const mongoDB = require('./lib/mongoDB')

  global.api = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
  new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
  new mongoDB(opts['db']) :
  new JSONFile(`database/database.json`)
  )
  global.DATABASE = global.db // Backwards Compatibility
  global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
  users: {},
  chats: {},
  database: {},
  game: {},
  settings: {},
  others: {},
  sticker: {},
  sewa: {},
  ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
  }
  loadDatabase()

  // save database every 30seconds
  if (global.db) setInterval(async () => {
  if (global.db.data) await global.db.write()
  }, 30 * 1000)

  async function startchika() {
  cfonts.say('Nor-Md', {
  font: 'block',
  gradient: ['red','magenta'],
  align: 'center',
  })
  cfonts.say(`Bot WhatsApp By Juvian\nJangan Lupa Subscribe Channel (Juvian Senpai)`, {
  font: 'console',
  align: 'center',
  gradient: ['red', 'magenta']
  })
  const chika = chikaConnect({
  logger: pino({ level: 'silent' }),
  printQRInTerminal: true,
  browser: ['Bot By Riy','Safari','1.0.0'],
  auth: state
  })

  store.bind(chika.ev)
    
  // anticall auto block
  chika.ws.on('CB:call', async (json) => {
  const callerId = json.content[0].attrs['call-creator']
  if (json.content[0].tag == 'offer') {
  let pa7rick = await chika.sendContact(callerId, global.owner)
  chika.sendMessage(callerId, { text: `Sistem otomatis block!\nJangan menelpon bot!\nSilahkan Hubungi Owner Untuk Dibuka !`}, { quoted : pa7rick })
  await sleep(8000)
  await chika.updateBlockStatus(callerId, "block")
  }
  })

  chika.ev.on('messages.upsert', async chatUpdate => {
  // console.log(JSON.stringify(chatUpdate, undefined, 2))
  try {
  mek = chatUpdate.messages[0]
  if (!mek.message) return
  mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
  if (mek.key && mek.key.remoteJid === 'status@broadcast') return
  if (!chika.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
  if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
  m = smsg(chika, mek, store)
  require("./index")(chika, m, chatUpdate, store)
  } catch (err) {
  console.log(err)
  }
  })
    
  // Group Update
  chika.ev.on('groups.update', async pea => {
  //console.log(pea)
   
  // Get Profile Picture Group
  try {
  ppgc = await chika.profilePictureUrl(pea[0].id, 'image')
  } catch {
  ppgc = 'https://shortlink.fatiharridho.my.id/rg1oT'
  }
  let wm_fatih = { url : ppgc }
  if (pea[0].announce == true) {
  chika.send5ButImg(pea[0].id, `「 Group Settings Change 」\n\nGroup telah ditutup oleh admin, Sekarang hanya admin yang dapat mengirim pesan !`, `Group Settings Change Message`, wm_fatih, [])
  } else if(pea[0].announce == false) {
  chika.send5ButImg(pea[0].id, `「 Group Settings Change 」\n\nGroup telah dibuka oleh admin, Sekarang peserta dapat mengirim pesan !`, `Group Settings Change Message`, wm_fatih, [])
  } else if (pea[0].restrict == true) {
  chika.send5ButImg(pea[0].id, `「 Group Settings Change 」\n\nInfo group telah dibatasi, Sekarang hanya admin yang dapat mengedit info group !`, `Group Settings Change Message`, wm_fatih, [])
  } else if (pea[0].restrict == false) {
  chika.send5ButImg(pea[0].id, `「 Group Settings Change 」\n\nInfo group telah dibuka, Sekarang peserta dapat mengedit info group !`, `Group Settings Change Message`, wm_fatih, [])
  } else {
  chika.send5ButImg(pea[0].id, `「 Group Settings Change 」\n\nGroup Subject telah diganti menjadi *${pea[0].subject}*`, `Group Settings Change Message`, wm_fatih, [])
  }
  })

  chika.ev.on('group-participants.update', async (anu) => {
  console.log(anu)
  try {
  let metadata = await chika.groupMetadata(anu.id)
  let participants = anu.participants
  for (let num of participants) {
            	
  // Get Pp Group And User
  try {
  ppuser = await riy.profilePictureUrl(num, 'image')
  } catch {
  ppuser = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
  }
  try {
  ppgroup = await riy.profilePictureUrl(anu.id, 'image')
  } catch {
  ppgroup = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
  }
  // Welcome / Leave
  if (anu.action == 'add') {
  tekswell = `Hai Kak @${num.split('@')[0]} 👋\nSelamat Datang Di Grup ${metadata.subject}\n\n`
  let btnwel = [{buttonId: 'Riy', buttonText: {displayText: 'Welcome Kak 👋'}, type: 1},]
  chika.sendMessage(anu.id, { image: { url: ppuser }, contextInfo: { mentionedJid: [num] }, caption: tekswell+lang.welcome(), footer: `© ${ownername}`, buttons: btnwel})
  } else if (anu.action == 'remove') {
  teksbye = `Sayonaraa @${num.split("@")[0]} 👋\nKeluar Dari Grup ${metadata.subject}\n\n`
  let btnbye = [{buttonId: 'Riy', buttonText: {displayText: 'Goodbye Kak 👋'}, type: 1},]
  chika.sendMessage(anu.id, { image: { url: ppuser }, contextInfo: { mentionedJid: [num] }, caption: teksbye+lang.leave(), footer: `© ${ownername}`, buttons: btnbye})
  }
  }
  } catch (err) {
  console.log(err)
  }
  })
  
  // Auto Bio
  chika.setStatus = (status) => {
  chika.query({
  tag: 'iq',
  attrs: {
  to: '@s.whatsapp.net',
  type: 'set',
  xmlns: 'status',
  },
  content: [{
  tag: 'status',
  attrs: {},
  content: Buffer.from(status, 'utf-8')
  }]
  })
  return status
  }
	
  // Setting
  chika.decodeJid = (jid) => {
  if (!jid) return jid
  if (/:\d+@/gi.test(jid)) {
  let decode = jidDecode(jid) || {}
  return decode.user && decode.server && decode.user + '@' + decode.server || jid
  } else return jid
  }
    
  chika.ev.on('contacts.update', update => {
  for (let contact of update) {
  let id = chika.decodeJid(contact.id)
  if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
  }
  })

  // Get Name User
  chika.getName = (jid, withoutContact  = false) => {
  id = chika.decodeJid(jid)
  withoutContact = chika.withoutContact || withoutContact 
  let v
  if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
  v = store.contacts[id] || {}
  if (!(v.name || v.subject)) v = chika.groupMetadata(id) || {}
  resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
  })
  else v = id === '0@s.whatsapp.net' ? {
  id,
  name: 'WhatsApp'
  } : id === chika.decodeJid(chika.user.id) ?
  chika.user :
  (store.contacts[id] || {})
  return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
  }
    
  // Send Kontak
  chika.sendContact = async (jid, kon, quoted = '', opts = {}) => {
  let list = []
  for (let i of kon) {
  list.push({
  displayName: await chika.getName(i + '@s.whatsapp.net'),
  vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await chika.getName(i + '@s.whatsapp.net')}\nFN:${await chika.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
  })
  }
  chika.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
  }
    
  // Auto Bio
  chika.setStatus = (status) => {
  chika.query({
  tag: 'iq',
  attrs: {
  to: '@s.whatsapp.net',
  type: 'set',
  xmlns: 'status',
  },
  content: [{
  tag: 'status',
  attrs: {},
  content: Buffer.from(status, 'utf-8')
  }]
  })
  return status
  }

  // Setting Public / Self
  chika.public = true

  chika.serializeM = (m) => smsg(chika, m, store)
  
  chika.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update	    
  if (connection === 'close') {
  let reason = new Boom(lastDisconnect?.error)?.output.statusCode
  if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); chika.logout(); }
  else if (reason === DisconnectReason.connectionClosed) { console.log("Connection closed, reconnecting...."); startchika(); }
  else if (reason === DisconnectReason.connectionLost) { console.log("Connection Lost from Server, reconnecting..."); startchika(); }
  else if (reason === DisconnectReason.connectionReplaced) { console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); chika.logout(); }
  else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Scan Again And Run.`); chika.logout(); }
  else if (reason === DisconnectReason.restartRequired) { console.log("Restart Required, Restarting..."); startchika(); }
  else if (reason === DisconnectReason.timedOut) { console.log("Connection TimedOut, Reconnecting..."); startchika(); }
  else chika.end(`Unknown DisconnectReason: ${reason}|${connection}`)
  }
  console.log('Connected...', update)
  })

  chika.ev.on('creds.update', saveState)

  // Send List Menu
  chika.sendListMenu = async (jid , title = '' , text = '' , footer = '' , but = '' , options = {}) =>{
  var template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
  listMessage :{
  title: title,
  description: text,
  footerText: footer,
  buttonText: but,
  listType: "SINGLE_SELECT",
  sections: [
  { "title": "🤖 All Menu Bot" , "rows": [ { "title": "All Menu" , "description": "Menampilkan Semua Fitur Bot" , "rowId": `allmenu` } ] },
  { "title": "🤖 Sub Menu-1" , "rows": [ { "title": "Bot Info", "description": "Menampilkan Information Bot" , "rowId": `botinfo` } ] },
  { "title": "👥 Sub Menu-2" , "rows": [ { "title": "Group Command", "description": "Menampilkan Fitur Group" , "rowId": `groupcmd` } ] },
  { "title": "🧑 Sub Menu-3" , "rows": [ { "title": "Owner Command", "description": "Menampilkan Fitur Owner" , "rowId": `ownercmd` } ] },
  { "title": "🗃️ Sub Menu-4" , "rows": [ { "title": "Database Command", "description": "Menampilkan Fitur Database" , "rowId": `databasecmd` } ] },
  { "title": "🔎 Sub Menu-5" , "rows": [ { "title": "Search Command", "description": "Menampilkan Fitur Search" , "rowId": `searchcmd` } ] },
  { "title": "📥 Sub Menu-6" , "rows": [ { "title": "Downloader Command", "description": "Menampilkan Fitur Downloader" , "rowId": `downloadercmd` } ] },
  { "title": "⌛ Sub Menu-7" , "rows": [ { "title": "Converter Command", "description": "Menampilkan Fitur Converter" , "rowId": `convertercmd` } ] },
  { "title": "🗽 Sub Menu-8" , "rows": [ { "title": "Textpro Command", "description": "Menampilkan Fitur Textpro" , "rowId": `textprocmd` } ] },
  { "title": "📸 Sub Menu-9" , "rows": [ { "title": "Photooxy Command", "description": "Menampilkan Fitur Photooxy" , "rowId": `photooxycmd` } ] },
  { "title": "🖼️ Sub Menu-10" , "rows": [ { "title": "Ephoto360 Command", "description": "Menampilkan Fitur Ephoto360" , "rowId": `ephoto360cmd` } ] },
  { "title": "⛩️ Sub Menu-11" , "rows": [ { "title": "Anime Command", "description": "Menampilkan Fitur Anime" , "rowId": `animecmd` } ] },
  { "title": "🔞 Sub Menu-12" , "rows": [ { "title": "Nsfw Command", "description": "Menampilkan Fitur Nsfw" , "rowId": `nsfwcmd` } ] },
  { "title": "🎮 Sub Menu-13" , "rows": [ { "title": "Game Command", "description": "Menampilkan Fitur Game" , "rowId": `gamecmd` } ] },
  { "title": "🤹 Sub Menu-14" , "rows": [ { "title": "Fun Command", "description": "Menampilkan Fitur Fun" , "rowId": `funcmd` } ] },
  { "title": "🕊️ Sub Menu-15" , "rows": [ { "title": "Primbon Command", "description": "Menampilkan Fitur Primbon" , "rowId": `primboncmd` } ] },
  { "title": "📚 Sub Menu-16" , "rows": [ { "title": "Cerpen Command", "description": "Menampilkan Fitur Cerpen" , "rowId": `cerpencmd` } ] },
  { "title": "👧 Sub Menu-17" , "rows": [ { "title": "Cecan Command", "description": "Menampilkan Fitur Cecan" , "rowId": `cecancmd` } ] },
  { "title": "🧖 Sub Menu-18" , "rows": [ { "title": "Asupan Command", "description": "Menampilkan Fitur Asupan" , "rowId": `asupancmd` } ] },
  { "title": "🕌 Sub Menu-19" , "rows": [ { "title": "Islamic Command", "description": "Menampilkan Fitur Islamic" , "rowId": `islamiccmd` } ] },
  { "title": "🎶 Sub Menu-20" , "rows": [ { "title": "Sound Command", "description": "Menampilkan Fitur Sound" , "rowId": `soundcmd` } ] },
  { "title": "🎙️ Sub Menu-21" , "rows": [ { "title": "Voice Charger Command", "description": "Menampilkan Fitur Voice Charger" , "rowId": `voicecharger` } ] },
  { "title": "🎟️ Sub Menu-22" , "rows": [ { "title": "Telegram Sticker Command", "description": "Menampilkan Fitur Telegram Sticker" , "rowId": `telegramstickercmd` } ] },
  { "title": "⛳ Sub Menu-23" , "rows": [ { "title": "Others Command", "description": "Menampilkan Fitur Others" , "rowId": `otherscmd` } ] },
  { "title": "🌱 Sub Menu-24" , "rows": [ { "title": "Source Code", "description": "Menampilkan Informasi Script Bot Ini" , "rowId": `sourcecode` } ] },
  { "title": "🙏 Thanks To" , "rows": [ { "title": "Contributor" , "description": "Menampilkan List Thanks To" , "rowId": `tqto` } ] }
  ],
  listType: 1
  }
  }), options)
  chika.relayMessage(m.chat, template.message, { messageId: template.key.id })
  }
    
  // Send Catalog
  chika.sendCatalog = async (jid , but = '' , text = '' , footer = '' , img , options = {}) =>{
  var messa = await prepareWAMessageMedia({ image: img}, { upload: chika.waUploadToServer })
  var catalog = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
  "productMessage": {
  "product": {
  "productImage": messa.imageMessage,
  "productId": "7091718154232528",
  "title": but,
  "description": text,
  "footerText": footer, 
  "currencyCode": "IDR",
  "priceAmount1000": "100000000000000000", 
  "productImageCount": 1,
  "firstImageId": 1,
  "salePriceAmount1000": "1000",
  "retailerId": `© ${ownername}`,
  "url": `${youtube}`
  },
  "businessOwnerJid": `${ownernomer}@s.whatsapp.net`,
  }
  }), options)
  chika.relayMessage(m.chat, catalog.message, { messageId: catalog.key.id })
  }

  // Send 5 Button Image
  chika.send5ButImg = async (jid , text = '' , footer = '', img, but = [], options = {}) =>{
  let message = await prepareWAMessageMedia({ image: img }, { upload: chika.waUploadToServer })
  var template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
  templateMessage: {
  hydratedTemplate: {
  imageMessage: message.imageMessage,
  "hydratedContentText": text,
  "hydratedFooterText": footer,
  "hydratedButtons": but
  }
  }
  }), options)
  chika.relayMessage(jid, template.message, { messageId: template.key.id })
  }

  // Send 5 Button Gif
  chika.send5ButGif = async (jid , text = '' , footer = '', video, but = [], options = {}) =>{
  let message = await prepareWAMessageMedia({ video: video, gifPlayback: true }, { upload: chika.waUploadToServer })
  const template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
  templateMessage: {
  hydratedTemplate: {
  videoMessage: message.videoMessage,
  "hydratedContentText": text,
  "hydratedFooterText": footer,
  "hydratedButtons": but
  }
  }
  }), options)
  chika.relayMessage(jid, template.message, { messageId: template.key.id })
  }

  // Send Button Text
  chika.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
  let buttonMessage = {
  text,
  footer,
  buttons,
  headerType: 2,
  ...options
  }
  chika.sendMessage(jid, buttonMessage, { quoted, ...options })
  }

  // Send Text
  chika.sendText = (jid, text, quoted = '', options) => chika.sendMessage(jid, { text: text, ...options }, { quoted })

  // Send Image
  chika.sendImage = async (jid, path, caption = '', quoted = '', options) => {
  let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
  return await chika.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
  }
  
  // Send Video
  chika.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
  let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
  return await chika.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted })
  }

  // Send Audio
  chika.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
  let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
  return await chika.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted })
  }

  // Send Text With Mentions
  chika.sendTextWithMentions = async (jid, text, quoted, options = {}) => chika.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

  // Send Image Sticker
  chika.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
  let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
  let buffer
  if (options && (options.packname || options.author)) {
  buffer = await writeExifImg(buff, options)
  } else {
  buffer = await imageToWebp(buff)
  }
  await chika.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
  return buffer
  }

  // Send Video Sticker
  chika.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
  let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
  let buffer
  if (options && (options.packname || options.author)) {
  buffer = await writeExifVid(buff, options)
  } else {
  buffer = await videoToWebp(buff)
  }
  await chika.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
  return buffer
  }

  // Download Media
  chika.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
  let quoted = message.msg ? message.msg : message
  let mime = (message.msg || message).mimetype || ''
  let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
  const stream = await downloadContentFromMessage(quoted, messageType)
  let buffer = Buffer.from([])
  for await(const chunk of stream) {
  buffer = Buffer.concat([buffer, chunk])
  }
  let type = await FileType.fromBuffer(buffer)
  trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
  // Save To File
  await fs.writeFileSync(trueFileName, buffer)
  return trueFileName
  }
  chika.downloadMediaMessage = async (message) => {
  let mime = (message.msg || message).mimetype || ''
  let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
  const stream = await downloadContentFromMessage(message, messageType)
  let buffer = Buffer.from([])
  for await(const chunk of stream) {
  buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
  } 

  // Send Media
  chika.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
  let types = await chika.getFile(path, true)
  let { mime, ext, res, data, filename } = types
  if (res && res.status !== 200 || file.length <= 65536) {
  try { throw { json: JSON.parse(file.toString()) } }
  catch (e) { if (e.json) throw e.json }
  }
  let type = '', mimetype = mime, pathFile = filename
  if (options.asDocument) type = 'document'
  if (options.asSticker || /webp/.test(mime)) {
  let { writeExif } = require('./lib/exif')
  let media = { mimetype: mime, data }
  pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] })
  await fs.promises.unlink(filename)
  type = 'sticker'
  mimetype = 'image/webp'
  }
  else if (/image/.test(mime)) type = 'image'
  else if (/video/.test(mime)) type = 'video'
  else if (/audio/.test(mime)) type = 'audio'
  else type = 'document'
  await chika.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
  return fs.promises.unlink(pathFile)
  }

  // Copy Forward
  chika.copyNForward = async (jid, message, forceForward = false, options = {}) => {
  let vtype
  if (options.readViewOnce) {
  message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
  vtype = Object.keys(message.message.viewOnceMessage.message)[0]
  delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
  delete message.message.viewOnceMessage.message[vtype].viewOnce
  message.message = {
  ...message.message.viewOnceMessage.message
  }
  }

  let mtype = Object.keys(message.message)[0]
  let content = await generateForwardMessageContent(message, forceForward)
  let ctype = Object.keys(content)[0]
  let context = {}
  if (mtype != "conversation") context = message.message[mtype].contextInfo
  content[ctype].contextInfo = {
  ...context,
  ...content[ctype].contextInfo
  }
  const waMessage = await generateWAMessageFromContent(jid, content, options ? {
  ...content[ctype],
  ...options,
  ...(options.contextInfo ? {
  contextInfo: {
  ...content[ctype].contextInfo,
  ...options.contextInfo
  }
  } : {})
  } : {})
  await chika.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
  return waMessage
  }

  // cMod
  chika.cMod = (jid, copy, text = '', sender = chika.user.id, options = {}) => {
  // let copy = message.toJSON()
  let mtype = Object.keys(copy.message)[0]
  let isEphemeral = mtype === 'ephemeralMessage'
  if (isEphemeral) {
  mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
  }
  let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
  let content = msg[mtype]
  if (typeof content === 'string') msg[mtype] = text || content
  else if (content.caption) content.caption = text || content.caption
  else if (content.text) content.text = text || content.text
  if (typeof content !== 'string') msg[mtype] = {
  ...content,
  ...options
  }
  if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
  else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
  if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
  else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
  copy.key.remoteJid = jid
  copy.key.fromMe = sender === chika.user.id
  return proto.WebMessageInfo.fromObject(copy)
  }

  // Get File
  chika.getFile = async (PATH, save) => {
  let res
  let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
  // if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
  let type = await FileType.fromBuffer(data) || {
  mime: 'application/octet-stream',
  ext: '.bin'
  }
  filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
  if (data && save) fs.promises.writeFile(filename, data)
  return {
  res,
  filename,
  size: await getSizeMedia(data),
  ...type,
  data
  }
  }
  return chika
  }
  startchika()
  
  let file = require.resolve(__filename)
  fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
  })