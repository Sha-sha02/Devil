
const { default: makeWASocket, DisconnectReason, makeInMemoryStore, jidDecode, proto, getContentType, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const readline = require("readline");
const _ = require('lodash');
const yargs = require('yargs/yargs');
const figlet = require('figlet');
const chalk = require('chalk');
const CFonts = require('cfonts');
const PhoneNumber = require('awesome-phonenumber');
const path = require('path'); // Pastikan untuk mengimpor modul path

var low;
try {
    low = require('lowdb');
} catch (e) {
    low = require('./lib/lowdb');
}

//=================================================//
const { Low, JSONFile } = low;
const mongoDB = require('./lib/mongoDB');
const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text);
}
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
//=================================================//
// Mendeteksi folder dan file .js

function detectFoldersAndFiles() {
    const baseDir = './'; // Ganti dengan direktori yang ingin Anda periksa
    const folders = ['src']
    let folderDetails = [];
    const maxLineLength = 30; // Panjang maksimal untuk setiap baris

    console.log(chalk.cyan.bold('Loaded SuccesFully !!\n'));

    folders.forEach(folder => {
        const folderPath = path.join(baseDir, folder);
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            let formattedFiles = '';

            if (files.length > 0) {
                // Memformat nama file menjadi dua kolom
                for (let i = 0; i < files.length; i++) {
                    let fileName = files[i];

                    // Memecah nama file jika terlalu panjang
                    while (fileName.length > maxLineLength) {
                        formattedFiles += fileName.substring(0, maxLineLength) + '\n'; // Tambah baris baru
                        fileName = fileName.substring(maxLineLength); // Potong bagian yang sudah ditampilkan
                    }

                    formattedFiles += fileName; // Tambah nama file yang tersisa

                    if (i % 2 === 1) {
                        formattedFiles += ' | '; // Tambah baris baru setiap dua file
                    } else {
                        formattedFiles += ' | '; // Tambah pemisah antara file
                    }
                }
            } else {
                formattedFiles = 'No files found';
            }

            folderDetails.push({ Folder: folder, 'Nama Files': formattedFiles.trim() });
            console.log(chalk.green(`AutoMate Detected "${folder}":`));
            console.table(folderDetails);
        } else {
            console.log(chalk.red(`Folder "${folder}" not found.`));
        }
    });
}

//=================================================//
console.clear();
console.log(color(figlet.textSync("Anggazyy", {
    font: 'DOS Rebel',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: false
}), 'pink'));

console.log(chalk.white.bold(`${chalk.green.bold("📃  Informasi :")}         
✉️  Script : Devil Scripts
✉️  Version : 9.0 -WS
✉️  Author : Anggazyy Developer
✉️  Yotube : anggazyymods
✉️  Whatsapp : https://wa.me/6288804148639

${chalk.green.bold("Script Made By Anggazyy ZcoderX")}\n`));

// Memanggil fungsi deteksi folder dan file
detectFoldersAndFiles();

//=================================================//
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.db = new Low(
    /https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
    new mongoDB(opts['db']) :
    new JSONFile(`./src/database.json`)
);
global.DATABASE = global.db; // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000));
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read();
    global.db.READ = false;
    global.db.data = {
        users: {},
        chats: {},
        game: {},
        database: {},
        settings: {},
        setting: {},
        others: {},
        sticker: {},
        ...(global.db.data || {})
    };
    global.db.chain = _.chain(global.db.data);
}
loadDatabase();

const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => { rl.question(text, resolve) }) };

async function startBotz() {
    const { state, saveCreds } = await useMultiFileAuthState("session");
    const anggazyy = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    if (!anggazyy.authState.creds.registered) {
        const phoneNumber = await question('𝙼𝚊𝚜𝚞𝚔𝚊𝚗 𝙽𝚘𝚖𝚎𝚛 𝚈𝚊𝚗𝚐 𝙰𝚔𝚝𝚒𝚏 𝙰𝚠𝚊𝚕𝚒 𝙳𝚎𝚗𝚐𝚊𝚗 𝟼𝟸 :\n');
        let code = await anggazyy.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`𝙲𝙾𝙳𝙴 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 :`, code);
    }

    store.bind(anggazyy.ev);

    anggazyy.ev.on('messages.upsert', async chatUpdate => {
        try {
            mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            if (!anggazyy.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            m = smsg(anggazyy, mek, store);
            require("./anggazyy")(anggazyy, m, chatUpdate, store);
        } catch (err) {
            console.log(err);
        }
    });

    // Setting
    anggazyy.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    }

    anggazyy.getName = (jid, withoutContact= false) => {
        id = anggazyy.decodeJid(jid);
        withoutContact = anggazyy.withoutContact || withoutContact;
        let v;
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {};
            if (!(v.name || v.subject)) v = anggazyy.groupMetadata(id) || {};
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
        });
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === anggazyy.decodeJid(anggazyy.user.id) ?
            anggazyy.user :
            (store.contacts[id] || {});
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
    }

    anggazyy.public = true;

    anggazyy.serializeM = (m) => smsg(anggazyy, m, store);
    anggazyy.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.badSession || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionReplaced || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
                startBotz();
            } else if (reason === DisconnectReason.loggedOut) {
            } else {
                anggazyy.end(`Unknown DisconnectReason: ${reason}|${connection}`);
            }
        }
        if (connection === 'open') {
            const userId = JSON.stringify(anggazyy.user.id, null, 2); // Mengonversi ID ke format JSON
            console.log(chalk.green.bold('🎉 [Connected] 🎉')); // Mencetak pesan dengan warna hijau dan tebal
            console.log(chalk.yellow(`User ID: ${userId}`)); // Mencetak ID pengguna dengan warna kuning
        }
    });

    anggazyy.ev.on('creds.update', saveCreds);

    anggazyy.sendText = (jid, text, quoted = '', options) => anggazyy.sendMessage(jid, { text: text, ...options }, { quoted });
    //=========================================\\
    anggazyy.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? ('./sticker/' + filename + '.' + type.ext) : './sticker/' + filename;
        // save to file
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    }
    //=========================================\\
    anggazyy.sendTextWithMentions = async (jid, text, quoted, options = {}) => anggazyy.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted });
    //=========================================\\
    anggazyy.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    }

    return anggazyy;
}

function smsg(anggazyy, m, store) {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = anggazyy.decodeJid(m.fromMe && anggazyy.user.id || m.participant || m.key.participant || m.chat || '');
        if (m.isGroup) m.participant = anggazyy.decodeJid(m.key.participant) || '';
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
        m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text;
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = m.quoted[type];
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted);
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            m.quoted.mtype = type;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            m.quoted.sender = anggazyy.decodeJid(m.msg.contextInfo.participant);
            m.quoted.fromMe = m.quoted.sender === anggazyy.decodeJid(anggazyy.user.id);
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                return exports.smsg(conn, q, store);
            };
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });
            m.quoted.delete = () => anggazyy.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => anggazyy.copyNForward(jid, vM, forceForward, options);
            m.quoted.download = () => anggazyy.downloadMediaMessage(m.quoted);
        }
    }
    if (m.msg.url) m.download = () => anggazyy.downloadMediaMessage(m.msg);
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? anggazyy.sendMedia(chatId, text, 'file', '', m, { ...options }) : anggazyy.sendText(chatId, text, m, { ...options });
    m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => anggazyy.copyNForward(jid, m, forceForward, options);

    return m;
}

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});

// Panggil fungsi startBotz setelah mendeteksi folder dan file
startBotz();