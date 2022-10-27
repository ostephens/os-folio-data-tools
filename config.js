// copied from https://github.com/folio-org/folio-tools/blob/master/add-users/add-users.js
/**
 * processArgs
 * parse the CLI; throw if a required arg is missing
 *
 * @arg [] args CLI arguments
 * @return {} object shaped like { username, password, okapi, tenant }
 */
const processArgs = (args) => {
  // I don't really want the hostname and tenant in here any more now that
  // argument parsing has handler functions, but it's not worth refactoring.
  const config = {
    username: null,
    password: null,
    okapi: null,
    tenant: null
  };

  // argument handlers
  const handlers = {
    username: (i, config) => { config.username = i; },
    password: (i, config) => { config.password = i; },
    okapi: (i, config) => { config.okapi = i; },
    tenant:   (i, config) => { config.tenant = i; },
  };

  // start at 2 because we get called like "node script.js --foo bar --bat baz"
  // search for pairs of the form
  //   --key value
  // when a key matches a config-key, call its handlers function
  for (let i = 2; i < args.length; i++) {
    let key;
    if (args[i].indexOf('--') === 0) {
      key = args[i].substr(2);
      if (key in handlers && i + 1 < args.length) {
        handlers[key](args[++i], config);
      }
    }
  }

  // make sure all config values are non-empty
  if (Object.values(config).filter(v => v).length == Object.keys(config).length) {
    return config;
  }

  console.log("Usage: node " + __filename + " --username <u> --group <g> --password <p> --tenant <t> --hostname <h> --psets <p>");
  console.log("Usage: node " + __filename + " --username <u> --group <g> --password <p> --tenant <t> --okapi <o> --psets <p>");
  console.log("An Okapi URL will parse to values for --hostname and --port.")

  throw `A required argument was not present; missing one of: ${Object.keys(config).join(', ')}.`;
};

module.exports ={
                  processArgs
                }
