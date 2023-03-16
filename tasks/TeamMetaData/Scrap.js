const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

class SCRAP {
  constructor() {
    this.DATA;
    this.pointer = 0;
    this.scrapedData = []; // new property to store scraped data

    this.Selectors = {
      ParentSelector: "#team-profile-2021-basic-stats",
      STATBOX: ".general-stat-box",
    };

    this.strReplace = (STR) => {
      return STR.replace(" ", "_");
    };

    this.MovePointer = async () => {
      // modified to return scraped data
      if (this.pointer === this.DATA.length - 1) {
        return this.scrapedData;
      } else {
        //console.log(this.scrapedData.length);
        this.pointer++;
        await this.StartLookup(); // added "await" here to ensure data is fully scraped before moving pointer
      }
    };

    this.StartLookup = async () => {
      await this.FetchURL(this.DATA[this.pointer]);
    }; // added "await" here to ensure data is fully scraped before moving pointer

    this.FetchURL = async (TEAM) => {
      const FixtureURL = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_TeamProfile}${TEAM.attributes.TeamID}`;
      console.log(FixtureURL);
      const response = await axios.get(FixtureURL);
      const html = response.data;

      this.$ = cheerio.load(html);
      return await this.LoopResults(
        this.$(this.Selectors.ParentSelector),
        TEAM
      );
    };

    this.LoopResults = (DATA, TEAM) => {
      const S = this.Selectors;
      const $ = this.$;
      const MetaARR = {};
      DATA.children(S.STATBOX).each((i, el) => {
        MetaARR[this.strReplace($(el).find(".general-stat-box-top").text())] =
          $(el).find(".general-stat-box-bottom").text();
      });
      MetaARR.LastUpdate = Math.floor(Date.now() / 1000).toString();
      MetaARR.StrapiID = TEAM.id
      this.scrapedData.push(MetaARR); // added to store scraped data

      return this.MovePointer(); // modified to return scraped data
    };
  }
}

module.exports = SCRAP;
