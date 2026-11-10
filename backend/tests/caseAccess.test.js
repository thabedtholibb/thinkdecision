jest.mock('../src/config/supabase', () => ({ from: jest.fn() }));

const supabase = require('../src/config/supabase');
const { assertCaseAccess } = require('../src/services/caseService');

const chain = (result) => {
  const q = {};
  q.select = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.single = jest.fn(async () => result);
  return q;
};

describe('case access boundary', () => {
  afterEach(() => jest.clearAllMocks());

  test('allows the case creator', async () => {
    supabase.from.mockReturnValueOnce(chain({
      data: { id: 'case-a', creator_id: 'creator-a', method: 'AHP' },
      error: null,
    }));

    await expect(assertCaseAccess('case-a', 'creator-a')).resolves.toMatchObject({
      role: 'creator',
    });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  test('allows an invited expert only for that case', async () => {
    supabase.from
      .mockReturnValueOnce(chain({
        data: { id: 'case-a', creator_id: 'creator-a', method: 'AHP' },
        error: null,
      }))
      .mockReturnValueOnce(chain({
        data: { case_id: 'case-a', expert_id: 'expert-a' },
        error: null,
      }));

    await expect(assertCaseAccess('case-a', 'expert-a')).resolves.toMatchObject({
      role: 'expert',
    });
  });

  test('rejects an unrelated user without revealing case existence', async () => {
    supabase.from
      .mockReturnValueOnce(chain({
        data: { id: 'case-a', creator_id: 'creator-a', method: 'AHP' },
        error: null,
      }))
      .mockReturnValueOnce(chain({ data: null, error: { code: 'PGRST116' } }));

    await expect(assertCaseAccess('case-a', 'user-b'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
