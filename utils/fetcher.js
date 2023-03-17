const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

function logAxiosError(error) {
  console.error(`Error found on ${error.config.url}`);

  if (error.response) {
    console.error("Response Error:");
    console.error("Request URL:", error.response.config.url);
    console.error("Request Method:", error.response.config.method);
    console.error("Data:", error.response.data);
    console.error("Status:", error.response.status);
    console.error("Headers:", error.response.headers);
  } else if (error.request) {
    console.error("Request Error:");
    console.error("Request URL:", error.config.url);
    console.error("Request Method:", error.config.method);
    console.error("Request status:", error.request.status);
    console.error("Request statusText:", error.request.statusText);
    /* console.error("Request:", error.request); */
  } else {
    console.error('General Error:', error.message);
  }

  console.error('Config:', error.config);
}

async function fetcher(PATH, method = "GET", body = {}) {
  let APIURL;

  APIURL = process.env.APIURL;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI}`,
    },
    url: `${APIURL}${PATH}`,
  };

  if (method === "POST" || method === "PUT") {
    options.data = JSON.stringify(body);
  }

  try {
    const response = await axios(options);
    const res = response.data;
    return res.data;
  } catch (error) {
    logAxiosError(error);
    throw error;
  }
}

module.exports = fetcher;
