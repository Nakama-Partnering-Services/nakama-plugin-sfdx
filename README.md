<br />
<div align="center">

  <h3 align="center">Nakama Plugin SFDX</h3>

  <p align="center">
    SFDX plugin to provide functionalities in order to improve and enhance your Development and CICD processes.
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

-   [TL;DR](#tldr)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
-   [How to use it?](#how-to-use-it)
-   [`sfdx nps:coverage:formatters:mappaths -p <filepath> -t cobertura [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-npscoverageformattersmappaths--p-filepath--t-cobertura---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx nps:coverage:verify -p <filepath> [-r <number>] -c <string> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-npscoverageverify--p-filepath--r-number--c-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [`sfdx nps:package:destructive:versionobsoleteflows -p <filepath> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-npspackagedestructiveversionobsoleteflows--p-filepath---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
-   [Walkthrough](#walkthrough)
    -   [Get a folder with all the files](#get-a-folder-with-all-the-files)
    -   [Deploy the delta metadata and get --json output](#deploy-the-delta-metadata-and-get---json-output)
    -   [Recommended: Print deployment result](#recommended-print-deployment-result)
    -   [Detect only relevant apex classes](#detect-only-relevant-apex-classes)
    -   [Verify that all apex classes have an specific required coverage](#verify-that-all-apex-classes-have-an-specific-required-coverage)
-   [Versioning](#versioning)
-   [Authors](#authors)
-   [Contributing](#contributing)
-   [License](#license)
</details>

## TL;DR

```sh
sfdx plugins:install nakama-plugin-sfdx
```

```sh
sfdx force:source:deploy --wait 60 --checkonly --manifest manifest/package.xml --testlevel RunLocalTests --junit --coverageformatters cobertura --resultsdir test-results --json > test-results/results.json
```

```sh
sfdx nps:coverage:verify --path test-results/results.json --required-coverage 90 --classes AccountTriggerHandler,ContactTriggerHandler
```

```sh
sfdx nps:package:destructive:versionobsoleteflows --path deltas/destructiveChanges/destructiveChanges.xml
```

## Getting Started

### Prerequisites

**Node v14.6.0 or above is required**.
To check if Salesforce CLI runs under a supported node version for NPS, run `sfdx --version`. You should see a node version above v.14.6.0. You should see a node version above v.14.6.0 to use NPS.

If you encounter this issue whereas the node version is OK on the running environment, try to [install the Salesforce CLI via npm](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm#sfdx_setup_install_cli_npm) (`npm install sfdx-cli --global`).

### Installation

Nakama plugin SFDX is a Salesforce CLI plugin. Run the following command to install it:

```sh
sfdx plugins:install nakama-plugin-sfdx
```

Because this plugin is not signed, you will get a warning saying that "This plugin is not digitally signed and its authenticity cannot be verified". This is expected, and you will have to answer `y` (yes) to proceed with the installation.

If you run your CI/CD jobs inside a Docker image, you can add the plugin to your image.

## How to use it?

<!-- commands -->
* [`sfdx nps:coverage:formatters:mappaths -p <filepath> -t cobertura [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-npscoverageformattersmappaths--p-filepath--t-cobertura---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx nps:coverage:verify -p <filepath> -c <array> [-r <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-npscoverageverify--p-filepath--c-array--r-integer---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx nps:package:destructive:versionobsoleteflows -p <filepath> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-npspackagedestructiveversionobsoleteflows--p-filepath---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx nps:coverage:formatters:mappaths -p <filepath> -t cobertura [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Map the paths in a given file to replace them with the actual project relative location for classes and triggers

```
USAGE
  $ sfdx nps:coverage:formatters:mappaths -p <filepath> -t cobertura [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -p, --path=<value>                                                                (required) project relative path to
                                                                                    the file containing the test
                                                                                    execution results
  -t, --type=(cobertura)                                                            (required) format type of the file
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  Map the paths in a given file to replace them with the actual project relative location for classes and triggers

EXAMPLES
  $ sfdx nps:coverage:formatters:mappaths --path test-results/coverage/cobertura.xml --type cobertura
```

_See code: [src/commands/nps/coverage/formatters/mappaths.ts](https://github.com/Nakama-Partnering-Services/nakama-plugin-sfdx/blob/v1.1.1/src/commands/nps/coverage/formatters/mappaths.ts)_

## `sfdx nps:coverage:verify -p <filepath> -c <array> [-r <integer>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Verifies that specified apex classes have a coverage above a certain treshold

```
USAGE
  $ sfdx nps:coverage:verify -p <filepath> -c <array> [-r <integer>] [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -c, --classes=<value>                                                             (required) comma separated list of
                                                                                    apex classes to verify
  -p, --path=<value>                                                                (required) project relative path to
                                                                                    the json file containing the test
                                                                                    execution results
  -r, --required-coverage=<value>                                                   [default: 75] number of the
                                                                                    percentage of coverage treshold to
                                                                                    reach
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  Verifies that specified apex classes have a coverage above a certain treshold

EXAMPLES
  $ sfdx nps:coverage:verify --path test-results/results.json --required-coverage 90 --classes AccountTriggerHandler,ContactTriggerHandler
```

_See code: [src/commands/nps/coverage/verify.ts](https://github.com/Nakama-Partnering-Services/nakama-plugin-sfdx/blob/v1.1.1/src/commands/nps/coverage/verify.ts)_

## `sfdx nps:package:destructive:versionobsoleteflows -p <filepath> [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Replace the Flow members in a XML file by all the Obsolete flow versions in the default target org

```
USAGE
  $ sfdx nps:package:destructive:versionobsoleteflows -p <filepath> [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -p, --path=<value>                                                                (required) project relative path to
                                                                                    the destructiveChange.xml
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  Replace the Flow members in a XML file by all the Obsolete flow versions in the default target org

EXAMPLES
  $ sfdx nps:package:destructive:versionobsoleteflows --path deltas/destructiveChanges/destructiveChanges.xml
```

_See code: [src/commands/nps/package/destructive/versionobsoleteflows.ts](https://github.com/Nakama-Partnering-Services/nakama-plugin-sfdx/blob/v1.1.1/src/commands/nps/package/destructive/versionobsoleteflows.ts)_
<!-- commandsstop -->

## Walkthrough

Let’s take a look at the following scenario:

> **_Verify that each one of the non-test apex classes added or modified in a PR have a specific required coverage._**

In our example, we have the following files:

-   _Flow deleted:_ `AccountFlow`
-   _Custom Field added:_ `Account.NumberOfContacts__c`
-   _Apex Class added:_ `ContactTriggerHandler`
-   _Apex Class added:_ `ContactTriggerHandlerTest`
-   _Apex Class modified:_ `AccountTriggerHandler`
-   _Apex Class modified:_ `AccountTriggerHandlerTest`

In this situation, we would expect the CLI plugin to:

1. **Handle the flow entries in `destructiveChanges.xml` for deletion**: `AccountFlow-1`
1. **Detect the relevant apex classes in the PR to verify**: `ContactTriggerHandler`, `AccountTriggerHandler`
2. **Report an error for those classes without enough test coverage**: `AccountTriggerHandler`
3. **Optional: if using Gitlab CI, highglight coverage in MR diff changes for**: `ContactTriggerHandler`, `AccountTriggerHandler`

So let’s do it!

### Get a folder with all the files

From the project repo folder, the CI pipeline will run the following command:

```sh
sfdx sgd:source:delta --source sfdx-source --from origin/$GITHUB_BASE_REF --to HEAD --output deltas --ignore .forceignore --generate-delta
```

_See [sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta)_

which means:

> Analyze the differences between the PR targer branch and the source branch and create a folder ´deltas´ with all the modified and added files there.

### Replace Flow member entries in `destructiveChanges.xml` by their obsolete versions

Since flows can not be deleted with SFDX, what we actually want to delete is flow version:

```sh
sfdx nps:package:destructive:versionobsoleteflows --path deltas/destructiveChanges/destructiveChanges.xml
```

> :warning: This is still subjected to the restriction where a version needs to be `Inactive` for deletion

### Deploy the delta metadata and get --json output

The simplest option to deploy the incremental changes is to use `force:source:deploy` command with `-x` parameter:

```sh
sfdx force:source:deploy --wait 60 --checkonly --manifest deltas/package/package.xml --postdestructivechanges deltas/destructiveChanges/destructiveChanges.xml --verbose --testlevel RunLocalTests --coverageformatters cobertura --resultsdir test-results --json > test-results/results.json
```

### Optional, if using Gitlab CI: remap coverage formatter file with actual project locations paths for apex files

Due to the apex files actually belonging to an org, the coverage formatters uses apex files paths with a `no-map/` default path. We can remap them properly to the real paths for the actual files location in our project with:


```sh
sfdx nps:coverage:formatters:mappaths -p test-results/cobertura.xml -t cobertura
```

> :warning: Currently there is a limitation where an issue will likely happen if there are `.cls` and `.trigger` files with the same name

(Bonus) Make sure that you specify the following in your deployment job:

```yml
artifacts:
    when: always
    reports:
        coverage_report:
            coverage_format: cobertura
            path: test-results/coverage/cobertura.xml
```

### Recommended: Print deployment result

Since deployment command output is captured into a file and does not appear in the job logs, it is recommented to print it with:

```sh
cat test-results/results.json
```

### Detect only relevant apex classes

Now, we need to generate a comma separated list of the apex classes which coverage we want to check.

```sh
NON_TEST_CLASSES=$((egrep -wrliL @IsTest deltas --include \*.cls || echo "") | xargs -rL 1 basename | sed 's/.cls//g' | paste -sd "," -)
```

### Verify that all apex classes have an specific required coverage

Imagine that you want all of our apex classes to have at least a 90% of test coverage. After running the previous commands, the remaining thing to do is:

```sh
sfdx nps:coverage:verify -p test-results/results.json -r 90 -c $NON_TEST_CLASSES
```

And voilà! 🥳

We should get and output like:

```sh
List of analyzed apex classes with coverage:
ContactTriggerHandler: 92%
AccountTriggerHandler: 68%
ERROR running nps:coverage:verify:  Included apex classes should met at least the required coverage of 90%. Classes without enough coverage: AccountTriggerHandler
```

Besides, if using Gitlab CI and followe the optional steps, in our MR diff changes we should be able to spot the [Test Coverage Visualization](https://docs.gitlab.com/ee/ci/testing/test_coverage_visualization.html).

## Versioning

Versioning follows [SemVer](http://semver.org/) specification.

## Authors

-   **Gabriel Serrano** - Developer - [jdkgabri](https://github.com/jdkgabri)

## Contributing

Contributions are what make the trailblazer community such an amazing place. I regard this component as a way to inspire and learn from others. Any contributions you make are **appreciated**.

## License

This project license is MIT - see the [LICENSE.md](LICENSE.md) file for details
