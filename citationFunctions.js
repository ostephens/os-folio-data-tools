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
  } else {
    return false
  }
}

function createCitationRequest(citation) {
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

module.exports ={
                  createCitation,
                  createCitationRequest,
                  getUniqueCitations,
                  validateISSN
                }
