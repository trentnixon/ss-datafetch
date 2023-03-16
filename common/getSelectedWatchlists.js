const qs = require("qs");
const fetcher = require("../utils/fetcher");

async function getSelectedWatchlists(ID,populateFields=[]) {
    const query = qs.stringify(
        {
          filters: {
            franchise: { id: { $eq: ID } },
            hasCompleted: { $null: true },
          },
          populate: populateFields //["franchise","fixtures", "fixtures.teams","teams", "teams.Logo"],
        },
        {
          encodeValuesOnly: true, // prettify URL
        }
      );
      try {
        const data = await fetcher(`watch-lists/?${query}`);
        return data;
      } catch (error) {
        console.log(error);
      }
}
module.exports = getSelectedWatchlists;