const fetch = require("node-fetch")

const friends = {
  "Rohan": "76561198014040368",
  "Avery": "76561197998673854",
  "Greg": "76561198028608826",
  "Jae": "76561198019015628",
  "Conner": "76561198128686471",
  "Derek": "76561198015642848",
  "Danny": "76561198026522742",
  "Coleman": "76561198038737656",
  "Matt": "76561198049551605",
  "Techi": "76561198036060063",
  "Killo": "76561197987994840",
  "Necro": "76561198061824517",
  "Cold": "76561198016763767",
  "Kim": "76561198122434543"
}

var url = `http:\/\/api.steampowered.com\/IPlayerService\/GetRecentlyPlayedGames\/v0001\?key=${process.env.API_KEY}&steamid=`

async function GetFriendRecentMostPlayed(id)
{
  const headers = {
    'Content-Type': 'application/json'
  };

  let user_url = url + id + "&format=json"

  const response = await fetch(user_url, {
    headers : headers
  }).then(res => res.json()).catch(err => null);

  return response;
}

async function GetMostPlayedWithFriends()
{

  var games = {}

  for(friend_name in friends)
  {
    let id = friends[friend_name];
    console.log(`${friend_name} ${id}`);
    let data = await GetFriendRecentMostPlayed(id);
    if(!data.response.games)
    {
      console.log(`${friend_name} library is private or couldn't be found.`)
      continue;
    }

    let user_games = data.response.games;

    // compile a list of players, the games they play, and total hours spent across all players
    for(game_index in data.response.games)
    {
      let game_name = user_games[game_index].name;
      let playtime_2weeks = Math.round(((user_games[game_index].playtime_2weeks) / 60));
      // if playtime less than 4 hours for 2 weeks then the player isn't active enough to count
      playtime_2weeks = playtime_2weeks < 4 ? 0 :playtime_2weeks;

      // check if the game has been logged
      if(!(game_name in games))
      {
        // init object
        games[game_name] =
        {
          "count": 0,
          "playtime_2weeks": 0,
          "players": []
        }
      }

      games[game_name].count += playtime_2weeks > 0 ? 1 : 0;
      games[game_name].playtime_2weeks += playtime_2weeks;
      games[game_name].weight = Math.round(games[game_name].count * games[game_name].playtime_2weeks);
      games[game_name].players.push(friend_name)
    }
  }

  // sort based off weight
  let sorted_games = 
  Object.keys(games).sort((current, next) =>
  {
    return games[next].weight - games[current].weight;
  });

  /*
  sorted_games.forEach(game_name => {
    console.log(game_name)
    console.log("Count:    "+games[game_name].count)
    console.log("Weight:   "+games[game_name].weight)
    console.log("Playtime: "+games[game_name].playtime_2weeks)
    console.log("Players:  "+games[game_name].players)
  })
  */

  sorted_game_data = []

  for(var i = 0; i < 5; i++)
  {
    sorted_game_data.push(games[sorted_games[i]])
    sorted_game_data[i].name = sorted_games[i]
  }
  return sorted_game_data
}

module.exports = {
  GetMostPlayedWithFriends
}