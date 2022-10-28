const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs')
const config = require('./config')
const readDataFile = require('./readDataFile.js')
const citationFunctions = require('./citationFunctions.js')
const refdataFunctions = require('./refdataFunctions.js')
const requestFunctions = require('./requestFunctions.js')
const generalFunctions = require('./generalFunctions.js')
const interceptors = require('./interceptors.js')

const file = "data.csv"
const c = config.processArgs(process.argv);
var token = ''
var tenant = c.tenant
axios.defaults.timeout = 30000
axios.defaults.timeoutErrorMessage='timeout'
interceptors.setupInterceptors()
const folio = axios.create({
  baseURL: c.okapi,
  timeout: 30000
})

folio.interceptors.request.use(
  config => {
    config.headers = {
      'x-okapi-token': token,
      'x-okapi-tenant': tenant
    }
    return config;
  },
  error => {
    Promise.reject(error)
});

main();
function main() {
  try {
    generalFunctions.setToken()
    .then(() => {
      readDataFile(file)
      .then(requests => {
        const works = citationFunctions.getUniqueCitations(requests)
          works.forEach((w,k) => {
            worksPrep = []
            worksPrep.push(citationFunctions.createCitationRequest(w))
          })
          Promise.all(worksPrep)
          .then((responses) => {
            refdataFunctions.getRefDataCategories()
            .then( response => {
              rdc = response.data
              publisherRefData = rdc.filter(rdc => rdc.desc == "PublicationRequest.Publisher")[0]
              licenseRefData = rdc.filter(rdc => rdc.desc == "PublicationRequest.License")[0]
              const publisherCategoryUUID = publisherRefData.id;
              const licenseCategoryUUID = licenseRefData.id;
              var publishers = generalFunctions.getUniqueValues(requests,"publisher")
              var licenses = generalFunctions.getUniqueValues(requests,"license_ref")
              var issns = citationFunctions.getUniqueCitations(requests,"issn")
              //if the publisher/license already exists in the retrieved refDataValues
              //then we don't need to create them
              publisherRefData.values.forEach((p) => {
                index = publishers.indexOf(p)
                if(index > -1) {
                  publishers.splice(index, 1);
                }
              })
              licenseRefData.values.forEach((p) => {
                index = licenses.indexOf(p)
                if(index > -1) {
                  licenses.splice(index, 1);
                }
              })
              //array of promises to get system ready for requests
              dataPrep = []
              workIds = []
              if (publishers.length > 0) {
                const publisherValues = refdataFunctions.refDataValues(publishers)
                dataPrep.push(refdataFunctions.setupRefData(publisherCategoryUUID,publisherValues))
              }
              if (licenses.length > 0) {
                const licenseValues = refdataFunctions.refDataValues(licenses)
                dataPrep.push(refdataFunctions.setupRefData(licenseCategoryUUID,licenseValues))
              }
              works.forEach((k,w) => {
                dataPrep.push(citationFunctions.createCitationRequest(w))
              })
              Promise.all(dataPrep)
              .then ((responses) => {
                  //need to work out how to assign work IDs to a keyed Array
                  //with issn as key?
                console.log("All data prep should be done now")
                requestFunctions.addRequests(requests)
              })
              .catch(error => {
                console.log(error);
              })
            })
          })
        })
    })
  }
  catch (e) {
    if (e.message) {
      console.log(e.message);
    } else {
      console.log(e);
    }
    process.exit(1);
  }
};
