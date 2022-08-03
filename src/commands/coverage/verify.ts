import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

import { resolve as resolvePath } from 'path';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('plugin-coverage', 'verify');

export default class Verify extends SfdxCommand {
	public static description = messages.getMessage('commandDescription');

	public static examples = messages.getMessage('examples').split(os.EOL);

	public static args = [{ name: 'file' }];

	protected static flagsConfig = {
		path: flags.string({
			char: 'p',
			description: messages.getMessage('pathToFileFlagDescription')
		}),
		requiredcoverage: flags.number({
			char: 'r',
			description: messages.getMessage('requiredCoverageFlagDescription')
		}),
		classes: flags.string({
			char: 'c',
			description: messages.getMessage('classesToCheckFlagDescription')
		})
	};

	public async run(): Promise<AnyJson> {
		const requiredCoverage = (this.flags.requiredcoverage || 75) as number;

		let deploymentResult;
		try {
			deploymentResult = require(resolvePath(this.flags.path));
		} catch (e) {
			throw new SfError(messages.getMessage('errorNoCoverageFileFound', [this.flags.path]));
		}

		let apexTestResults;
		try {
			apexTestResults = deploymentResult.result.details.runTestResult.codeCoverage.reduce(
				(result, detail) => ({
					...result,
					[detail.name]: detail
				}),
				{}
			);
		} catch (e) {
			throw new SfError(messages.getMessage('errorImproperCoverageFileFormat'));
		}

		const classesToCheck = this.flags.classes?.split(',');

		if (!classesToCheck) {
			throw new SfError(messages.getMessage('errorNoClassesToCheck'));
		}

		const classesWithCoverage = classesToCheck.map((testClassName) => {
			const testClassDetails = apexTestResults[testClassName];

			if (!testClassDetails) {
				throw new SfError(messages.getMessage('noClassFound', [testClassName]));
			}

			const totalLines = testClassDetails.numLocations;
			const linesNotCovered = testClassDetails.numLocationsNotCovered;
			const linesCovered = totalLines - linesNotCovered;
			const percentCoverage = (linesCovered / totalLines) * 100;
			return {
				class: testClassName,
				percentage: percentCoverage
			};
		});

		this.ux.log(messages.getMessage('listOfAnalyzedClasses'));
		this.ux.log(classesWithCoverage.map((coverage) => `${coverage.class}: ${coverage.percentage}%`).join('\n'));

		const classesWithoutEnoughCoverage = classesWithCoverage
			.filter((item) => item.percentage < requiredCoverage)
			.map((item) => item.class);

		if (classesWithoutEnoughCoverage.length > 0) {
			throw new SfError(
				messages.getMessage('errorInsufficientCoverageForClasses', [
					requiredCoverage,
					classesWithoutEnoughCoverage.join(', ')
				])
			);
		}

		this.ux.log(messages.getMessage('noClassesWithInsufficientCoverage'));

		return { success: true, classesWithCoverage };
	}
}
