const m = require('mineflayer');
const { Collection, Colors } = require('discord.js');
const { readdirSync } = require('fs');
const main = require('./discord');
const index = require('./index');
const set = require('./data');
const { log } = require('./functions/utils');
require('dotenv').config();

let config = {
    botName: index.config.dev ? 'mo0nbot4' : 'mo0nbot3',
    dev: index.config.dev,
    minecraftPrefix: index.config.dev ? "!!" : "!",
    discordPrefix: "$"
}

let channel = {
    livechat: config.dev ? "987204059838709780" : "986599157068361734",
    server: config.dev ? "987204092113879040" : "986807303565086781"
}

function createBot() {
    const bot = m.createBot({
        host: '2y2c.org',
        port: 25565,
        username: config.botName,
        version: '1.18.2'
    });

    bot.adminName = set.manager.adminGame;
    bot.notFoundPlayers = set.notFoundPlayers;

    bot.client = main.client;
    bot.config = config;

    bot.data = {
        arrayMessages: [],
        mainServer: false,
        logged: false,
        nextCheckTab: true,
        fastReconnect: false,
        spawnCount: 0,
        countPlayers: 0,
        uptime: 0
    }

    bot.commands = new Collection();
    readdirSync('./igCommands').forEach(cmdName => {
        bot.commands.set(cmdName.split(".")[0], require('./igCommands/' + cmdName));
    });

    readdirSync('./igEvents').forEach(eventName => {
        let event = require('./igEvents/' + eventName);

        if (event.other && event.once) bot._client.once(event.name, (...args) => event.execute(bot, ...args));
        if (event.other && !event.once) bot._client.on(event.name, (...args) => event.execute(bot, ...args));
        if (!event.other && event.once) bot.once(event.name, (...args) => event.execute(bot, ...args));
        if (!event.other && !event.once) bot.on(event.name, (...args) => event.execute(bot, ...args));
    });

    main.client.on('messageCreate', message => {
        if (!bot.data.logged || message.author.bot) return;
        if (message.channel.id == channel.livechat) {
            let content = message.content;

            if (!message.author.bot && message.content.startsWith(config.discordPrefix))
                return runCommand(message);

            if (message.author.username.includes("§") || content.includes("§")) return;
            if (content.split('\n').length > 1) content = content.split('\n')[0];

            let toServer = `[${message.author.tag}] ${content}`;
            log(toServer);

            message.react('<a:1505_yes:797268802680258590>');
            bot.chat(`${toServer}`);
        }
    });
}

function runCommand(message) {
    const args = message.content.slice(config.discordPrefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const cmd = main.client.commands.get(cmdName)
        || main.client.commands.find(cmd => cmd.aliases?.includes(cmdName));

    if (!cmd) return;
    if (cmd.disable) return;

    message.sendMessage = sendMessage;
    message.notFoundPlayers = set.notFoundPlayers;

    log('2Y2C - ' + message.author.tag + ' used command: ' + cmdName + ' ' + args.join(" "));

    function sendMessage(embed) {
        if (typeof embed == 'object') message.reply({ embed, allowedMentions: { repliedUser: false } }).catch(err => { });
        else message.reply({ embeds: [{ description: embed, color: Colors.NotQuiteBlack }], allowedMentions: { repliedUser: false } }).catch(err => { });
    }

    cmd.execute(main.client, message, args);
}

module.exports = { createBot, channel, config };
