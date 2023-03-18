import { test } from '@salesforce/command/lib/test';
import { expect } from 'chai';

const testDeploymentResultPath = 'test/fixtures/deployment-result.json';

describe('nps:coverage:verify', async () => {
	await testSetup()
		.command([
			'nps:coverage:verify',
			'--path',
			testDeploymentResultPath,
			'--required-coverage',
			'90',
			'--classes',
			'PutCartsItemsPreInvoke,VlocityDiagnosticWizardTestBatchClass'
		])
		.it('when successful', (ctx) => {
			expect(ctx.stderr).to.be.empty;

			expect(ctx.stdout).to.contain('PutCartsItemsPreInvoke: 100%');
			expect(ctx.stdout).to.contain('VlocityDiagnosticWizardTestBatchClass: 100%');
			expect(ctx.stdout).to.contain('No classes with insufficient coverage found');
		});

	await testSetup()
		.command([
			'nps:coverage:verify',
			'--path',
			testDeploymentResultPath,
			'--classes',
			'CpqCartContext,HttpCallout,QuoteMemberTriggerUtility'
		])
		.it('when some classes do not meet the coverage', (ctx) => {
			expect(ctx.stderr).to.contain(
				'Included apex classes should met at least the required coverage of 75%. Classes without enough coverage: CpqCartContext, HttpCallout'
			);

			expect(ctx.stdout).to.contain('CpqCartContext: 0%');
			expect(ctx.stdout).to.contain('HttpCallout: 68%');
			expect(ctx.stdout).to.contain('QuoteMemberTriggerUtility: 98.50746268656717%');
		});
});

function testSetup() {
	return test.stdout().stderr();
}
