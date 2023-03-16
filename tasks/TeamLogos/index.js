const fetcher = require("../../utils/fetcher");
const TeamLogoDownloader = require("./Scrap");
// Common
const getSelectedWatchlists = require("../../common/getSelectedWatchlists");

const qs = require("qs");

class TeamLogos {
  async run(FranchiseID) {
    try {
      console.log("Sync Players started", FranchiseID);
      const ID = FranchiseID;
      // task 1: find all leagues within the franchise
      const SelectedWatchlists = await getSelectedWatchlists(ID,["teams", "teams.Logo"]); 
      //console.log(SelectedWatchlists);

      // task2
      // remove fixtures that have been completed
      const FilteredTeams = await this.filterTeams(SelectedWatchlists);
      //console.log(FilteredTeams);

      // task3
      // check to see if fixture is still active on LMS
      const Images = await this.ScrapLogos(FilteredTeams);
      //console.log(PLAYERS);

      // task4
      // check to see if fixture is still active on LMS
      await this.UploadImagestoStrapi(Images);

      return { status: true };
    } catch (error) {
      console.error(error);
      // Return false to indicate failure
      return { status: false, error: error };
    }
  }

  // Task 2
  /* ************************************************************************ */

  async filterTeams(teams) {
    const mergedArray = teams.reduce((accumulator, current) => {
      return accumulator.concat(current.attributes.teams);
    }, []);

    const mergedData = mergedArray.reduce((acc, curr) => {
      return acc.concat(curr.data);
    }, []);

    // Add new item to this to filter on default image when we know what that will be
    const filteredData = mergedData.filter(
      (item) => item.attributes.Logo.data === null
    );

    return filteredData;
  }

  // Task 3
  /* ************************************************************************ */

  async ScrapLogos(FilteredTeams) {

    const teamLogoDownloader = new TeamLogoDownloader(FilteredTeams);
    const imageUrls = await teamLogoDownloader.downloadLogos();
    return imageUrls;
  }

  // Task 4
  /* ************************************************************************** */
  async UploadImagestoStrapi(Images) {

    if (Images.length !== 0) {
      const promises = Images.map(item => UploadThisImage(item));
      const results = await Promise.all(promises);
      //console.log("Has uploaded", results);
      return true;
    } else {
      return false;
    }
  }

}

module.exports = TeamLogos;

const UploadThisImage = async (IMAGE) => {
    //console.log('UploadThisImage ', IMAGE.imageUrl);
    try {
      const response = await fetcher(`teams/Createlogo`, "POST", { IMAGE });
      return response;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
