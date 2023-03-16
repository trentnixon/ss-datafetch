const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const selectors = {
  ParentSelector: "#league-2020-results-container",
  LeagueSelector: "#league-table-2020-container tbody tr",
};

class Scrapper {
  constructor(DATA) {
    this.$;
    this.pointer = -1;
    this.AssignToLeague;
    this.DATA = DATA;
    this.resultsArr = [];
    this.Selectors = selectors;
  }

  movePointer = async () => {
   /*console.log(
      `movePointer: Pointer Value: ${this.pointer} Data ${this.DATA.length}`
    ); */
    this.pointer++;

    if (this.pointer === this.DATA.length) {
      return Promise.resolve(
        this.resultsArr.filter((result) => result.objArray.length > 0)
      );
    } else {
      await this.startLookup();
    }
  };

  startLookup = async () => {
    const league = this.DATA[this.pointer];
    await this.fetchUrl(league);
    if (this.pointer !== this.DATA.length - 1) {
      await this.movePointer();
    } else {
      return this.resultsArr.filter((result) => result.objArray.length > 0);
    }
  };

  fetchUrl = async (league) => {
    try {
      const fixtureUrl = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Results}${league.Path}`;
      //console.log(fixtureUrl);
      const res = await axios.get(fixtureUrl);
      if (res.status === 200) {
        this.$ = cheerio.load(res.data);
        const table = this.$(this.Selectors.LeagueSelector);
        await this.loopResults(league, table);
        return Promise.resolve();
      } else {
        throw new Error(`ERR Fetching League PATH on Results`);
      }
    } catch (err) {
      console.log(err);
      return Promise.resolve();
    }
  };

  processElement = (i, el, TABLE, $) => {
    const obj = {};
    $(el)
      .find("td")
      .each((i, td) => {
        switch (i) {
          case 0:
            obj.Team = $(td).text();
            break;
          case 1:
            obj.P = $(td).text();
            break;
          case 2:
            obj.W = $(td).text();
            break;
          case 3:
            obj.L = $(td).text();
            break;
          case 4:
            obj.D = $(td).text();
            break;
          case 5:
            obj.Pts = $(td).text();
            break;
          case 6:
            obj.NRR = $(td).text();
            break;
          case 7:
            obj.TSBP = $(td).text();
            break;
          case 8:
            obj.SBP = $(td).text();
            break;
          case 9:
            obj.BP = $(td).text();
            break;
        }
      });
    return obj;
  };

  loopResults = async (league, table) => {
    const processElements = (table) => {
      return new Promise((resolve, reject) => {
        const $ = this.$;
        const objArray = [];
        table.not("#game-results-details").each((i, el) => {
          if ($(el).attr("id") === "game-results-details") return;
          const obj = this.processElement(i, el, table, $);
          if (Object.keys(obj).length > 0) {
            objArray.push(obj);
          }
        });
        resolve(objArray);
      });
    };

    const objArray = await processElements(table);
    if (objArray.length > 0) {
      const result = {
        id: league.id,
        Name: league.Name,
        objArray: objArray,
      };
      this.resultsArr.push(result);
    }
  };
}

module.exports = Scrapper;
