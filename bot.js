var Discord = require('discord.js');
const { serialize } = require('v8');
var logger = require('winston');
var schedule = require('node-schedule');
const steam_db_interface = require('./steam_db_interface');

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

freinds = {
  "Rohan": 76561198014040368,
  "Avery": 76561197998673854,
  "Greg": 76561198028608826,
  "Jae": 76561198019015628,
  "Conner": 76561198128686471,
  "Derek": 76561198015642848,
  "Danny": 76561198026522742,
  "Coleman": 76561198038737656,
  "Matt": 76561198049551605,
  "Techi": 76561198036060063,
  "Killo": 76561197987994840,
  "Necro": 76561198061824517,
  "Cold": 76561198016763767,
  "Kim": 76561198122434543
}

const game_channel_ids = [
  "868135072870592564",
  "868135096824254474",
  "868135114469679104",
  "868135132249325648",
  "868135148703608863"
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
    switch (cmd) {
      // !ping
      case 'friends':
        steam_db_interface.GetMostPlayedWithFriends().then(top_games =>
        {
          let text = ""
          for(let i = 0; i < 5; i++)
          {
            text += `${i+1}) ${top_games[i].name}\n`
            text += `        Playtime 2 Weeks: ${top_games[i].playtime_2weeks}\n`
          }
          message.channel.send(text);
          updateChannelsFromTopGames(top_games);
        });
        break;
      case 'occupancy':
        // get number of members with people roles
        let occupancy = message.guild.roles.cache.get('867939680312770640').members.map(m=>m.user.id).length; // master
        occupancy    += message.guild.roles.cache.get('867939680296009736').members.map(m=>m.user.id).length; // resident
        occupancy    += message.guild.roles.cache.get('867939680312770638').members.map(m=>m.user.id).length; // commanding
        occupancy    += message.guild.roles.cache.get('867939680296009735').members.map(m=>m.user.id).length; // guest
        client.channels.cache.get('868947163852439562').setName(`Occupancy: ${occupancy}`);
        break;
        
      // Just add any case commands if you want to..
    }
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
    if(newState.member.id == "135244717901348864")
    {
      return;  
    }
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

function updateChannelsFromTopGames(top_games)
{
  let free_channels = [...game_channel_ids];
  let splice_offset = 0;


  // get the channels that don't already have places to chat
  for(let i = 0; i < game_channel_ids.length; i++)
  {
    let current_channel_name = client.channels.cache.get(game_channel_ids[i]).name
    const filtered_top_games = top_games.filter(top_game => top_game.name != current_channel_name); // remove any game that matches the current channel's name
    // remove the channel from available channels to rename if the filter was successful
    if(filtered_top_games.length < top_games.length)
    {
      free_channels.splice(i-splice_offset, 1);
      top_games = filtered_top_games;
      splice_offset++;
    }
  }

  for(let i = 0; i < free_channels.length; i++)
  {
    client.channels.cache.get(free_channels[i]).setName(top_games[i].name).then(()=>
    {
      client.channels.cache.get(free_channels[i]).setTopic(`${top_games[i].count} active players with ${top_games[i].playtime_2weeks} hours in the last two weeks`)
    });
  }
}

var daily_job = schedule.scheduleJob('0 0 * * *', function(){
  steam_db_interface.GetMostPlayedWithFriends().then(top_games =>
    {
      updateChannelsFromTopGames(top_games);

      // set occupancy
      let guild = client.guilds.cache.get('867939680296009728');
      let occupancy = guild.roles.cache.get('867939680312770640').members.map(m=>m.user.id).length; // master
      occupancy    += guild.roles.cache.get('867939680296009736').members.map(m=>m.user.id).length; // resident
      occupancy    += guild.roles.cache.get('867939680312770638').members.map(m=>m.user.id).length; // commanding
      occupancy    += guild.roles.cache.get('867939680296009735').members.map(m=>m.user.id).length; // guest
      client.channels.cache.get('868947163852439562').setName(`Occupancy: ${occupancy}`);

    }
  );
});

/*
      // get number of members with people roles
      let guild = client.guilds.cache.get('867939680296009728');
      let occupancy = guild.get('867939680312770640').members.length; // master
      occupancy    += guild.get('867939680312770638').members.length; // commanding
      occupancy    += guild.get('867939680296009736').members.length; // Resident
      occupancy    += guild.get('867939680296009735').members.length; // Guest

      client.channels.cache.get('868947163852439562').setName(`Occupancy: ${occupancy}`);
*/