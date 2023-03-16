const fetch = require("node-fetch");
const dotenv = require("dotenv");
const qs = require("qs");
dotenv.config();





async function fetcherProgressUpdate(PATH, method = "GET", body = {}) {
 /*  let APIURL;

  APIURL = process.env.APIURL;

  // Add fetcher options
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI}`,
    },
  };

  //. if POST or PUT then add a body
  if (method === "POST" || method === "PUT") {
    options.body = JSON.stringify(body);
  }

  try {
    //console.log(`${APIURL}${PATH}`, options)
    const response = await fetch(`${APIURL}${PATH}?${query}`, options);
    const res = await response.json();

    console.log(" Update Player Count : ", res.data.length);
    return res.data;
  } catch (error) {
    console.log("Fetcher Error : ");
    console.error(error);
  } */
}

module.exports = fetcherProgressUpdate;
