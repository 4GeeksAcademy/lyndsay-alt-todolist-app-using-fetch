window.onload = async function () {
  const BASE_URL = "https://playground.4geeks.com/todo";
  const username = "lyndsay44";
  this.fetch(`$(BASE_URL)users/${username}`, {
    method: "get",
    headaers: {
      Content_Type: "application/json",
    },
  })
    .then((response) => {
      console.log(">>> this is the statue code", response.status);
      console.log(">>> this is the status text", response.statusText);
      return response.json();
    })

    .then((body) => {
      console.log(">>> this is the body", body);
    })

    .catch((error) => {
      console.log(">>> this is the error:", error);
    });
};
console.log(">>> I'm ready");
