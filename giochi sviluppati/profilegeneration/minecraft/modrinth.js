const { default: axios } = require("axios");

const APIKEY_MODRINTH = process.env.APIKEY_MODRINTH || "";
const API_MODRINTH = "https://api.modrinth.com/api";

/**
 * query mods and return the data from it
 * @param {Array<string>} mods the mods to query
 * @returns {Promise<Array<any>>} the mods
 */
exports.getMods = async (mods) =>
  Promise.all(
    mods.map((modId) => {
      return axios
        .get(API_MODRINTH + "/v1/mod/" + modId)
        .then((result) => result.data);
    })
  );