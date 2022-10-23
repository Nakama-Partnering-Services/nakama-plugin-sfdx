// Note: currently it only supports verification of coverage for apex classes, but not apex triggers nor flows.

import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

import { resolve as resolvePath } from 'path';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('nakama-plugin-sfdx', 'verify');

export default class Verify extends SfdxCommand {
	public static description = messages.getMessage('commandDescription');

	public static examples = messages.getMessage('examples').split(os.EOL);

	public static args = [{ name: 'file' }];

	protected static flagsConfig = {
		path: flags.filepath({
			char: 'p',
			description: messages.getMessage('pathToFileFlagDescription'),
			required: true
		}),
		'required-coverage': flags.integer({
			char: 'r',
			description: messages.getMessage('requiredCoverageFlagDescription'),
			default: 75,
			min: 75,
			max: 100
		}),
		classes: flags.array({
			char: 'c',
			description: messages.getMessage('classesToCheckFlagDescription'),
			required: true,
			delimiter: ','
		})
	};

	public async run(): Promise<AnyJson> {
		const coverage = this.flags['required-coverage'];

		const allClassesWithCoverage = this.allClassesWithCoverage;

		const classesNotCovered = allClassesWithCoverage
			.filter((item) => item.percentage < coverage)
			.map((item) => item.class);

		if (classesNotCovered.length) {
			throw new SfError(
				messages.getMessage('errorClassesNotCovered', [coverage, classesNotCovered.join(', ')]),
				'ClaasesNotCovered'
			);
		}

		this.ux.log(messages.getMessage('noClassesWithInsufficientCoverage'));

		return { success: true, allClassesWithCoverage };
	}

	get allClassesWithCoverage() {
		// Note: sometimes NaN happens because numLocations and numLocationsNotCovered are both 0,
		// for example, in Constants classes with just one line for a single constant variable
		const result = this.flags.classes
			.map((className) => this.mapCalculatedCoverageToClassName(className))
			.filter((item) => !isNaN(item.percentage));

		this.ux.log(messages.getMessage('listOfAnalyzedClasses'));
		this.ux.log(result.map((coverage) => `${coverage.class}: ${coverage.percentage}%`).join('\n'));

		return result;
	}

	get apexTestResults() {
		// Note: leave outside try/catch to allow self error propagation
		const deploymentResult = this.deploymentResult;
		try {
			return deploymentResult.result.details.runTestResult.codeCoverage.reduce(
				(result, detail) => ({
					...result,
					[detail.name]: detail
				}),
				{}
			);
		} catch (e) {
			throw new SfError(messages.getMessage('errorImproperCoverageFileFormat'), 'ImproperCoverageFileFormat');
		}
	}

	get deploymentResult() {
		try {
			return require(resolvePath(this.flags.path));
		} catch (e) {
			throw new SfError(
				messages.getMessage('errorNoCoverageFileFound', [this.flags.path]),
				'NoCoverageFileFound'
			);
		}
	}

	mapCalculatedCoverageToClassName(className) {
		{
			const classDetails = this.apexTestResults[className];

			if (!classDetails) {
				return {
					class: className,
					percentage: 0
				};
			}

			const totalLines = classDetails.numLocations;
			const linesNotCovered = classDetails.numLocationsNotCovered;
			const linesCovered = totalLines - linesNotCovered;
			const percentCoverage = (linesCovered / totalLines) * 100;

			return {
				class: className,
				percentage: percentCoverage
			};
		}
	}
}
