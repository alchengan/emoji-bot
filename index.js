const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

const prefix = '!';

client.once('ready', c => {
    console.log(`${c.user.tag} logged in`);
});

client.on('messageCreate', message => {
    // looks for own pending approval message
    // assumes that the pending approval message is the only message it will create that ends in '...'
    // assumes that emoji image and name both meet discord's specifications
    if(message.author.id == 926559288023986206 && message.content.endsWith('...')) {
        message.react('👍');
        
        // checks if the user that reacted is an admin of the server
        // assumes user that reacted to the emoji is a member of the guild
        const filter = (reaction, user) => {
            if(reaction.emoji.name === '👍') {
                for(var member of message.guild.members.cache.values()) {
                    if(member.id == user.id) {
                        for(var role of member.roles.cache.values()) {
                            if(role.name === 'Admin') {
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        };
        const collector = message.createReactionCollector({ filter }); // only add emoji if admin approves

        collector.on('collect', () => {
            message.channel.messages.fetch(message.reference.messageId)
                .then(m => {
                    let pEmoji = m.attachments.first().url;           // primed emoji
                    let pEmojiName = message.content.split(/ +/)[0];  // primed emoji name; assumes first word in pending approval message is emoji name
                    message.guild.emojis.create(pEmoji, pEmojiName)
                        .then(e => message.channel.send(`${e.name} approved! ${e}`))
                        .catch(console.error);
                })
                .catch(console.error);
            collector.stop();   // stop waiting for reactions when mod approves
        });
        return;
    }
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    if(message.channel.name != 'emoji') return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if(command === 'ping') {
        message.channel.send('pong!');
    } else if (command === 'site') {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Emoji!')
                    .setStyle('LINK')
                    .setURL('https://alchengan.github.io/snap-emoji/')
            );

		message.channel.send({ content: 'Emoji Maker', components: [row]});
    } else if (command === 'slots') {
        let emojiCount = 0;
        let aEmojiCount = 0;    // animated emoji

        for(var gEmoji of message.guild.emojis.cache.values()) {
            if(gEmoji.animated) {
                aEmojiCount += 1;
            } else {
                emojiCount += 1;
            }
        }

        message.channel.send(`There are ${250-emojiCount} available emoji slots and ${250-aEmojiCount} available animated emoji slots remaining`);
    } else if (command === 'help') {
        message.channel.send('**!emoji [name?]** - with attached image suited to be an emoji*. Emoji will be added after mod approval\n*.png or .jpg less than 256kb, name at least 2 characters long, contains only alphanumeric characters or underscores\n\n**!site** - Quickly resize and name images to fit emoji requirements with this lil webtool\n\n**!slots** - Check how many available emoji slots are remaining\n\n**!help** - Displays this^ message');
    } else if (command === 'emoji') {
        if(message.attachments.size > 0) {
            let potEmoji = message.attachments.first(); // potential emoji
            
            // determining what the name of the emoji should be
            let emojiName = potEmoji.name.split('.').slice(0,-1).join('.'); // gets rid of file extension
            if(args.length >= 1) {
                emojiName = args[0];    // name from args takes priority over file name
            }

            if(emojiName.match(/^[\w\d_]{2,}$/)) {  // check against an accepted names regex
                // check accepted file types
                if(potEmoji.contentType == 'image/png'
                || potEmoji.contentType == 'image/jpg'
                || potEmoji.contentType == 'image/jpeg'
                || potEmoji.contentType == 'image/gif') {
                    // check accepted file size
                    if(potEmoji.size/1024 < 256) {
                        // check if emoji name is already in use
                        for(var e of message.guild.emojis.cache.values()) {
                            if(emojiName === e.name) {
                                message.reply('Emoji name already in use');
                                return;
                            }
                        }
                        message.reply({content: `${emojiName} pending mod approval...`});
                    } else message.reply('File is too large');
                } else message.reply('Incompatible file type');
            } else message.reply(`Improper name '${emojiName}'`);
        } else message.reply('Please attach an image');
    }
});

client.login(token);