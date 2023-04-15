const fetcher = require("../../utils/fetcher");
//const Scrapper = require("./scrap");
const CricketStatsCalculator = require('./CricketStatsCalculator')
// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

const STATOBJ = {
  RUNS: [],
  WICKETS: [],
  OVERS: [],
  FIXTURES: [],
  StatsOverTime: [],
  TeamStats: [],
};

class GetFranchiseStats {
  async run(FranchiseID) {
    try {
      //console.log("Team Meta Data started", FranchiseID);
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, [
        "fixtures",
        "fixtures.player_battings",
        "fixtures.player_bowlings",
        "fixtures.player_catches",
        "fixtures.player_stumpings",
      ]);

      //console.log("SelectedWatchlists ",SelectedWatchlists);

      // task2
      // remove fixtures that have been completed
      const FIXTURES = await this.FlaternFixtures(SelectedWatchlists);
      //console.log(`Franchise Fixtures ${FIXTURES[0]}`);

      // task3
      const FilteredFixtures = await this.FlilterFixtures(FIXTURES);
      //console.log(FilteredFixtures);
      const STATSOBJ = await this.StatsContructor(FilteredFixtures);
      //console.log("STATSOBJ", STATSOBJ);

      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  // Task 2
  /* ************************************************************************ */

  async FlaternFixtures(DATA) {
    return DATA.map((item) => item.attributes.fixtures.data).flat();
  }

  // Task 3
  /* ************************************************************************ */

  async FlilterFixtures(DATA) {
    //console.log(`Total Games ${DATA.length}`);
    const REMOVENONGAMES = DATA.filter((o) => {
      const REMOVESCORES = [
        "50 / 0 (20.0)",
        "50 / 0",
        "0 / 8 (1.0)",
        "/ 0 (0.0)",
      ];
      return (
        !REMOVESCORES.includes(o.attributes.HomeTeamResult) && 
        !REMOVESCORES.includes(o.attributes.AwayTeamResult)
      );
    });
    //console.log("Games left after Non Games Removed = ", REMOVENONGAMES.length);
    return REMOVENONGAMES;
  }

  // Task 3
  /* ************************************************************************ */
  async StatsContructor(DATA) {
    const cricketStats = new CricketStatsCalculator(DATA);
    const STATS = await cricketStats.calculateStats();
    //console.log(STATS)
  }
}
module.exports = GetFranchiseStats;
