import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('plugin-coverage', 'verify');

export default class Org extends SfdxCommand {
	public static description = messages.getMessage('commandDescription');

	public static examples = messages.getMessage('examples').split(os.EOL);

	public static args = [{ name: 'file' }];

	protected static flagsConfig = {
		path: flags.string({
			char: 'p',
			description: messages.getMessage('pathToFileFlagDescription'),
		}),
		requiredcoverage: flags.number({
			char: 'r',
			description: messages.getMessage('requiredCoverageFlagDescription'),
		}),
		classes: flags.string({
			char: 'c',
			description: messages.getMessage('classesToCheckFlagDescription'),
		}),
	};

	public async run(): Promise<AnyJson> {
		const requiredCoverage = (this.flags.requiredcoverage || 75) as number;

		const deploymentResult = require(this.flags.path);

		const apexTestResults = deploymentResult.result.details.runTestResult.codeCoverage.reduce(
			(result, detail) => ({
				...result,
				[detail.name]: detail
			}),
			{}
		);

		const classesToCheck = this.flags.classes.split(',');

		if (!classesToCheck) {
			const msg = 'There are no apex test classes to check coverage.';
			this.ux.log(msg);
			return;
			// process.exit(0);
		}

		const classesWithCoverage = classesToCheck.map((testClassName) => {
			const testClassDetails = apexTestResults[testClassName];

			const totalLines = testClassDetails.numLocations;
			const linesNotCovered = testClassDetails.numLocationsNotCovered;
			const linesCovered = totalLines - linesNotCovered;
			const percentCoverage = (linesCovered / totalLines) * 100;
			return {
				class: testClassName,
				percentage: percentCoverage
			};
		});

		this.ux.log(classesWithCoverage.map((coverage) => `${coverage.class}: ${coverage.percentage}%`).join('\n'));

		const classesWithoutEnoughCoverage = classesWithCoverage
			.filter((item) => item.percentage < requiredCoverage)
			.map((item) => item.class);

		if (classesWithoutEnoughCoverage.length > 0) {
			throw new SfError(messages.getMessage('errorInsufficientCoverageForClasses', [requiredCoverage, classesWithoutEnoughCoverage.join(
				', '
			)]));
		}

		this.ux.log('No classes with insufficient coverage found');

		// Return an object to be displayed with --json
		return; // { orgId: this.org.getOrgId(), outputString };
	}
}