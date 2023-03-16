const fetcher = require("../../utils/fetcher");
const Scrapper = require("./scrap");
const qs = require("qs");

// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

class FixtureResults {
  async run(FranchiseID) {
    try {
      console.log("FixtureResults started", FranchiseID);
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID,["franchise"]); 
      //console.log("SelectedWatchlists ",SelectedWatchlists);

      // task2
      // remove fixtures that have been completed
      const Results = await this.ScrapFixtureResults(SelectedWatchlists);
      //console.log(Results);

      // task3
      // check to see if fixture is still active on LMS
      const Updates = await this.UpdateFixtures(Results); 

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
    //console.log("DATA", DATA.length)
    if (DATA.length === 0) {
      return [];
    } else {
     
      const scrapper = new Scrapper(DATA);
      await scrapper.movePointer();
      return scrapper.resultsArr;
    }
  }

  // Task 3
  /* ************************************************************************ */
  async UpdateFixtures(Results) {
    for (let item of Results) {
      const ID = await IsFixtureID(item.fixtureID);
      //console.log("ID ",ID[0]?.id)
      if (ID[0]?.id !== undefined) {
        const add = await addResult(item, ID[0]?.id);
        //console.log(add.id, "updated with a result");
      }
    }
  }
}
module.exports = FixtureResults;

const IsFixtureID = async (ID) => {
  const query = qs.stringify(
    {
      filters: {
        fixtureID: {
          $eq: ID,
        },
      },
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  return await fetcher(`fixtures/?${query}`)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};

const addResult = async (DATA, ID) => {
  return await fetcher(`fixtures/${ID}`, "PUT", { data: DATA })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};
