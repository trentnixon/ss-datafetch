const fetcher = require("../../utils/fetcher");
const SCRAP = require("./Scrap");
const qs = require("qs");

// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

class TeamMetaData {
  async run(FranchiseID) {
    try {
      console.log("Team Meta Data started", FranchiseID); 
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID,["teams"]);
      //console.log(SelectedWatchlists);
 
      // task2
      // remove fixtures that have been completed
      const TeamList = await this.FindTeamList(SelectedWatchlists);
      //console.log(TeamList.length);

      // task3
      // check to see if fixture is still active on LMS
      const Teams = await this.ScrapTeams(TeamList);
      //console.log(Teams);

      // task4
      // check to see if fixture is still active on LMS
      const hasTeamsUpdated = await this.UpdateTeams(Teams);
      //console.log(hasTeamsUpdated);

      // task 5
      //await this.CreateNewPlayers(PLAYERSTOCREATE);

      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }




  // Task 2
  /* ************************************************************************ */
  async FindTeamList(SelectedFranchise) {
    const mergedArray = SelectedFranchise.flatMap(
      (item) => item.attributes.teams.data
    );

    // write a small hack in here to clean up the team names
    //console.log("mergedArray ", mergedArray.length);
    


    const filteredArray = mergedArray.filter((item) => {
      const lastUpdated = new Date(item.attributes.updatedAt);
      const today = new Date();
      const timeDiff = today.getTime() - lastUpdated.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      return daysDiff >= 7;
    });

    //console.log("filteredArray ", filteredArray.length);
    return filteredArray;
  }
  // Task 3
  /* ************************************************************************ */

  async ScrapTeams(TeamList) {
    if(TeamList.length === 0 ){
        return []
    }else{
        const scraper = new SCRAP();
        scraper.DATA = TeamList;
        await scraper.MovePointer();
        //console.log(scraper.scrapedData);
        return scraper.scrapedData;
    }
    
  }

  // Task 3
  /* ************************************************************************ */

  async UpdateTeams(UpdateTeams) {
    if(UpdateTeams.length === 0){
        return []
    }else{
        //console.log("UpdateTeams ", UpdateTeams);

        const promises = UpdateTeams.map(async (item) => {
          try {
            const Updated = await Updater(item);
            //console.log(Updated);
            return Updated;
          } catch (error) {
            console.log(error);
            return false;
          }
        });
    
        const results = await Promise.all(promises);
        return results;
    }
   
  }
}

module.exports = TeamMetaData;

const Updater = async (TEAM) => {
  const data = { data: TEAM };
  const Updated = await fetcher(`teams/${TEAM.StrapiID}`, "PUT", data);
  return Updated;
};
