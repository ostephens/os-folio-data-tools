//const config = require('./config')
const readDataFile = require('../general-tools/readDataFile.js')

const file = "kbart.tsv"
const titleIdNamespace = ""
const titleIdValidation = ""
//const c = config.processArgs(process.argv);

main();
function main() {
  readDataFile.readDataFile(file)
  .then(tipps => {
    tipps.forEach((t) => {
      if(typeof(t.publication_type) === "string") {
        console.log(createContentItem(t))
      } else {
        console.log("Can't read type as string, skipping: " + t.publication_title)
      }
    })
  })
  .then( () => {
    process.exit(1);
  })
}

function createContentItem(kbartLine) {
  let contentItem = new Object
  contentItem.note = kbartLine.coverage_note
  contentItem.depth = kbartLine.coverage_depth
  contentItem.publicationType = kbartLine.publication_type
  if(contentItem.publicationType.toLowerCase() === 'serial') {
    contentItem.coverage = processCoverage(kbartLine)
  }
  contentItem.platformTitleInstance = processPTI(kbartLine)
  return contentItem
}

function processPTI(kbartLine) {
  platformTitleInstance = new Object
  platformTitleInstance.platform = kbartLine.title_url
  platformTitleInstance.platformUrl = kbartLine.title_url
  platformTitleInstance.titleInstance = processTI(kbartLine)
  return platformTitleInstance
}

function processCoverage(kbartLine) {
  coverage = new Object
  coverage.startDate = kbartLine.date_first_issue_online
  coverage.startVolume = kbartLine.num_first_vol_online
  coverage.startIssue = kbartLine.num_first_issue_online
  coverage.endDate = kbartLine.date_last_issue_online
  coverage.endVolume = kbartLine.num_last_vol_online
  coverage.endIssue = kbartLine.num_last_issue_online
  return coverage
}

function processTI(kbartLine) {
  titleInstance = new Object
  titleInstance.name = kbartLine.publication_title
  titleInstance.identifiers = processIDs(kbartLine)
  titleInstance.type = kbartLine.publication_type
  //titleInstance.subType =
  titleInstance.publicationType = kbartLine.publication_type
  titleInstance.monographEdition = kbartLine.monograph_edition
  titleInstance.monographVolume = kbartLine.monograph_volume
  titleInstance.firstAuthor = kbartLine.first_author
  titleInstance.firstEditor = kbartLine.first_editor
  titleInstance.dateMonographPublished = kbartLine.date_monograph_published_online
  return titleInstance
}

function processIDs(kbartLine) {
  identifiers = new Array
  if(kbartLine.publication_type.toLowerCase() === "serial") {
    identifiers.push({value: kbartLine.online_identifier, namespace: 'eissn'})
    identifiers.push({value: kbartLine.print_identifier, namespace: 'pissn'})
  } else if (kbartLine.publication_type.toLowerCase() === "monograph") {
    identifiers.push({value: kbartLine.online_identifier, namespace: 'eisbn'})
    identifiers.push({value: kbartLine.print_identifier, namespace: 'pisbn'})
  }
  if(titleIdNamespace.length > 0) {
    identifiers.push({value: kbartLine.title_id, namespace: titleIdNamespace})
  }
  console.log(identifiers)
  return identifiers
}
