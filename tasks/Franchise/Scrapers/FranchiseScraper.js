const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();


class FranchiseScraper {
  constructor() {
    this.URL;
    this.selectors = {
      parent: ".venue-locations",
    };
  }

  async fetchData() {
    try {
      const response = await axios.get(this.URL);
      if (response.status === 404) {
        throw new Error(`Error: 404 Not Found - ${this.URL}`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${this.URL}: ${error.message}`);
      throw error;
    }
  }

  parseHtml(html) {
    return cheerio.load(html);
  }

  splitLink(link, varValue) {
    return link.split(varValue);
  }

  async start() {
    try {
      const html = await this.fetchData();
      const $ = this.parseHtml(html);
      const leagues = await this.loopResults($(`${this.selectors.parent}`), $);
      return leagues;
    } catch (error) {
      console.error(`Error parsing data from ${this.URL}: ${error.message}`);
      // Send a signal back to the task runner to indicate that the scraping has failed
      return { success: false, error: error.message };
    }
  }

  loopResults(DATA, $) {
    const leagueArr = [];

    DATA.children("ul")
      .find("li")
      .each((i, el) => {
        const link = $(el).find("a").attr("href");
        if (!link) {
          throw new Error(
            `Error parsing data from ${this.URL}: no link found for selector`
          );
        }
        const params = this.splitLink(this.splitLink(link, "?")[1], "&");
        leagueArr.push({
          Name: $(el).find("a").text(),
          PATH: link.replace("leagues/homepage", ""),
          leagueid: this.splitLink(params[0], "=")[1],
          seasonid: this.splitLink(params[1], "=")[1],
          divisionid: this.splitLink(params[2], "=")[1],
          franchise: [this.FranchiseID],
        });
      });

    if (leagueArr.length === 0) {
      throw new Error(
        `Error parsing data from ${this.URL}: no data found for selector '${this.selectors.parent}'`
      );
    }

    return leagueArr;
  }
}

module.exports = FranchiseScraper;
