import * as os from 'os';
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core'; // SfError
import { AnyJson } from '@salesforce/ts-types';

import { promisify } from 'util';
import { glob } from 'glob';
const globPromise = promisify(glob);

import { readFileSync, writeFileSync } from 'fs';

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('nakama-plugin-sfdx', 'mappaths');

const parseXml = (xmlFile) => {
	return new XMLParser({
		ignoreDeclaration: true,
		attributeNamePrefix: '@_',
		ignoreAttributes: false
	}).parse(xmlFile);
};

const buildXml = (obj) => {
	return new XMLBuilder({
		format: true,
		attributeNamePrefix: '@_',
		ignoreAttributes: false
	}).build(obj);
};

const remap = async (obj) => {
	const allClasses = await globPromise('sfdx-source/**/*.{cls,trigger}');

	for (const file of obj.coverage.packages.package.classes.class) {
		const fileName = file['@_filename'];
		console.log(fileName);
		const fullPath = allClasses.filter(
			(item) => item.endsWith(fileName + '.cls') || item.endsWith(fileName + '.trigger')
		)[0];
		console.log(fullPath);

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
			options: ['cobertura'] // clover, html-spa, html, json, json-summary, lcovonly, none, teamcity, text, text-summary
		})
	};

	public async run(): Promise<AnyJson> {
		const cobertura = readFileSync(this.flags.path, { encoding: 'utf-8' });
		const regex = /filename="no-map[\\|/]/g
		const coberturaReplaced = cobertura.replaceAll(regex, 'filename="');

		const output = parseXml(coberturaReplaced);

		await remap(output);

		const xmlContent = buildXml(output);

		writeFileSync(this.flags.path, xmlContent);

		return { success: true };
	}
}
