const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const selectors = {
  ParentSelector: "#league-2020-results-container",
  DataSelector: ".league-fixture-2020-date",
  TeamsContainerSelector: ".league-fixture-2020-teams-container",
  HomeTeamSelector: ".league-fixture-2020-Home-Team",
  AwayTeamSelector: ".league-fixture-2020-Away-Team",
  ResultSelector: ".league-fixture-2020-ts",
  LogoSelector: ".league-fixture-2020-team-logo",
  TeamNameSelector: ".league-fixture-2020-tn",
  GroundSelector: ".league-fixture-2020-venue",
  LinkSelector: ".league-fixture-2020-result",
  LeagueSelector: "#league-table-2020-container tbody tr",
};

class Scrapper {
  constructor(DATA) {
    this.$;
    this.DATA = DATA;
    this.resultsArr = []; // define the variable here
    this.Selectors = selectors;
  }

  async processLeagues() {
    for (const league of this.DATA) {
      await this.fetchUrl(league);
    }
    return this.resultsArr;
  }

  async fetchUrl(league) {
    try {
      const fixtureUrl = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Results}${league.attributes.PATH}`;
      console.log("fixtureUrl Fixture Results SCRAP", fixtureUrl);

      const res = await axios.get(fixtureUrl);
      if (res.status === 200) {
        this.$ = cheerio.load(res.data);
        await this.loopResults(
          this.$(this.Selectors.ParentSelector),
          league,
          this.$(this.Selectors.LeagueSelector)
        );
      } else {
        throw new Error(`ERR Fetching League PATH on Results`);
      }
    } catch (err) {
      console.log(err);
    }
  }

  processElement = (i, el, league) => {
    const $ = this.$;
    const selectors = this.Selectors;
    const badScores = [" / (0.0)", " / 0 (0.0)"];

    const homeResult = $(el)
      .find(selectors.HomeTeamSelector)
      .find(selectors.ResultSelector)
      .text();
    const awayResult = $(el)
      .find(selectors.AwayTeamSelector)
      .find(selectors.ResultSelector)
      .text();
    const link = $(el).find(selectors.LinkSelector).find("a").attr("href");

    if (
      $(el).hasClass("fixHide") &&
      badScores.includes(homeResult) &&
      badScores.includes(awayResult)
    ) {
      //console.log("IGNORE ROW fixHide");
    } else if (
      badScores.includes(homeResult) &&
      badScores.includes(awayResult)
    ) {
      //console.log("IGNORE ROW Bad Score");
    } else if (link) {
      //console.log("USE ROW, HAS SCORE");
      const linkSplit = link.split("="); 
      this.resultsArr.push({
        HomeTeamResult: homeResult,
        AwayTeamResult: awayResult,
        ResultStatement: $(el).find(selectors.LinkSelector).find("a").text(),
        Link: link,
        fixtureID: parseInt(linkSplit[1]),
        watch_list: [league.id],
        hasResult:true,
        Completed:true
      });
    }
  };

  loopResults = (data, league, table) => {
    const processElements = (league) => {
      return new Promise((resolve, reject) => {
        data.children().each((i, el) => {
          this.processElement(i, el, league);
        });
        console.log("Loop Resolved")
        resolve();
      });
    };

    return processElements(league);
  };
}

module.exports = Scrapper;


 /*  movePointer = async () => {
    
    this.pointer++;
    console.log((this.pointer),(this.DATA.length - 1), this.DATA.length)
    if (this.pointer === this.DATA.length) {
      console.log("FINSHED RESULTS SCRAP")
      return this.resultsArr;
    } else {
      console.log("ANOTHER LOOK UP")
      await this.startLookup();
    }
  };

  startLookup = async () => {
    
    const league = this.DATA[this.pointer];
    console.log("LOOK UP NEW LEAGUE")
    await this.fetchUrl(league);
  }; */