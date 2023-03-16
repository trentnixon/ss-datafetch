const cheerio = require('cheerio');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

class CheckHasFixture {
  constructor(data) {
    this.data = data;
    this.pointer = 0;
    this.toBeDeleted = [];
    this.activeFixtures = [];
  }

  async startLookup() {
    while (this.pointer < this.data.length) {
      const fixture = this.data[this.pointer];
      await this.fetchUrl(fixture);
      this.pointer++;
    }
    return { activeFixtures: this.activeFixtures, toBeDeleted: this.toBeDeleted };
  }

  async fetchUrl(fixture) {
    //console.log(`Syncing Fixture ${this.pointer} of ${this.data.length - 1}`);
    const fixtureUrl = `${process.env.LMS_scrapURL}${process.env.LMS_pathFixtureInfo}${fixture.attributes.fixtureID}`;
    //console.log(fixtureUrl)

    try {
      const response = await axios.get(fixtureUrl);

      //console.log('response.status', response.status)
      if (response.status === 200) {
        const $ = cheerio.load(response.data);

        if ($('#content-page-main-content-mid').html() === null) {
          //console.log(`Fixture ${fixture.id} not found on servers, adding to toBeDeleted`);
          this.toBeDeleted.push(fixture);
        } else {
          //console.log(`Fixture ${fixture.id} found on servers, adding to activeFixtures`);
          this.activeFixtures.push(fixture);
        }
      } else {
        //console.log(`Error Fetching URL ${fixtureUrl} See below!!! `);
        this.toBeDeleted.push(fixture);
      }
    } catch (error) {
      console.error('response.status ',error);
      this.toBeDeleted.push(fixture);
    }
  }
}

module.exports = CheckHasFixture;
