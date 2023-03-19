const cheerio = require('cheerio');
const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config();

function replaceString(inputString) {
  const checker = [{
    Check: 'P1nk',
    Replace: 'P1nk P@nthers'
  }]
  const match = checker.find(obj => inputString.includes(obj.Check));
  if (match) {
    return match.Replace;
  }

  return inputString;
}

async function scrapLeague(league, LEAGUE_ID) {
    const selectors = {
      ParentSelector: '#league-2020-fixtures-container',
      DataSelector: '.league-fixture-2020-date',
      TeamsContainerSelector: '.league-fixture-2020-teams-container',
      HomeTeamSelector: '.league-fixture-2020-Home-Team',
      AwayTeamSelector: '.league-fixture-2020-Away-Team',
      LogoSelector: '.league-fixture-2020-team-logo',
      TeamNameSelector: '.league-fixture-2020-tn',
      GroundSelector: '.league-fixture-2020-venue',
      LinkSelector: '.league-fixture-2020-sc-link'
    };
  
    //console.log('SCRAP LEAGUE ', league.Name)
    const fixtureURL = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Fixtures}${league.PATH}`
    console.log("fixtureUrl scrap New Fixtures ", fixtureUrl);
    try {
      const response = await axios.get(fixtureURL);
      const $ = cheerio.load(response.data);
      const fixtureArr = [];
  
      $(selectors.ParentSelector).children().each((i, el) => {
        //console.log('Checking game data for ', league.Name);
        const link = $(el).find(selectors.LinkSelector).find('a').attr('href');
        if (link != undefined) {
          const dataSplit = $(el).find(selectors.DataSelector).text().split('-');
          const timeSplit = dataSplit[0].split(' ');
          const unixDate = timeSplit[0].split('/');
          const groundSplit = $(el).find(selectors.GroundSelector).find(selectors.TeamNameSelector).text().split('-');
          const linkSplit = link.split('=');
  
          fixtureArr.push({
            HomeTeam: replaceString($(el).find(selectors.HomeTeamSelector).find(selectors.TeamNameSelector).text().trim()),
            AwayTeam: replaceString($(el).find(selectors.AwayTeamSelector).find(selectors.TeamNameSelector).text().trim()),
            Date: `${unixDate[2]}-${unixDate[1]}-${unixDate[0]}`,
            Time: `${timeSplit[1]}:00`,
            GameType: dataSplit[1],
            Ground: groundSplit[0],
            Umpire: groundSplit[1],
            Link: link,
            fixtureID: parseInt(linkSplit[1]),
            UnixTime: Math.floor(new Date(`${unixDate[2]}.${unixDate[1]}.${unixDate[0]}`).getTime() / 1000),
            watch_list: [LEAGUE_ID],
            hasMeta: true
          });
        }
      });
  
      //console.log('scrapLeague found this many fixtures= ', LEAGUE_ID, fixtureArr.length);
      return fixtureArr;
    } catch (err) {
      console.error(`Request failed: ${err}`);
    }
  }
  

module.exports = scrapLeague;
