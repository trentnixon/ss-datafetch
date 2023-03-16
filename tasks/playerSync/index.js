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
      const SelectedWatchlists = await getSelectedWatchlists(ID,["fixtures","fixtures.player_moms"]);
      //console.log(SelectedWatchlists); 

      // task2
      // remove fixtures that have been completed
      const FilteredFixtures = await this.filterFixtures(SelectedWatchlists);
      //console.log(FixtureswithNoResult.length);

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
    const DayFromDate= 90
    const TwoWeeks = Math.floor(
      (Date.now() - DayFromDate * 24 * 60 * 60 * 1000) / 1000
    );
    return Fixtures.flatMap((fixture) =>
      fixture.attributes.fixtures.data.filter(
        (f) =>
          !f.attributes.hasResult &&
          f.attributes.UnixTime > TwoWeeks &&
          f.attributes.UnixTime <= NOW &&
          (f.attributes.hasPlayerSync !== true ||
            f.attributes.player_moms.data.length === 0) 
      )
    );
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
            //console.log("OLD PLAYER", response);
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
    if (PLAYERS.length != 0) {
      for (let item of PLAYERS) {
        try {
          return await CreatePlayers(item);
        } catch (error) {
          console.error(error);
        }
      }
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

  return await fetcher(`players/?${query}`) 
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};

const CreatePlayers = async (PLAYER) => {
  //console.log("CREATE ID", PLAYER.Name, PLAYER.PlayerID);
  return await fetcher(`players/`, "POST", {
    data: { Name: PLAYER.Name, PlayerID: PLAYER.PlayerID },
  })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};
