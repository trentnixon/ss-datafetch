const cheerio = require("cheerio");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

class TeamLogoDownloader {
  constructor(teams) {
    this.teams = teams;
  }

  async downloadLogos() {
    const tasks = this.teams.map((team) => this.fetchPage.bind(this, team.attributes.TeamID, team.id));
    const imageUrls = [];

    await Promise.all(tasks.map(async (task) => {
      const imageUrl = await task();
      imageUrls.push(imageUrl);
    }));

    return imageUrls;
  }

  async fetchPage(teamId, id) {
    const url = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_TeamProfile}${teamId}`;
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const imageUrl = $("#team-profile-2021-team-logo img").attr("src");
      //console.log(`Image URL for team ${teamId}:`, imageUrl);
      return { teamId, imageUrl, id };
    } catch (error) {
      console.error(`Error fetching page for team ${teamId}:`, error);
      return { teamId, imageUrl: null, id };
    }
  }
}

module.exports = TeamLogoDownloader;
