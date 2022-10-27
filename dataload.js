const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs')
const config = require('./config')

const file = "data.csv"
const c = config.processArgs(process.argv);
var token = ''
var tenant = c.tenant
axios.defaults.timeout = 30000
axios.defaults.timeoutErrorMessage='timeout'
setupInterceptors()
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
    var requests = []
    readDataFile(file,requests)
    setToken()
    .then(() => {
      getRefDataCategories()
      .then( rdc => {
        publisherRefData = rdc.filter(rdc => rdc.desc == "PublicationRequest.Publisher")[0]
        licenseRefData = rdc.filter(rdc => rdc.desc == "PublicationRequest.License")[0]
        const publisherCategoryUUID = publisherRefData.id;
        const licenseCategoryUUID = licenseRefData.id;
        var publishers = getUniqueValues(requests,"publisher")
        var licenses = getUniqueValues(requests,"license_ref")
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
          const publisherValues = refDataValues(publishers)
          dataPrep.push(setupRefData(publisherCategoryUUID,publisherValues))
        }
        if (licenses.length > 0) {
          const licenseValues = refDataValues(licenses)
          dataPrep.push(setupRefData(licenseCategoryUUID,licenseValues))
        }
        Promise.all(dataPrep)
        .then ((data) => {
          console.log("All data prep should be done now")
          addRequests(requests)
        })
        .catch(error => {
          console.log(error);
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

function getUniqueValues(data,key) {
  d = data
  k= key
  return Array.from(new Set(d.map(({ [k]: value }) => value)))
}

function setupRefData(categoryUUID,values) {
  return (folio({
      method: 'put',
      url: '/oa/refdata/'+categoryUUID,
      data : {
        "values": values
      }
    }))
}

function setToken() {
  return (folio({
      method: 'post',
      url: '/bl-users/login',
      data : {
        "username": c.username,
        "password": c.password
      }
    })
    .then(response => {
      token = response.headers['x-okapi-token']
      return
    })
    .catch(error => {
      console.log(error);
    })
  )
}

function readDataFile(file,requests) {
  fs.createReadStream(file)
    .pipe(csv())
    .on('data', (data) => requests.push(data))
    .on('end', () => {
      return requests
      // we have an array of 'results'
      // {
      //   File: 'UL_2019_apc_enriched.csv',
      //   institution: 'Leipzig U',
      //   period: '2019',
      //   euro: '1685.04',
      //   doi: '10.1186/s13019-019-0831-0',
      //   is_hybrid: 'FALSE',
      //   publisher: 'Springer Nature',
      //   journal_full_title: 'Journal of Cardiothoracic Surgery',
      //   issn: '1749-8090',
      //   issn_print: 'NA',
      //   issn_electronic: '1749-8090',
      //   issn_l: '1749-8090',
      //   license_ref: 'http://creativecommons.org/licenses/by/4.0/',
      //   indexed_in_crossref: 'TRUE',
      //   pmid: '30651112',
      //   pmcid: 'PMC6335711',
      //   ut: 'ut:000455922000001',
      //   url: 'NA',
      //   doaj: 'TRUE'
      // }
    });
}

function getRefDataCategories() {
  return folio({
      method: 'get',
      url: '/oa/refdata?max=100'
    })
    .then(response => {
      return response.data
    })
    .catch(error => {
      console.log(error);
    })
}

function addRequests(requests) {
  requests.forEach((r) => {
      i = r["issn"].toUpperCase()
      p = r["issn_print"].toUpperCase()
      e = r["issn_electronic"].toUpperCase()
      k = i.replace("-","")

      if(validateISSN(i)) {
        const citation = createCitation(r)
        //would be better to first search for issn and only create if we need to
        folio({
          method: 'post',
          url: '/oa/works/citation',
          data: citation
        })
        .then(response => {
          workId = response.data.id
          console.log(workId)
          request = {
            requestDate: "2020-12-31",
            requestStatus: {value: "open"},
            publisher: {value: r.publisher},
            license: {value: r.license_ref},
            doi: r.doi,
            publicationTitle: r.publicationTitle,
            authorNames: r.authorNames,
            publicationUrl: r.url,
            work: {id: workId},
            publicationType: "journal_article"
            //pmid?
          }
          folio({
            method: 'post',
            url: '/oa/publicationRequest',
            data: request
          })
          .then(response => {
            if(response.data.id != undefined) {
              charge = {
                tax: "0",
                discountType: {value: "subtracted"},
                exchangeRate: {coefficient: 1,toCurrency: "EUR"},
                amount: {baseCurrency: "EUR", value: r.euro},
                category: {value: "apc"},
                chargeStatus: {value: "paid"},
                discount: 0,
                paymentPeriod: r.period,
                estimatedInvoicePrice: {baseCurrency: "EUR", value: r.euro},
                estimatedPrice: {baseCurrency: "EUR", value: r.euro},
                owner: {id: response.data.id}
              }
              folio({
                method: 'post',
                url: '/oa/charges',
                data: charge
              })
              .then(chargeResponse => {
                return
              })
            return
            }
          })
          .catch(error => {
            console.log(error);
          })
        })
        .catch(error => {
          console.log(error);
        })
      }
    })
}

function refDataValues(list) {
  values = []
  list.map(l => values.push({label:l}))
  return values
}

function createCitation(request) {
  i = request["issn"].toUpperCase()
  p = request["issn_print"].toUpperCase()
  e = request["issn_electronic"].toUpperCase()
  k = i.replace("-","")
  if(validateISSN(i)) {
    instances = []
    if(validateISSN(p)) {
      instances.push({ids:[{ns: "issn", id: p}],subType: "print"})
    }
    if(validateISSN(e)) {
      instances.push({ids:[{ns: "issn", id: e}],subType: "electronic"})
    }
    if(!validateISSN(p) && !validateISSN(e)) {
      instances.push({ids:[{ns: "issn", id: i}],subType: "electronic"})
    }
    if(request["is_hybrid"]==="FALSE") {
      oas = "gold"
    } else {
      oas = "hybrid"
    }
    if(request["doaj"]==="TRUE") {
      doaj = "yes"
    } else {
      doaj = "no"
    }
    let c = {  title: request["journal_full_title"],
            indexedInDOAJ: doaj,
            oaStatus: oas,
            type: "serial",
            instances: instances
          }
    return c
  }
}

function validateISSN(issn) {
  const issnRE = /^\d{4}\-\d{3}[0-9X]$/;
  return issnRE.test(issn)
}

function setupInterceptors() {
  axios.interceptors.request.use((config) => {
    return {
      ...config,
      p0: performance.now(),
    };
  }, (error) => Promise.reject(error));

  axios.interceptors.response.use(async (response) => {
    const minimumDelay = 500;
    const latency = performance.now() - response.config.p0;
    const shouldNotDelay = minimumDelay < latency;

    if (shouldNotDelay) {
      return response;
    }

    const remainder = minimumDelay - latency;
    const [responseWithDelay] = await Promise.all([
      response,
      new Promise((resolve) => setTimeout(resolve, remainder)),
    ]);

    return responseWithDelay;
  }, (error) => Promise.reject(error));
}
