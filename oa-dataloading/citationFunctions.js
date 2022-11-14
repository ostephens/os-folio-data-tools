function addRequests(folio,requests) {
  //Need to have different requests for books and articles
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
            publicationType: "journal_article",
            workIndexedInDOAJ: {value: doajStatus(r)},
            workOAStatus: {value: hybridOrGold(r)}
            //pmid?
          }
          console.log(request)
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
    let c = {  title: request["journal_full_title"],
            indexedInDOAJ: doajStatus(request),
            oaStatus: hybridOrGold(request),
            type: "serial",
            instances: instances
          }
    return c
  } else {
    return false
  }
}

function createCitationRequest(folio,citation) {
    console.log("Creating " + citation["title"])
    return folio({
      method: 'post',
      url: '/oa/works/citation',
      data: citation
    })
}

function getUniqueCitations(requests) {
  const works = new Map(requests.map((r) => {
    let c = createCitation(r)
    if(c) {
      return [r.issn.replace("-",""), c]
    }
  }).values()
)
  return works
}

function validateISSN(issn) {
  const issnRE = /^\d{4}\-\d{3}[0-9X]$/;
  return issnRE.test(issn)
}

function hybridOrGold(request) {
  let oas = "hybrid"
  if(request["is_hybrid"]==="FALSE") {
    oas = "gold"
  }
  return oas
}

function doajStatus(request) {
  let doaj = "no"
  if(request["doaj"]==="TRUE") {
    doaj = "yes"
  }
  return doaj
}

function publicationBook(request) {
  i = request["issn"].toUpperCase()
  p = request["issn_print"].toUpperCase()
  e = request["issn_electronic"].toUpperCase()
}

module.exports ={
                  addRequests,
                  createCitation,
                  createCitationRequest,
                  getUniqueCitations,
                  validateISSN
                }
