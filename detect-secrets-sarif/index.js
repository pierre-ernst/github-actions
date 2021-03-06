const fs = require('fs').promises;

const core = require('@actions/core');
const github = require('@actions/github');

/**
 * Mapping from:
 *   plugin class names found in https://github.com/Yelp/detect-secrets/blob/master/detect_secrets/plugins/
 * to:
 *   class.secret_type
 */
const plugins = {
    ArtifactoryDetector: 'Artifactory Credentials',
    AWSKeyDetector: 'AWS Access Key',
    Base64HighEntropyString: 'Base64 High Entropy String',
    BasicAuthDetector: 'Basic Auth Credentials',
    CloudantDetector: 'Cloudant Credentials',
    HexHighEntropyString: 'Hex High Entropy String',
    IbmCloudIamDetector: 'IBM Cloud IAM Key',
    IbmCosHmacDetector: 'IBM COS HMAC Credentials',
    JwtTokenDetector: 'JSON Web Token',
    KeywordDetector: 'Secret Keyword',
    MailchimpDetector: 'Mailchimp Access Key',
    PrivateKeyDetector: 'Private Key',
    SlackDetector: 'Slack Token',
    SoftlayerDetector: 'SoftLayer Credentials',
    StripeDetector: 'Stripe Access Key',
    TwilioKeyDetector: 'Twilio API Key',
};

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function convert(jsonInput) {

    const jsonOutput = {
        version: '2.1.0',
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',

        runs: [
            {
                tool: {
                    driver: {
                        name: 'detect-secrets',
                        version: jsonInput.version,
                        informationUri: 'https://github.com/Yelp/detect-secrets',
                        rules: []
                    }
                },

                invocations: [
                    {
                        executionSuccessful: true,
                        endTimeUtc: jsonInput.generated_at
                    }
                ],

                results: []
            }
        ]
    }

    // setting runs[0].tool.driver.rules
    jsonInput.plugins_used.forEach(plugin => {

        const rule = {
            id: plugin.name,
            helpUri: 'https://cwe.mitre.org/data/definitions/798.html',
            fullDescription: {
                text: 'Hard-coded secrets, such as passwords or keys, create a significant hole that allows an attacker with source code access to bypass authentication or authorization'
            },
            help: {
                text: 'Please use Harp (https://github.com/elastic/harp) to manage your secrets.',
                markdown: 'Please use [Harp](https://github.com/elastic/harp) to manage your secrets.'
            },
            properties: {
                tags: [
                    'CWE-798'
                ]
            }
        };

        if (plugins.hasOwnProperty(plugin.name)) {

            rule.name = `${plugin.name} detects hard-coded ${plugins[plugin.name]}`
            rule.shortDescription = {
                text: 'Hard-coded ' + plugins[plugin.name]
            };

            Object.keys(plugin).forEach(function (key) {
                if (key != 'name') {
                    rule.properties[key] = plugin[key];
                }
            });

            jsonOutput.runs[0].tool.driver.rules.push(rule);

        } else {
            console.log(`Warning: unknown detect-secrets plugin: ${plugin.name}`);
        }

    });

    // setting runs[0].results
    Object.keys(jsonInput.results).forEach(filePath => {

        jsonInput.results[filePath].forEach(finding => {
            if (!finding.is_verified) {

                const ruleId = getKeyByValue(plugins, finding.type);

                if (plugins.hasOwnProperty(ruleId)) {
                    const ruleFinding = {
                        ruleId: ruleId,
                        level: 'error',
                        message: {
                            text: `Hard-coded ${plugins[ruleId]}` ,
                        },
                        locations: [
                            {
                                physicalLocation: {
                                    artifactLocation: {
                                        uri: filePath
                                    },
                                    region: {
                                        startLine: finding.line_number
                                    }
                                }
                            }
                        ],
                    }
                    jsonOutput.runs[0].results.push(ruleFinding);
                }
            }

        });

    });

    return jsonOutput;
}

function readBaselineFileFromRepo(path) {
    const octokit = github.getOctokit(process.env.MGH_TOKEN);
    const repo = process.env.GITHUB_REPOSITORY.split("/");

    octokit.repos.getContent({
        owner: repo[0],
        repo: repo[1],
        path: path
    }).then(response => {
        const fileContent = Buffer.from(response.data.content, 'base64').toString();
        saveSarif(fileContent);
    }).catch(err => {
        console.log(err);
        core.setFailed(err.message);
    });
}

function readBaselineFileFromLocal(path) {
    fs.readFile(path)
        .then(fileContent => {
            saveSarif(fileContent);
        }).catch(err => {
        console.log(err);
        core.setFailed(err.message);
    });
}

function saveSarif(detectSecretsFileContent) {

    const sarifJson = convert(JSON.parse(detectSecretsFileContent));
    const sarifText = JSON.stringify(
        sarifJson,
        null,
        2
    );

    const sarifFilePath = `${process.env.RUNNER_TEMP}/${Date.now()}_sarif.json`;

    fs.writeFile(sarifFilePath, sarifText)
        .then(_ => {
            console.log(`Sarif saved to ${sarifFilePath} (${sarifJson.runs[0].results.length} findings)`);
            core.setOutput('sarif-file-path', sarifFilePath);
            core.setOutput('issue-count', sarifJson.runs[0].results.length);
        }).catch(err => {
        console.log(err);
        core.setFailed(err.message);
    });

}


const baselineFileLocation = core.getInput('baseline-file-location');
const baselineFilePath = core.getInput('baseline-file-path');

if (baselineFileLocation == 'local') {
    readBaselineFileFromLocal(baselineFilePath);
} else {
    readBaselineFileFromRepo(baselineFilePath);
}

