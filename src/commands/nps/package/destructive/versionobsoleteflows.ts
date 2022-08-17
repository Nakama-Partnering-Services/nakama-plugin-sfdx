import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

import { readFileSync, writeFileSync } from 'fs';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { promisify } from 'util';
import { exec } from 'child_process';

const syncExec = promisify(exec);

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('nakama-plugin-sfdx', 'versionobsoleteflows');

const parseXml = (xmlContent) => {
	return new XMLParser({
		ignoreDeclaration: true,
		attributeNamePrefix: '@_',
		ignoreAttributes: false
	}).parse(xmlContent);
};

const buildXml = (jsonObject) => {
	return new XMLBuilder({
		format: true,
		attributeNamePrefix: '@_',
		ignoreAttributes: false
	}).build(jsonObject);
};

const getFlowMembers = (packageTypes) => {
	const flowType = packageTypes.filter((type) => type.name === 'Flow')[0];

	if (!flowType) {
		return; // there is no Flow type in the destructiveChanges.xml
	}

	let flowMembers = flowType.members;

	if (!flowMembers) {
		return; // there are no Flow members in the destructiveChanges.xml
	}

	if (!Array.isArray(flowMembers)) {
		flowMembers = [flowMembers];
	}

	return flowMembers.join("','");
};

const getObsoleteFlowVersions = async (flowMembers) => {
	const result = (
		await syncExec(
			`sfdx force:data:soql:query --query "SELECT Definition.DeveloperName, VersionNumber FROM Flow WHERE Status = 'Obsolete' AND Definition.DeveloperName IN ('${flowMembers}')" --usetoolingapi --json`
		)
	).stdout;
	return JSON.parse(result).result.records;
};

const replaceFlowMembersWithObsoleteVersions = (obsoleteFlowVersions, packageTypes) => {
	const flowsWithVersions = obsoleteFlowVersions.map(
		(version) => `${version.Definition.DeveloperName}-${version.VersionNumber}`
	);

	const index = packageTypes.findIndex((type) => type.name === 'Flow');

	packageTypes[index].members = flowsWithVersions;
};

export default class Versionobsoleteflows extends SfdxCommand {
	public static description = messages.getMessage('commandDescription');

	public static examples = messages.getMessage('examples').split(os.EOL);

	public static args = [{ name: 'file' }];

	protected static flagsConfig = {
		path: flags.filepath({
			char: 'p',
			description: messages.getMessage('pathToFileFlagDescription'),
			required: true
		})
	};

	public async run(): Promise<AnyJson> {
		const fileContent = readFileSync(this.flags.path, { encoding: 'utf-8' });

		const jsonContent = parseXml(fileContent);
		let packageTypes = jsonContent.Package.types;

		if (!packageTypes) {
			return; // destructiveChanges.xml is empty
		}

		if (!Array.isArray(packageTypes)) {
			packageTypes = [packageTypes];
		}

		const flowMembers = getFlowMembers(packageTypes);

		if (flowMembers) {
			const obsoleteFlowVersions = await getObsoleteFlowVersions(flowMembers);

			replaceFlowMembersWithObsoleteVersions(obsoleteFlowVersions, packageTypes);

			const xmlContent = buildXml(jsonContent);
			writeFileSync(this.flags.path, xmlContent);
		}

		return { success: true };
	}
}
