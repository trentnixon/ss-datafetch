const axios = require("axios");
const dotenv = require("dotenv");
const qs = require("qs");

// Load environment variables from .env file
dotenv.config();

/**
 * Makes an API request using Axios library with the given method, path and body.
 * @param {string} PATH - The path to the API endpoint.
 * @param {string} method - The HTTP method to use (default: "GET").
 * @param {Object} body - The request body (default: {}).
 * @returns {Promise<Object>} - The response data from the API request.
 */
async function fetcher(PATH, method = "GET", body = {}) {
  let APIURL;

  APIURL = process.env.APIURL;

  // Add fetcher options
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI}`,
    },
    url: `${APIURL}${PATH}`,
  };
  //. if POST or PUT then add a body
  if (method === "POST" || method === "PUT") {
    options.data = JSON.stringify(body);
  }

  /* console.log(`${APIURL}${PATH}`) */
  try {
    // Make the API request and wait for the response
    const response = await axios(options);

    // If the response does not have any data, throw an error
   /*  if (!response.data) {
      //throw new Error(`HTTP error! status: ${response.status}`);
    } */

    // Extract the response data from the API response
    const res = response.data;

    // Return the response data
    return res.data;
  } catch (error) {
    console.log(`Error found on ${APIURL}${PATH}`)
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log(error.config);
  }
}

/*
// Example usage
async function main() {
  try {
    const PATH = "/api/users";
    const method = "POST";
    const body = { username: "johndoe", password: "password123" };
    const responseData = await fetcher(PATH, method, body);
    console.log(responseData);
  } catch (error) {
    console.error(error);
  }
}
*/

module.exports = fetcher;
