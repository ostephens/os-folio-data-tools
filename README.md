#Tools for working with data in/out of Folio
Current folder structure:
* general-tools -> folder for general functions
* kbart-tools -> folder for tools that work with kbart files
* oa-dataloading -> script to load data into the Folio OA app

##OA Data loading tool
node ./oa-dataloading/dataload.js --username <username> --password <password> --okapi <okapi address inc. protocal> --tenant <tenant>

Loads data from data.csv creating:
- License reference data
- Publisher reference data
- journals
- requests
- charges
