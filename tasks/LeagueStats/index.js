const fetcher = require("../../utils/fetcher");
const Scrapper = require("./scrap");

// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

class GetLeagueStats {
  async run(FranchiseID) {
    try {
      console.log("GetLeagueStats  started", FranchiseID);
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, ["fixtures"]);
      //console.log("SelectedWatchlists ",SelectedWatchlists);

      // task2
      // remove fixtures that have been completed
      const Results = await this.FilterFixtures(SelectedWatchlists);
      //console.log(Results);

      // task3
      // check to see if fixture is still active on LMS
      //await this.UpdateTables(Results);

      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  // Task 2
  /* ************************************************************************ */

  async FilterFixtures(DATA) {
        //console.log(DATA)
  }

  // Task 3
  /* ************************************************************************ */
  async UpdateTables(Results) {
    Results.map((y, i) => {
      addTable(
        {
          LeagueTable: y.objArray,
        },
        y.id
      );
    });
  }
}
module.exports = GetLeagueStats;


