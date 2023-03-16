const fetcher = require("./fetcher");


// Function to send API request
function sendAPIRequest(UPDATEOBJ) {
  console.log(UPDATEOBJ)
  
     fetcher(`franchises/${UPDATEOBJ._ID}`, "PUT", {
      data: UPDATEOBJ,
    })
      .then((data) => {
        return data;
      })
      .catch((error) => {
        console.log(error.response.data); 
      });
  }

  module.exports = sendAPIRequest