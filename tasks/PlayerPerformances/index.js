const fetcher = require("../../utils/fetcher");
const Scrap = require("./scrap");
const qs = require("qs");

/*
  THIS CLASS NEEDS A LOT OF WORK

  REWRITE THIS WHOLE THING!!!

  - its adding plyer performances multiple times
  - MoM check
  - has fixture check 

*/

// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

class PerformanceSync {
  async run(FranchiseID) {
    try {
      console.log("Performance Sync started", FranchiseID);
      const ID = FranchiseID;
      /* *********************************************************************** */
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, [
        "fixtures",
        "fixtures.teams",
        "fixtures.player_battings",
        "fixtures.player_moms",
      ]);

      /* *********************************************************************** */
      // task2 - Remove fixtures that have been completed
      const filteredFixtures = await this.filterFixtures(SelectedWatchlists);

      /* *********************************************************************** */
      // task3 - check to see if fixture is still active on LMS
      const scrappedPerformances = await this.scrapFixturePerformances(
        filteredFixtures
      );
      //console.log(scrappedPerformances)

      /* *********************************************************************** */
      // task4 -
      await this.updatePlayerIdsWithDatabaseIds(scrappedPerformances);

      //console.log(PerformancesWithPlayerIDS)
      // task 5
      await this.UpdatehasPlayers(filteredFixtures);

      console.log("Performance Sync Completed", FranchiseID);
      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  /* *********************************************************************** */
  /* TASKS */
  /* *********************************************************************** */

  // Task 2
  async filterFixtures(selectedWatchlists) {
    const now = Math.floor(Date.now() / 1000);
    const daysFromToday = 14;
    const twoWeeks = Math.floor(
      (Date.now() - daysFromToday * 24 * 60 * 60 * 1000) / 1000
    );

    const filteredFixtures = selectedWatchlists.flatMap((watchlist) =>
      watchlist.attributes.fixtures.data.filter(
        (fixture) =>
          fixture.attributes.UnixTime > twoWeeks &&
          fixture.attributes.UnixTime <= now
      ).filter(
        (f) =>
          (!f.attributes.hasPlayerSync &&
            f.attributes.teams.data.length !== 0) ||
          f.attributes.player_battings.data.length === 0 ||
          f.attributes.player_moms.data.length === 0
      )
    );

    return filteredFixtures;
  }

  // Task 3
  /* ************************************************************************ */

  async scrapFixturePerformances(FilteredFixtures) {
    try {
      const scraper = new Scrap();
      const Performances = await scraper.startScraping(FilteredFixtures);
      console.log("Performances", Performances.length);
      //console.log(Performances);
      return Performances;
    } catch (error) {
      console.error("Error in scrapFixturePerformances:", error);
      return [];
    }
  }

  // Task 4
  /* ************************************************************************ */
  async updatePlayerIdsWithDatabaseIds(scrappedPerformances) {
    try {
      // Iterate through the scrappedPerformances array
      for (const performance of scrappedPerformances) {
        // Query the player data from the database using the PlayerID
        const player = await IsPlayerCheck(performance.PlayerID);

        if (player.length !== 0) {
          performance.player = [player[0].id];
          await savePerformanceToDB(performance, player);
        } else {
          console.log("Player Length === 0 ", performance.PlayerID);
        }
      }
    } catch (error) {
      console.error("Error updating player IDs with database IDs:", error);
    }
    return scrappedPerformances;
  }

  // Task 5
  /* ************************************************************************** */
  async UpdatehasPlayers(filteredFixtures) {
    //console.log("FilteredFixtures ", FilteredFixtures);
    for (let item of filteredFixtures) {
      try {
        //console.log(item.id);
        await hasPlayerUpdate(item.id);
      } catch (error) {
        console.error("Error in UpdatehasPlayers:", error);
      }
    }
  }
}

module.exports = PerformanceSync;

const savePerformanceToDB = async (
  LMSscrapedperformance,
  PlayersStrapiEntry
) => {
  try {
    const performanceFields = [
      ["player_battings", "player-battings", "BATTING_Balls"],
      ["player_bowlings", "player-bowlings", "BOWLING_Overs"],
      ["player_catches", "player-catches", "PLAYERS_Catches"],
      ["player_stumpings", "player-stumpings", "PLAYERS_Stumpings"],
      ["player_moms", "player-moms", "isMOM"],
    ];

    if (PlayersStrapiEntry.length !== 0) {
      for (const [table, endpoint, field] of performanceFields) {
        // is there a marker on the OBJ to keep check it for a value on Strapi?
        //console.log(LMSscrapedperformance)
        if (LMSscrapedperformance[field] === undefined) continue;

        const fixtureId = LMSscrapedperformance.fixture[0];

        // Check if the PlayersStrapiEntry already has performance details added to the DB
        const hasDetails = await hasPerformanceDetails(
          PlayersStrapiEntry[0],
          fixtureId,
          table
        );

        if (hasDetails) {
          //await updatePerformance(LMSscrapedperformance, endpoint);
        } else {
          const added = await addNewPerformance(
            LMSscrapedperformance,
            endpoint
          );
          console.log(`Perfromance Added !! ${added.id} `);
        }
      }
    } else {
      console.log(
        "Player not found in the database:",
        LMSscrapedperformance.PlayerID
      );
    }
  } catch (error) {
    console.error("Error saving LMSscrapedperformance to DB:", error);
  }
};

const hasPerformanceDetails = async (PlayersStrapiEntry, fixtureId, table) => {
  // Check if the field exists in the player attributes and contains data
  if (PlayersStrapiEntry.attributes[table]?.data) {
    // Check if the performance details for the given fixture ID exist in the data array
    const existingPerformance = PlayersStrapiEntry.attributes[table].data.find(
      (performance) => performance?.attributes?.fixture?.data?.id === fixtureId
    );
    // Return true if the performance details exist, otherwise return false
    return !!existingPerformance;
  }

  // If the table does not exist or does not contain data, return false
  return false;
};

const IsPlayerCheck = async (ID) => {
  try {
    const query = qs.stringify(
      {
        filters: {
          PlayerID: {
            $eq: ID,
          },
        },
        populate: [
          "player_battings",
          "player_battings.fixture",
          "player_bowlings",
          "player_bowlings.fixture",
          "player_catches",
          "player_catches.fixture",
          "player_stumpings",
          "player_stumpings.fixture",
          "player_moms",
          "player_moms.fixture",
        ],
        fields: ["Name"],
      },
      {
        encodeValuesOnly: true, // prettify URL
      }
    );

    return await fetcher(`players/?${query}`);
  } catch (error) {
    console.error(`Error fetching player with ID ${ID}:`, error);
    return [];
  }
};

/* API CALLS */

// Add New
//LMSscrapedperformance, endpoint, field
const addNewPerformance = async (DATA, endpoint) => {
  if (endpoint === "player-moms" && DATA?.isMOM === undefined) return false;

  return await fetcher(`${endpoint}`, "POST", { data: DATA });
};

const hasPlayerUpdate = async (ID) => {
  //console.log("hasPlayers ", ID);
    return await fetcher(`fixtures/${ID}`, "PUT", {
    data: { hasPlayers: true, hasPlayerSync: true },
  });
};
