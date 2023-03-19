const fetcher = require("../../utils/fetcher");
//const qs = require("qs");
const CheckHasFixture = require("./utils/checkhasFixture");
const scrapLeague = require("./utils/scrapNewFixtures");
const { AddGround, Addteams, AddUmpires } = require("./utils/FindorCreate");
// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

/*
    STRUCTURE

  bugs and test for:
  statto is not finding games that have already been completed and not in the system.
  i.e. if a franchise joins late, there early games are not recorded. 

  // order of operation
  - select leagues from fracnhise [tick]
  = get a array of there fixtures stored on strapi [tick]
  - filter those fixtures to those without a result [tick]
  - scrap LMS to see if Strapi fixture has a valid URL [tick]
  - Delete Strapi Fixture if URL is 404 [tick]
  - split LMS fixtures into update and New
  - check if anything has changed on update
  - run API calls to strapi
  - add relational
*/

class SyncLeagueFixtures {
  async run(FranchiseID) {
    try {
      console.log("FindAllFranchiseTeams started");

      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID, [
        "fixtures",
        "fixtures.teams",
      ]);

      // task2
      // scrap LMS for items
      const LMSITEMS = await this.ScrapLMSforItems(SelectedWatchlists);

      // task3
      // remove fixtures that have been completed
      const StrapiFixtureArray = await this.filterFixtures(SelectedWatchlists);
      const [StrapiFixtureWithNoResult, StrapiFixturehasResult] =
        StrapiFixtureArray;

      // task 4
      const LMSItemsNotInStrapi = await this.filterOnHasResults(
        LMSITEMS,
        StrapiFixturehasResult
      );

      // task 5
      // filter remain items on new or update
      const ArrayOfAddAndUpdateItems = await this.filterItemRoutes(
        LMSItemsNotInStrapi,
        StrapiFixtureWithNoResult
      );

      // task 6
      // add and create items
      await this.FixturesCreateAndUpdate(
        ArrayOfAddAndUpdateItems,
        StrapiFixtureArray
      );

      // task 7
      await this.AssignRelationals(ArrayOfAddAndUpdateItems);

      // task 8
      // check to see if fixture is still active on LMS
      await this.hasLMSFixtures_DeleteLMSFixtue(StrapiFixtureWithNoResult);
      //console.log('FixturesWithActiveLMSPages ',FixturesWithActiveLMSPages.length);

      // Return true to indicate success
      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  // Task 2
  /* ************************************************************************ */

  async ScrapLMSforItems(SelectedFranchise) {
    // Retrieve fixtures from STRAPI
    const fixturesArr = await Promise.all(
      SelectedFranchise.map((league) =>
        scrapLeague(league.attributes, league.id)
      )
    );
    const ALLFranchiseFixturesonLMS = fixturesArr.flat();
    return ALLFranchiseFixturesonLMS;
  }

  // Task 3
  /* ************************************************************************ */

  async filterFixtures(Fixtures) {
    const NoResult = Fixtures.flatMap((fixture) =>
      fixture.attributes.fixtures.data.filter(
        (f) =>
          !f.attributes.hasMeta ||
          !f.attributes.hasResult ||
          f.attributes.teams.data.length === 0
      )
    );
    
    const hasResult = Fixtures.flatMap((fixture) =>
      fixture.attributes.fixtures.data.filter(
        (f) =>
          f.attributes.hasResult &&
          f.attributes.hasMeta &&
          f.attributes.teams.data.length !== 0
      )
    );

     return [NoResult, hasResult];
  }

  // task
  /* *************************************************************** */
  async filterOnHasResults(LMSITEMS, StrapiFixturehasResult) {
    return filterByFixtureIDNotInStrapi(LMSITEMS, StrapiFixturehasResult);
  }
  // task
  /* *************************************************************** */
  async filterItemRoutes(LMSItemsNotInStrapi, StrapiFixtureWithNoResult) {
    const CreateItems = filterByFixtureIDNotInStrapi(
      LMSItemsNotInStrapi,
      StrapiFixtureWithNoResult
    );
    const UpdateItems = filterByFixtureIDPresentInStrapi(
      LMSItemsNotInStrapi,
      StrapiFixtureWithNoResult
    );

    return [CreateItems, UpdateItems];
  }

  // task
  /* *************************************************************** */
  async FixturesCreateAndUpdate(AddUpdateItems, StrapiFixtureArray) {
    const [StrapiFixtureWithNoResult, StrapiFixturehasResult] =
      StrapiFixtureArray;
    const [Create, Update] = AddUpdateItems;

    await Promise.all(
      Create.map(async (item) => {
        try {
          const RecentlyCreated = await CreateFixture(item);
          //console.log("RecentlyCreated", RecentlyCreated.id);
          item.id = RecentlyCreated.id;
        } catch (error) {
          console.error(error);
        }
      })
    );

    await Promise.all(
      Update.map(async (item) => {
        try {
          const matchingFixture = StrapiFixtureWithNoResult.find(
            (f) => f.attributes.fixtureID === item.fixtureID
          );
          if (matchingFixture) {
            //console.log("fixture has a Strapi ID ", matchingFixture.id);
            item.id = matchingFixture.id;

            await updateFixture(item);
          } else {
            //console.log("NO fixture in strapi for  ", item.fixtureID);
          }
        } catch (error) {
          console.error(error);
        }
      })
    );
  }

  // Task 4
  /* ************************************************************************ */

  async hasLMSFixtures_DeleteLMSFixtue(Fixtures) {
    //returns { activeFixtures: this.activeFixtures, toBeDeleted: this.toBeDeleted };
    const checkFixture = new CheckHasFixture(Fixtures);

    for (let i = 0; i < Fixtures.length; i++) {
      try {
        await checkFixture.startLookup();
        //checkFixture.movePointer();
      } catch (error) {
        console.log("Error: ", error);
      }
    }

    // DELETE the strapi fixtures that dont have a Valif URL
    console.log('checkFixture.toBeDeleted', checkFixture.toBeDeleted)
    const promises = checkFixture.toBeDeleted.map(async (item) => {
      try {
        //console.log("DELETE ", item.id);
        await fetcher(`fixtures/${item.id}`, "DELETE");
        //console.log(response);
      } catch (error) {
        console.error(error);
      }
    });

    await Promise.all(promises);
    // Return all of the Fixtures that still have a Valif LMS URL
    return checkFixture.activeFixtures;
  }

  // Task 5
  /* ************************************************************************ */

  async AssignRelationals(ArrayOfAddAndUpdateItems) {
    const mergedArr = [
      ...ArrayOfAddAndUpdateItems[0],
      ...ArrayOfAddAndUpdateItems[1],
    ];

    for (let i = 0; i < mergedArr.length; i++) {
      const fix = mergedArr[i];
      if (fix?.id !== undefined) {
        //console.log(fix.HomeTeam, fix.AwayTeam, fix.id)
        await Promise.all([
          AddGround(fix.Ground, fix.id),
          AddUmpires(fix.Umpire, fix.id),
          Addteams(fix.HomeTeam, fix.AwayTeam, fix.id),
        ]);
        await fetcher(`fixtures/${fix.id}`, "PUT", {
          data: { hasRelational: true },
        });
      } else {
        //console.log(fix.HomeTeam, fix.AwayTeam, fix.id)
      }
    }
  }
}

module.exports = SyncLeagueFixtures;

async function updateFixture(item) {
  await fetcher(`fixtures/${item.id}`, "PUT", { data: item });

  return true;
}
async function CreateFixture(item) {
  return fetcher("fixtures", "POST", { data: item });
}

function filterByFixtureIDNotInStrapi(arr, strapiArr) {
  // Get an array of fixture IDs from the strapiArr objects
  const strapiFixtureIDs = strapiArr.map((obj) => obj.attributes.fixtureID);

  // Filter the arr to include only objects with fixtureIDs that aren't in strapiFixtureIDs
  const filteredArr = arr.filter(
    (obj) => !strapiFixtureIDs.includes(obj.fixtureID)
  );

  return filteredArr;
}

function filterByFixtureIDPresentInStrapi(arr, strapiArr) {
  // Get an array of fixture IDs from the strapiArr objects
  const strapiFixtureIDs = strapiArr.map((obj) => obj.attributes.fixtureID);

  // Filter the arr to include only objects with fixtureIDs that aren't in strapiFixtureIDs
  const filteredArr = arr.filter((obj) =>
    strapiFixtureIDs.includes(obj.fixtureID)
  );

  return filteredArr;
}
