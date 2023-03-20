const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const Selectors = {
    ParentSelector: "#scorecard-2020-table-block",
    PlayerName: ".sc-player-name",
    PlayerOut: ".sc-player-how-out",
    InfoBlock: "#scorecard-2020-match-info-block",
    STATS_CATCHES: "#scorecard-2020-stats-top-fielders",
    MOMContainer: "#scorecard-2020-pog-container",
    MOMFeild: "#scorecard-2020-pog-content-left-name",
  };

  class Scrap {
    constructor() {
      this.Selectors = Selectors
      this.$;
      this.pointer = 0;
      this.AssignToLeague;
      this.data = [];
    }
  
    async FetchURL(_FIXTURE) {
      const FixtureURL = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Matchinfo}${_FIXTURE}`;
      try {
        const response = await axios.get(FixtureURL);
        if (response.status === 200) {
          this.$ = cheerio.load(response.data);
          await this.ScrapPlayersFromScorecard(_FIXTURE);
        } else {
          console.log(`Unable to fetch data for fixtureID ${_FIXTURE}`);
        }
      } catch (error) {
        console.error(`Error fetching data from ${FixtureURL}: ${error}`);
      }
    }
  
    async ScrapPlayersFromScorecard(_FIXTURE) {
      const PATHS = [
        `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Innings_1}${_FIXTURE}`,
        `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Innings_2}${_FIXTURE}`,
      ];
  
      try {
        const [FIRSTINN, SECINN] = await Promise.all(
          PATHS.map((path) => GetInfo(path))
        );
  
        const FIRSTINN_BATTINGOBJ = createBattingObj(FIRSTINN, this.Selectors);
        const SECINN_BATTINGOBJ = createBattingObj(SECINN, this.Selectors);
        const FIRSTINN_BOWLINGOBJ = createBowlingObj(FIRSTINN, this.Selectors);
        const SECINN_BOWLINGOBJ = createBowlingObj(SECINN, this.Selectors);
  
        const COMPLETELIST = [
          ...FIRSTINN_BATTINGOBJ,
          ...SECINN_BATTINGOBJ,
          ...FIRSTINN_BOWLINGOBJ,
          ...SECINN_BOWLINGOBJ,
        ];
        const arrUniq = [
          ...new Map(COMPLETELIST.map((v) => [v.PlayerID, v])).values(),
        ];
        this.data = [...this.data,...arrUniq]
      } catch (error) {
        console.error(
          `Error scraping player data from match ${_FIXTURE}: ${error}`
        );
      }
    }
  
    async startScraping(DATA) {
      this.DATA = DATA;
      for (let i = 0; i < this.DATA.length; i++) {
        console.log(`${this.DATA[i].attributes.fixtureID} ID look up`)
        await this.FetchURL(this.DATA[i].attributes.fixtureID);
      }

      const filteredArr = this.data.reduce((accumulator, currentValue) => {
        if (!accumulator.some(item => item.PlayerID === currentValue.PlayerID)) {
          accumulator.push(currentValue);
        }
        return accumulator;
      }, []);
      
      return filteredArr;
    }
  }
  
module.exports = Scrap;
  

const createBattingObj = (DATA, Selectors) => {
    const BattingARR = [];
    const $ = cheerio.load(DATA);
  
    $(Selectors.ParentSelector)
      .find("table:first tbody")
      .children()
      .each((i, el) => {
        if (i != 0) {
          if ($(el).find(Selectors.PlayerName).text().length != 0) {
            const LINKSPLIT = $(el)
              .find(Selectors.PlayerName)
              .find("a")
              .attr("href")
              .split("=");
  
            BattingARR.push({
              Name: $(el).find(Selectors.PlayerName).text().trim(),
              PlayerID: LINKSPLIT[1],
            });
          }
        }
      });
  
    return BattingARR;
  };
  
  const createBowlingObj = (DATA, Selectors) => {
    const BowlingARR = [];
    const $ = cheerio.load(DATA);
    $(Selectors.ParentSelector)
      .find("table:nth-child(2) tbody")
      .children()
      .each((i, el) => {
        if (i != 0) {
          if ($(el).find(Selectors.PlayerName).text().length != 0) {
            const LINKSPLIT = $(el)
              .find(Selectors.PlayerName)
              .find("a")
              .attr("href")
              .split("=");
  
            BowlingARR.push({
              Name: $(el).find(Selectors.PlayerName).text(),
              PlayerID: LINKSPLIT[1],
            });
          }
        }
      });
  
    return BowlingARR;
  };

const GetInfo = async (InfoPath) => {
  try {
    const response = await axios.get(InfoPath);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching data from ${InfoPath}: ${error}`);
    throw error;
  }
};
