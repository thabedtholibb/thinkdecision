// assertCreatorAccess (results.js): experts must stay blind to aggregate
// results, other experts' judgments, weights and CR — only the case creator
// may read /results, /sensitivity, /discrepancy. Unit-tested against a mocked
// caseService.assertCaseAccess, no DB needed.
jest.mock('../src/services/caseService', () => ({
  assertCaseAccess: jest.fn(),
}));
// results.js requires the supabase client at load time; stub it out so this
// test doesn't need real SUPABASE_URL/SUPABASE_SERVICE_KEY env vars.
jest.mock('../src/config/supabase', () => ({}));

const caseService = require('../src/services/caseService');
const resultsRouter = require('../src/routes/results');

describe('assertCreatorAccess', () => {
  afterEach(() => jest.resetAllMocks());

  test('rejects an invited expert with 403 RESULTS_CREATOR_ONLY', async () => {
    caseService.assertCaseAccess.mockResolvedValue({ role: 'expert', caseRecord: { id: 'c1' } });

    await expect(resultsRouter.assertCreatorAccess('c1', 'expertUser')).rejects.toMatchObject({
      statusCode: 403,
      code: 'RESULTS_CREATOR_ONLY',
    });
  });

  test('resolves for the case creator', async () => {
    caseService.assertCaseAccess.mockResolvedValue({ role: 'creator', caseRecord: { id: 'c1' } });

    const access = await resultsRouter.assertCreatorAccess('c1', 'creatorUser');
    expect(access.role).toBe('creator');
  });

  test('propagates a not-found error untouched (caller has no access at all)', async () => {
    const notFound = Object.assign(new Error('Case not found'), { statusCode: 404, code: 'CASE_NOT_FOUND' });
    caseService.assertCaseAccess.mockRejectedValue(notFound);

    await expect(resultsRouter.assertCreatorAccess('c1', 'stranger')).rejects.toBe(notFound);
  });
});
