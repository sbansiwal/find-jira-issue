const fs = require('fs')
const YAML = require('yaml')
const core = require('@actions/core')

const cliConfigPath = `${process.env.HOME}/.jira.d/config.yml`
const configPath = `${process.env.HOME}/jira/config.yml`
const Action = require('./action')

// eslint-disable-next-line import/no-dynamic-require
const githubEvent = require(process.env.GITHUB_EVENT_PATH)
const config = YAML.parse(fs.readFileSync(configPath, 'utf8'))

async function exec () {
  try {
    const result = await new Action({
      githubEvent,
      argv: parseArgs(),
      config,
    }).execute()

    if (result) {
      var issueStatus = walk(result.issue);
      console.log(`Detected issueKey: ${result.issue.key}`)
      console.log(`Detected issueStatus: ${issueStatus}`)
      console.log(`Saving ${result.issue} to ${cliConfigPath}`)
      console.log(`Saving ${result.issue} to ${configPath}`)
      console.log(`Under index.js`)

      // Expose created issue's key as an output
      core.setOutput('issue', result.issue)

      const yamledResult = YAML.stringify(result)
      const extendedConfig = Object.assign({}, config, result)

      fs.writeFileSync(configPath, YAML.stringify(extendedConfig))

      return fs.appendFileSync(cliConfigPath, yamledResult)
    }

    console.log('No issueKeys found.')
    core.setNeutral()
  } catch (error) {
    core.setFailed(error.toString())
  }
}

function parseArgs () {
  return {
    event: core.getInput('event') || config.event,
    string: core.getInput('string') || config.string,
    from: core.getInput('from'),
  }
}

function walk(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var val = obj[key];
      if (key == 'status') {
        return val
      }
      walk(val)
    }
  }
}

exec()
