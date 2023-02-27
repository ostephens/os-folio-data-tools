const https = require('https')
const axios = require('axios');
const config = require('./config')
const readDataFile = require('../general-tools/readDataFile.js')
const citationFunctions = require('./citationFunctions.js')
const refdataFunctions = require('./refdataFunctions.js')
const generalFunctions = require('../general-tools/generalFunctions.js')
const interceptors = require('./interceptors.js')

const file = "data.tsv"
const c = config.processArgs(process.argv);
var token = ''
var tenant = c.tenant
axios.defaults.timeout = 30000
axios.defaults.timeoutErrorMessage='timeout'
interceptors.setupInterceptors(axios)
const folio = axios.create({
  baseURL: c.okapi,
  delayed: true,
  timeout: 30000,
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 6 })
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
    generalFunctions.getToken(folio,c.username,c.password)
    .then(response => {
      token = response.headers['x-okapi-token']
      readDataFile.readDataFile(file)
      .then(requests => {
        const works = citationFunctions.getUniqueCitations(requests)
          works.forEach((w,k) => {
            worksPrep = []
            worksPrep.push(citationFunctions.createCitationRequest(folio,w))
          })
          Promise.all(worksPrep)
          .then((responses) => {
            refdataFunctions.getRefDataCategories(folio)
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
              if (publishers.length > 0) {
                const publisherValues = refdataFunctions.refDataValues(publishers)
                dataPrep.push(refdataFunctions.setupRefData(folio,publisherCategoryUUID,publisherValues))
              }
              if (licenses.length > 0) {
                const licenseValues = refdataFunctions.refDataValues(licenses)
                dataPrep.push(refdataFunctions.setupRefData(folio,licenseCategoryUUID,licenseValues))
              }
              Promise.all(dataPrep)
              .then ((responses) => {
                console.log("All data prep should be done now")
                citationFunctions.addRequests(folio,requests)
              })
              .catch(error => {
                console.log(error);
              })
            })
          })
          .catch(error => {
            console.log(error)
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
