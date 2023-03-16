const cheerio = require("cheerio");
const axios = require("axios");

class Scrap {
  constructor(data, url) {
    this.data = data;
    this.url = url;
    this.allTeams = [];
    this.selectors = {
      tableSelector: "#league-table-2020-container table tbody",
      linkSelector: ".lt-name",
    };
  }

  async scrapeData(url) {
    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const league = this.data.find((item) => item.attributes.PATH === url.replace(this.url, ""));
        this.extractTeamMetadata($(this.selectors.tableSelector), league, $); // pass $ here
      } else {
        console.error(`Error fetching URL for ${url}`);
        throw new Error(`Error fetching URL for ${url}`);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  extractTeamMetadata(data, league, $) { // accept $ here
    const teamsArr = [];
    data.children().each((i, el) => {
      if ($(el).find(this.selectors.linkSelector).html() !== null) {
        const link = $(el).find(this.selectors.linkSelector).find("a").attr("href").split("=");
        const name = this.replaceString($(el).find(this.selectors.linkSelector).text()).trim();
        teamsArr.push({
          name,
          profile: $(el).find(this.selectors.linkSelector).find("a").attr("href"),
          teamID: link[1],
          leagueID: league.id,
        });
      }
    });
    this.allTeams.push(...teamsArr);
  }

  replaceString(inputString) {
    const checker = [
      {
        check: "P1nk",
        replace: "P1nk P@nthers",
      },
    ];
    const match = checker.find((obj) => inputString.includes(obj.check));
    if (match) {
      return match.replace;
    }
    return inputString;
  }

  async start() {
    for (let i = 0; i < this.data.length; i++) {
      const league = this.data[i];
      const url = `${this.url}${league.attributes.PATH}`;
      await this.scrapeData(url);
    }
    return this.allTeams;
  }
}

module.exports = Scrap;
