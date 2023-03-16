const fetcher = require("../../utils/fetcher");
const qs = require("qs");
const Scrap = require("./Scraper");

// Common
const getSelectedFranchise = require("../../common/getSelectedFranchise");

class FindAllFranchiseTeams { 
  async run(FranchiseID) {
    try {
      console.log("FindAllFranchiseTeams started");

      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedFranchise = await getSelectedFranchise(ID);
   
      // task 2: send the urls within that returned data to a scrapper
      const ScrapedOBJ = await this.scrapFranchiseForTeams(SelectedFranchise);

      // task 3: evaluate the html for leagues, check to see if any of the leagues are new against the list of leagues we got from step 1
      const UpdatedOBJ = await this.evaluateLeagueData(ScrapedOBJ);

      // task 4: create or update the leagues by sending an API request to the Strapi Endpoint
      await this.assignNewTeamsToLeaguesLeagues(UpdatedOBJ);

      console.log("FindAllFranchiseTeams completed");

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
  async scrapFranchiseForTeams(SelectedFranchise) {
    const scraper = new Scrap();
    scraper.url = `${process.env.LMS_ScrapURL}${process.env.LMS_PATH_Table}`;
    scraper.data = SelectedFranchise.attributes.watch_lists.data;

    try {
      const allTeams = await scraper.start();
      return allTeams;
    } catch (error) {
      console.error(error);
    }
  }

  // Task 3
  /* ************************************************************************ */
  async evaluateLeagueData(ScrapedOBJ) {
    let add = [];
    let update = [];

    for (const item of ScrapedOBJ) {
      let query = qs.stringify(
        {
          filters: {
            TeamID: {
              $eq: item.teamID,
            },
          },
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
      try {
        const response = await fetcher(`teams?${query}`);
        const data = response[0]?.attributes;

        if (!data) {
          // Check if the teamID already exists in the add array
          const existingItem = add.find(
            (existingItem) => existingItem.teamID === item.teamID
          );
          if (!existingItem) {
            add.push(item);
          }
        } else if (data.Name !== item.name) {
          item.StrapiID = response[0].id;
          update.push(item);
        } else {
          item.StrapiID = response[0].id;
        }
      } catch (error) {
        console.error(error);
      }
    }

    const addedTeams = await handleAddAndUpdate(add, update);

    for (const addedTeam of addedTeams) {
      const item = ScrapedOBJ.find(
        (existingItem) => existingItem.teamID === addedTeam.teamID
      );
      if (item) {
        item.StrapiID = addedTeam.id;
      }
    }

    return ScrapedOBJ;
  }
  // Task 4
  /* ************************************************************************ */
  async assignNewTeamsToLeaguesLeagues(UpdatedOBJ) {
    const groupedTeams = Object.values(
      UpdatedOBJ.reduce((accumulator, currentTeam) => {
        const { name, teamID, leagueID, StrapiID } = currentTeam;

        if (!accumulator[teamID]) {
          accumulator[teamID] = {
            name,
            teamID,
            StrapiID,
            leagueID: [leagueID],
          };
        } else {
          accumulator[teamID].leagueID.push(leagueID);
        }

        return accumulator;
      }, {})
    );

    let updatePromises = [];
    if (groupedTeams.length > 0) {
      for (const league of groupedTeams) {
        updatePromises.push(
          fetcher(`teams/${league.StrapiID}`, "PUT", {
            data: { watch_lists: league.leagueID },
          })
        );
      }
    }
    await Promise.all(updatePromises);
    return { TeamUpdate: true };
  }
}

module.exports = FindAllFranchiseTeams;

async function handleAddAndUpdate(add, update) {
  let addPromises = [];
  let updatePromises = [];
  let addedTeams = [];

  if (add.length > 0) {
    for (const team of add) {
      addPromises.push(
        fetcher("teams", "POST", {
          data: {
            Name: team.name.trim(),
            TeamID: team.teamID,
          },
        }).then((response) => {
          addedTeams.push({
            id: response.id,
            teamID: team.teamID,
          });
        })
      );
    }
  }

  if (update.length > 0) {
    for (const team of update) {
      //console.log(team);
      updatePromises.push(
        fetcher(`teams/${team.StrapiID}`, "PUT", { data: { Name: team.name } })
      );
    }
  }

  await Promise.all(addPromises.concat(updatePromises));

  return addedTeams;
}
