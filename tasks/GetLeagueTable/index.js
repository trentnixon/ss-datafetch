const fetcher = require("../../utils/fetcher");
const Scrapper = require("./scrap");

// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

class GetLeaugeTable {
  async run(FranchiseID) {
    try {
      console.log("GetLeaugeTable started", FranchiseID);
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, ["franchise"]);
      //console.log("SelectedWatchlists ",SelectedWatchlists);

      // task2
      // remove fixtures that have been completed
      const Results = await this.ScrapFixtureResults(SelectedWatchlists);
      //console.log(Results);

      // task3
      // check to see if fixture is still active on LMS
      await this.UpdateTables(Results);

      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  // Task 2
  /* ************************************************************************ */

  async ScrapFixtureResults(DATA) {
    const TABLEPATHS = [];
    DATA.map((data) => {
      TABLEPATHS.push({
        Name: data.attributes.Name,
        Path: data.attributes.PATH,
        id: data.id,
      });
    });

    if (TABLEPATHS.length === 0) {
      return [];
    } else {
      const scrapper = new Scrapper(TABLEPATHS);
      await scrapper.movePointer();
      return scrapper.resultsArr;
    }
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
module.exports = GetLeaugeTable;

const addTable = async (DATA, ID) => {
  return await fetcher(`watch-lists/${ID}`, "PUT", { data: DATA })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};
