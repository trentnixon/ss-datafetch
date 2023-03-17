const fetcher = require("../../utils/fetcher");
const Scrap = require("./Scrap");
const qs = require("qs");

// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

class PlayerSync {
  async run(FranchiseID) {
    try {
      console.log("Sync Players started", FranchiseID);
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, [
        "fixtures",
        "fixtures.teams",
        "fixtures.player_battings",
        "fixtures.player_moms",
      ]);

      // task2
      // remove fixtures that have been completed
      const FilteredFixtures = await this.filterFixtures(SelectedWatchlists);
      console.log('FilteredFixtures.length ',FilteredFixtures.length);

      // task3
      // check to see if fixture is still active on LMS
      const PLAYERS = await this.ScrapPlayers(FilteredFixtures);
      //console.log(PLAYERS);

      // task4
      // check to see if fixture is still active on LMS
      const PLAYERSTOCREATE = await this.CheckPlayerStatus(PLAYERS);
      //console.log(PLAYERSTOCREATE);

      // task 5
      await this.CreateNewPlayers(PLAYERSTOCREATE);

      console.log("Sync Players Completed");
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

  async ScrapPlayers(FilteredFixtures) {
    const scraper = new Scrap();
    const PLAYERS = await scraper.startScraping(FilteredFixtures);
    return PLAYERS;
  }

  // Task 4
  /* ************************************************************************** */
  async CheckPlayerStatus(PLAYERS) {
    const CreatePlayer = [];
    if (PLAYERS.length != 0) {
      for (let item of PLAYERS) {
        try {
          const response = await IsPlayer(item.PlayerID);

          if (response.length === 0) {
            CreatePlayer.push(item);
          } else {
            console.log("Player Already in Strapi", response[0].id, response[0].attributes.Name);
          }
        } catch (error) {
          console.error(error);
        }
      }
      return CreatePlayer;
    } else {
      return [];
    }
  }

  // Task 5
  /* ************************************************************************** */
  async CreateNewPlayers(PLAYERS) {
    console.log("Create A New Player ")
    if (PLAYERS.length != 0) {
      for (let item of PLAYERS) {
        try {
          await CreatePlayers(item);
        } catch (error) {
          console.error(error);
        }
      }
      return true; // Indicate that the players were processed
    } else {
      return false;
    }
  }
}

module.exports = PlayerSync;

const IsPlayer = async (ID) => {
  const query = qs.stringify(
    {
      filters: {
        PlayerID: {
          $eq: ID,
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  return await fetcher(`players/?${query}`);
};

const CreatePlayers = async (PLAYER) => {
  return await fetcher(`players/`, "POST", {
    data: { Name: PLAYER.Name, PlayerID: PLAYER.PlayerID },
  });
};
