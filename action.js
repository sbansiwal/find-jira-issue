const _ = require('lodash')
const Jira = require('./common/net/Jira')
const core = require('@actions/core')

const issueIdRegEx = /([a-zA-Z0-9]+-[0-9]+)/g

const eventTemplates = {
  branch: '{{event.ref}}',
  commits: "{{event.commits.map(c=>c.message).join(' ')}}",
}

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute () {
    const template = eventTemplates[this.argv.from] || this.argv._.join(' ')
    const extractString = this.preprocessString(template)
    const match = extractString.match(issueIdRegEx)

    if (!match) {
      console.log(`String "${extractString}" does not contain issueKeys`)
      core.setFailed(`Commit message does not contain issue key`)
    }

    for (const issueKey of match) {
      const issue = await this.Jira.getIssue(issueKey)
      //const issueStatus = await this.Jira.getIssueStatus(issueKey)
      //const transitions = await this.Jira.getIssueTransitions(issueKey)
      
      if (issue) {
        return {issue: issue.key, status: issue.fields.status.name}
      } else {
          core.setFailed(`Invalid issue key`)
      }

    }
  }

  preprocessString (str) {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g
    const tmpl = _.template(str)

    return tmpl({ event: this.githubEvent })
  }
}
