const { default: axios } = require("axios");

const APIKEY_CURSEFORGE = process.env.APIKEY_CURSEFORGE || "";
const API_CURSEFORGE = "https://api.curseforge.com";

/**
 * query mods and return the data from it
 * @param {Array<number>} mods the mods to query
 * @returns {Promise<Array<any>>} the mods
 */
exports.getMods = async (mods) =>
  axios
    .post(
      API_CURSEFORGE + "/v1/mods",
      {
        modIds: mods,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": APIKEY_CURSEFORGE,
        },
      }
    )
    .then((result) => result.data.data);