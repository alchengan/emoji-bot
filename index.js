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
            let pEmoji = message.attachments.first().url;       // primed emoji
            let pEmojiName = message.content.split(/ +/)[0];    // primed emoji name; assumes first word in message is emoji name
            message.channel.send(`${pEmojiName} approved!`);
            message.guild.emojis.create(pEmoji, pEmojiName);
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
    } else if (command === 'help') {
        message.channel.send('**!emoji** w/ attached image suited to be an emoji*\n*.png or .jpg less than 256kb, name at least 2 characters long, contains only alphanumeric characters or underscores\n\n**!site** quickly resize and name images to fit emoji requirements with this lil webtool')
    } else if (command === 'emoji') {
        if(message.attachments.size > 0) {
            let potEmoji = message.attachments.first(); // potential emoji
            if(potEmoji.name.split('.').length == 2) {
                let emojiName = potEmoji.name.split('.')[0];
                if(emojiName.match(/^[\w\d_]{2,}$/)) {
                    if(potEmoji.contentType == 'image/png'
                    || potEmoji.contentType == 'image/jpg'
                    || potEmoji.contentType == 'image/jpeg'
                    || potEmoji.contentType == 'image/gif') {
                        if(potEmoji.size/1024 < 256) {
                            for(var e of message.guild.emojis.cache.values()) {
                                if(emojiName === e.name) {
                                    message.channel.send('Emoji name already in use');
                                    return;
                                }
                            }
                            message.channel.send({content: `${emojiName} pending mod approval...`, files: [potEmoji.url]});
                        } else message.channel.send('File is too large');
                    } else message.channel.send('Incompatible file type');
                } else message.channel.send('Improper name');
            } else message.channel.send('Improper name');
        } else message.channel.send('Please attach an image');
    }
});

client.login(token);