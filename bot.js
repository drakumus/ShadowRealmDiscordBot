var Discord = require('discord.js');
const { serialize } = require('v8');
var logger = require('winston');

const NUM_BAN_SECONDS = 15;

banned_users = {

}

insults = [
  "Ligma balls --love Danny",
  "https://tenor.com/view/teddy-bear-love-you-forkeeps-gif-14707212",
  "https://tenor.com/view/winnie-the-pooh-stuck-coince-gif-8896709",
  "https://tenor.com/view/austin-powers-damn-cant-trapped-gif-11024485",
  "https://tenor.com/view/jail-gif-8050413",
  "https://tenor.com/view/jail-right-to-jail-right-away-parks-and-recreation-parks-and-rec-gif-16177531",
  "https://tenor.com/view/tag-hump-scared-prison-prisoner-gif-15669162",
  "https://tenor.com/view/horny-jail-go-to-horny-jail-bonk-doge-cheems-gif-17582752"
]

function AddBannedUser(member) {
  let d = new Date();
  let current_time = d.getTime();
  let timeout_offset = (NUM_BAN_SECONDS * 1000);

  if (banned_users.hasOwnProperty(member.id)) {
    // extend ban to shadow realm
    banned_users[member.id].bannedUntil = current_time + timeout_offset;
  } else {
    // start with 30 second ban to shadow realm
    banned_users[member.id] = {
      "member": member,
      "bannedUntil": current_time + timeout_offset
    }
  }
}

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});

logger.level = 'debug';

// Initialize Discord Bot
var client = new Discord.Client();

client.login(process.env.BOT_TOKEN);

client.on('ready', function (evt) {
  logger.info('Shadow Realm Initiated');
});

client.on('message', message => {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.content.substring(0, 1) == '!') {
    var args = message.content.substring(1).split(' ');
    var cmd = args[0];

    args = args.splice(1);
    /*
    switch (cmd) {
      // !ping
      case 'ping':
        message.channel.send("WAH");
        break;
      // Just add any case commands if you want to..
    }
    */
  }
});

client.on('voiceStateUpdate', function (oldState, newState) {
  let newVoiceChannelID = newState.channelID;
  let oldVoiceChannelID = oldState.channelID;

  if (newVoiceChannelID === oldVoiceChannelID) {
    return; // don't do anything if they haven't changed channels
  }

  var horny_jail_channel_id = "849003967735791626" // stan
  // var horny_jail_channel_id = "855557361656528906" // dev
  if (newState.channelID == horny_jail_channel_id) {
    console.log(newState.member.displayName + " has been banished!");
    // store member
    AddBannedUser(newState.member);
  } else if (newState.channelID != horny_jail_channel_id) {
    let d = new Date();
    let current_time = d.getTime();

    if(banned_users.hasOwnProperty(newState.member.id) && (banned_users[newState.member.id].bannedUntil > current_time))
    {
      console.log(banned_users[newState.member.id].bannedUntil)
      AddBannedUser(newState.member);
      console.log(banned_users[newState.member.id].bannedUntil)
      // BACK TO JAIL WITH YOU
      client.channels.fetch(horny_jail_channel_id).then(channel => {
        newState.member.voice.setChannel(channel).then(channel => {
          let random_index = Math.floor(Math.random() * insults.length)
          newState.member.send(insults[random_index] + "\nWait your " + NUM_BAN_SECONDS + " seconds until you can leave. The jailor shows no mercy!");
          console.log(newState.member.displayName + " attempted to escape!");
        }).catch(error => {
          // don't care if they left the server
        });
      }).catch(error => {
        // don't care if they left the server
      });
    }
  }
})