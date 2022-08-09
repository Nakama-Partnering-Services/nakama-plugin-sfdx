import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

import { promisify } from 'util';
import { glob } from 'glob';
const globPromise = promisify(glob);

import { readFileSync, writeFileSync } from 'fs';

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('nakama-plugin-sfdx', 'mappaths');

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

const remap = async (coverageContent) => {
	const allApexFiles = await globPromise('sfdx-source/**/*.{cls,trigger}');

	if (!allApexFiles.length) {
		throw new SfError(messages.getMessage('errorNoApexFiles'), 'No apex files');
	}

	for (const file of coverageContent.coverage.packages.package.classes.class) {
		const fileName = file['@_filename'];
		// Warning: an issue may happen if an apex class and an apex trigger have the same name.
		const fullPath = allApexFiles.filter(
			(item) => item.endsWith(fileName + '.cls') || item.endsWith(fileName + '.trigger')
		)[0];

		file['@_filename'] = fullPath;
	}
};

export default class Mappaths extends SfdxCommand {
	public static description = messages.getMessage('commandDescription');

	public static examples = messages.getMessage('examples').split(os.EOL);

	public static args = [{ name: 'file' }];

	protected static flagsConfig = {
		path: flags.filepath({
			char: 'p',
			description: messages.getMessage('pathToFileFlagDescription'),
			required: true
		}),
		type: flags.enum({
			char: 't',
			description: messages.getMessage('typeFlagDescription'),
			required: true,
			options: ['cobertura'] // clover, html-spa, html, json, json-summary, lcovonly, none, teamcity, text, text-summary
		})
	};

	public async run(): Promise<AnyJson> {
		const fileContent = readFileSync(this.flags.path, { encoding: 'utf-8' });

		// if (this.flags.type !== 'cobertura') return; // Currenly only cobertura is suported, enforced by enum

		const regex = /filename="no-map[\\|/]/g;
		const replacedContent = fileContent.replaceAll(regex, 'filename="');

		const jsonContent = parseXml(replacedContent);

		await remap(jsonContent);

		const xmlContent = buildXml(jsonContent);

		writeFileSync(this.flags.path, xmlContent);

		return { success: true };
	}
}
