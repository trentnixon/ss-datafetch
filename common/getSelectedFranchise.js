const qs = require("qs");
const fetcher = require("../utils/fetcher");

async function getSelectedFranchise(ID) {
  const query = qs.stringify(
    {
      populate: ["watch_lists"],
    },
    {
      encodeValuesOnly: true, // prettify URL
    }
  );

  return await fetcher(`franchises/${ID}?${query}`)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = getSelectedFranchise;
