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

	public async run(): Promise<{ success: boolean; allClassesWithCoverage: ClassCoverage[] }> {
		const requiredCoverage: number = this.flags['required-coverage'];

		const allClassesWithCoverage: ClassCoverage[] = this.getClassesWithCoverage();

		const classesNotCovered: String[] = allClassesWithCoverage
			.filter((item) => item.percentage < requiredCoverage)
			.map((item) => item.class);

		if (classesNotCovered.length) {
			throw new SfError(
				messages.getMessage('errorClassesNotCovered', [requiredCoverage, classesNotCovered.join(', ')]),
				'ClassesNotCovered'
			);
		}

		this.ux.log(messages.getMessage('noClassesWithInsufficientCoverage'));

		return { success: true, allClassesWithCoverage };
	}

	private getClassesWithCoverage() {
		// Note: sometimes NaN happens because numLocations and numLocationsNotCovered are both 0,
		// for example, in Constants classes with just one line for a single constant variable
		const apexTestResults: ApexTestResults = this.apexTestResults();
		const result = this.flags.classes
			.map((className) => this.calculateCoverage(apexTestResults[className]))
			.filter((item) => !isNaN(item.percentage));

		this.ux.log(messages.getMessage('listOfAnalyzedClasses'));
		this.ux.log(result.map((coverage) => `${coverage.class}: ${coverage.percentage}%`).join('\n'));

		return result;
	}

	private apexTestResults(): ApexTestResults {
		// Note: leave outside try/catch to allow self error propagation
		const deploymentResult: any = this.getDeploymentResult();
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

	private getDeploymentResult(): AnyJson {
		try {
			return require(resolvePath(this.flags.path));
		} catch (e) {
			throw new SfError(
				messages.getMessage('errorNoCoverageFileFound', [this.flags.path]),
				'NoCoverageFileFound'
			);
		}
	}

	private calculateCoverage(testResult: ApexTestResult): ClassCoverage {
		if (!testResult) {
			return {
				class: testResult.name,
				percentage: 0
			};
		}

		const totalLines = testResult.numLocations;
		const linesNotCovered = testResult.numLocationsNotCovered;
		const linesCovered = totalLines - linesNotCovered;
		const percentCoverage = (linesCovered / totalLines) * 100;

		return {
			class: testResult.name,
			percentage: percentCoverage
		};
	}
}

interface ClassCoverage {
	class: string;
	percentage: number;
}

interface ApexTestResults {
	[key: string]: ApexTestResult;
}

interface ApexTestResult {
	name: string;
	numLocations: number;
	numLocationsNotCovered: number;
}
