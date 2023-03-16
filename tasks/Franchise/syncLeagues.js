const fetcher = require("../../utils/fetcher");
const qs = require("qs");
// Common
const getSelectedFranchise = require("../../common/getSelectedFranchise");
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

// TASKS
const FranchiseScraper = require("./Scrapers/FranchiseScraper");

/*
  NOTES

*/

class SyncLeagues {
  async run(FranchiseID) {
    try {
      console.log("SyncLeagues started");

      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedFranchise = await getSelectedFranchise(ID);

      // task 2: send the urls within that returned data to a scrapper
      const ScrapedOBJ = await this.scrapSelectedFranchise(SelectedFranchise);
      //console.log("Leagues found on LMS ", ScrapedOBJ.length);
      // task 3: evaluate the html for leagues, check to see if any of the leagues are new against the list of leagues we got from step 1
      const newLeagues = await this.evaluateLeagueData(
        ScrapedOBJ,
        SelectedFranchise
      );

      // task 4: create or update the leagues by sending an API request to the Strapi Endpoint
      await this.createOrUpdateLeagues(newLeagues);

      console.log("SyncLeagues completed");

      /* HACKER FUNCS */
      await this.TrimNames(ID);

      // Return true to indicate success
      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  async TrimNames(ID) {
    const LEAGUES = await getSelectedWatchlists(ID, [
      "fixtures.teams",
      "teams",
    ]);
    const teams = LEAGUES.map((obj) => obj.attributes.teams);
    const combinedData = teams.flatMap((obj) => obj.data);
    for (const team of combinedData) {
      //(team.id, team.attributes.Name.trim())
      await fetcher(`teams/${team.id}`, "PUT", {
        data: { Name: team.attributes.Name.trim() },
      });
    }
  }

  // Task 2
  /* ************************************************************************ */
  async scrapSelectedFranchise(SelectedFranchise) {
    // create a new instance of the SCRAP function
    const myScraper = new FranchiseScraper();

    // set the URL and Franchise ID to scrape
    myScraper.URL = `${process.env.LMS_ScrapURL}${SelectedFranchise.attributes.PATH}`;
    myScraper.FranchiseID = SelectedFranchise.id;

    // call the start method to initiate the scraping process
    return myScraper
      .start()
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.error(error);
      });
  }
  // Task 3
  /* ************************************************************************ */
  async evaluateLeagueData(ScrapedOBJ, SelectedFranchise) {
    // evaluate the returned Objects
    const NEW = findNewItems(
      ScrapedOBJ,
      SelectedFranchise.attributes.watch_lists.data
    );
    const OLD = findOLDItems(
      ScrapedOBJ,
      SelectedFranchise.attributes.watch_lists.data
    );

    const UPDATE = updateStrapiItems(
      ScrapedOBJ,
      SelectedFranchise.attributes.watch_lists.data
    );

    //console.log("UPDATE", UPDATE)
    return {
      add: NEW === undefined ? false : NEW,
      update: UPDATE === undefined ? false : UPDATE,
      Archive: OLD === undefined ? false : OLD,
    };
  }
  // Task 4
  /* ************************************************************************ */
  async createOrUpdateLeagues(newLeagues) {
    // TODO: create or update leagues using an API request to Strapi
    let result;
    try {
      if (newLeagues.add) {
        await Promise.all(newLeagues.add.map((league) => createLeague(league)));
      }
      if (newLeagues.update) {
        await Promise.all(
          newLeagues.update.map((league) => updateLeague(league))
        );
      }

      if (newLeagues.Archive) {
        await Promise.all(
          newLeagues.Archive.map((league) => ArchiveLeague(league))
        );
      }

      result = true;
    } catch (error) {
      console.error(error);
      result = error;
    }
    return result;
  }
}

module.exports = SyncLeagues;

async function createLeague(league) {
  return await fetcher(`watch-lists`, "POST", { data: league });
}

async function updateLeague(league) {
  return await fetcher(`watch-lists/${league.id}`, "PUT", { data: league });
}

async function ArchiveLeague(league) {
  let query = qs.stringify(
    {
      filters: {
        leagueid: {
          $eq: league.attributes.leagueid,
        },
        seasonid: {
          $eq: league.attributes.seasonid,
        },
        divisionid: {
          $eq: league.attributes.divisionid,
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );
  const LID = await fetcher(`watch-lists?${query}`);
  return await fetcher(`watch-lists/${LID[0].id}`, "PUT", {
    data: { hasCompleted: true },
  });
}

function findNewItems(scraperData, strapiData) {
  // Extract the set of unique keys from strapiData
  const strapiKeys = new Set(
    strapiData.map(
      ({ attributes }) =>
        `${attributes.leagueid}:${attributes.seasonid}:${attributes.divisionid}`
    )
  );

  // Filter scraperData to find the elements that are not in strapiData
  const newItems = scraperData.filter(({ leagueid, seasonid, divisionid }) => {
    return !strapiKeys.has(`${leagueid}:${seasonid}:${divisionid}`);
  });

  return newItems;
}

function findOLDItems(scraperData, strapiData) {
  return strapiData.filter((strapiItem) => {
    return !scraperData.some((scraperItem) => {
      return (
        strapiItem.attributes.leagueid === scraperItem.leagueid &&
        strapiItem.attributes.seasonid === scraperItem.seasonid &&
        strapiItem.attributes.divisionid === scraperItem.divisionid
      );
    });
  });
}

function updateStrapiItems(scraperData, strapiData) {
  const updatedData = scraperData
    .filter((scraperItem) => {
      const index = strapiData.findIndex((item) => {
        return item.attributes.leagueid === scraperItem.leagueid;
      });

      return (
        index > -1 && strapiData[index].attributes.Name !== scraperItem.Name
      );
    })
    .map((scraperItem) => {
      const index = strapiData.findIndex((item) => {
        return item.attributes.leagueid === scraperItem.leagueid;
      });

      return {
        id: strapiData[index].id,
        Name: scraperItem.Name,
      };
    });
  return updatedData;
}
