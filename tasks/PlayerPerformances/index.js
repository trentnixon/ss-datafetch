const fetcher = require("../../utils/fetcher");
const Scrap = require("./scrap");
const qs = require("qs");

/*
  THIS CLASS NEEDS A LOT OF WORK
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
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, [
        "fixtures",
        "fixtures.teams",
        "fixtures.player_battings",
        "fixtures.player_moms",
      ]);

      //console.log(SelectedWatchlists)
      // task2
      // remove fixtures that have been completed
      const FilteredFixtures = await this.filterFixtures(SelectedWatchlists);
      console.log(
        "Number of fixtures to process after filtering = ",
        FilteredFixtures.length
      );

      // task3
      // check to see if fixture is still active on LMS
      const Performances = await this.FindPerformances(FilteredFixtures);

      // task4
      // check to see if fixture is still active on LMS
      await this.storePerformances(Performances);
      //console.log(PLAYERSTOCREATE);

      // task 5
      await this.UpdatehasPlayers(FilteredFixtures);

      console.log("Performance Sync Completed", FranchiseID);
      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  // Task 2
  /* ************************************************************************ */

  async filterFixtures(Fixtures) {
    const NOW = Math.floor(Date.now() / 1000);
    const DaysFromToday = 14;
    const TwoWeeks = Math.floor(
      (Date.now() - DaysFromToday * 24 * 60 * 60 * 1000) / 1000
    );
    const filteredFixtures = Fixtures.flatMap((fixture) =>
      fixture.attributes.fixtures.data
        .filter(
          (f) =>
            f.attributes.UnixTime > TwoWeeks && f.attributes.UnixTime <= NOW
        )
        .filter(
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

  async FindPerformances(FilteredFixtures) {
    const scraper = new Scrap();
    const Performances = await scraper.startScraping(FilteredFixtures);
    //console.log(Performances)
    return Performances;
  }

  // Task 4
  /* ************************************************************************** */
  async storePerformances(performances) {
    try {
      const playerIds = performances
        .filter((performance) => performance?.PlayerID !== undefined)
        .map((performance) => parseInt(performance.PlayerID));

      const players = await Promise.all(playerIds.map((id) => IsPlayer(id)));
      const performanceFields = [
        ["player_battings", "player-battings", "BATTING_Balls"],
        ["player_bowlings", "player-bowlings", "BOWLING_Overs"],
        ["player_catches", "player-catches", "PLAYERS_Catches"],
        ["player_stumpings", "player-stumpings", "PLAYERS_Stumpings"],
        ["player_moms", "player-moms", "isMOM"],
      ];

      for (const performance of performances) {
        await processPerformance(performance, players, performanceFields);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Task 5
  /* ************************************************************************** */
  async UpdatehasPlayers(FilteredFixtures) {
    //console.log("FilteredFixtures ", FilteredFixtures);
    for (let item of FilteredFixtures) {
      try {
        //console.log(item.id);
        await hasPlayerUpdate(item.id);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

module.exports = PerformanceSync;

// Point 2: Split storePerformances into smaller functions
async function processPerformance(performance, players, performanceFields) {
  if (performance?.PlayerID !== undefined) {
    const player = players.find(
      (p) =>
        p.length !== 0 &&
        parseInt(p[0].attributes.PlayerID) === parseInt(performance.PlayerID)
    );

    if (player) {
      performance.player = [player[0].id];

      for (const [attribute, field, test] of performanceFields) {
        const isPerformanceInStrapi = isPerformance(
          player[0].attributes[attribute],
          performance,
          field
        );

        if (!isPerformanceInStrapi && performance[test] !== undefined) {
          await AddItem(field, performance);
        }
      }
    } else {
      console.log(`No player found for PlayerID: ${performance.PlayerID}`);
    }
  }
}

const IsPlayer = async (ID) => {
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
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  return await fetcher(`players/?${query}`);
};

function isPerformance(previousPerformances, fixture, field) {
  if (!previousPerformances?.data) {
    return false;
  }

  const hasMatchingFixtureID = (performance) => {
    /* console.log("attr on performance");
    console.log(performance); */
    const fixtureID =
      performance.attributes?.fixture?.data?.attributes?.fixtureID;
    return fixtureID === fixture.fixture[0];
  };


  const foundPerformance = previousPerformances.data.find((performance) => {
    const fixtureID =
      performance.attributes?.fixture?.data?.attributes?.fixtureID;

    if (fixtureID === undefined) {
      /* console.log(performance, field, fixture); */
      DeleteItem(performance.id, field);
      return false;
    }

    return hasMatchingFixtureID(performance);
  });

  return Boolean(foundPerformance);
}

// Add New
const AddItem = async (ENDPOINT, DATA) => {
  if (ENDPOINT === "player-moms" && DATA?.isMOM === undefined) return false;

  return await fetcher(`${ENDPOINT}`, "POST", { data: DATA });
};

// UPdate?
/* const UpdateItem = async (ID, ENDPOINT, DATA) => {
  //console.log("UpdateItem");
}; */
// Delete
const DeleteItem = async (ID, ENDPOINT) => {
  console.log("DeleteItem ", ENDPOINT, ID);
  //DELETE
  return await fetcher(`${ENDPOINT}/${ID}`, "DELETE");
};

const hasPlayerUpdate = async (ID) => {
  return await fetcher(`fixtures/${ID}`, "PUT", {
    data: { hasPlayers: true, hasPlayerSync: true },
  });
};
