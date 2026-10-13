import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityType, type IAuthProps } from '@handterm/types';
import { BrowseView } from '../BrowseView';
import type { BrowseListDeps } from '../../utils/browseFs';

vi.mock('../../utils/navigationUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/navigationUtils')>();
  return {
    ...actual,
    navigate: vi.fn(),
    parseLocation: () => ({
      activityKey: ActivityType.BROWSE,
      contentKey: '',
      groupKey: null,
      clearParams: false,
    }),
  };
});

import { navigate } from '../../utils/navigationUtils';

const auth = { isLoggedIn: true } as IAuthProps;

function stubDeps(overrides: Partial<BrowseListDeps> = {}): BrowseListDeps {
  return {
    isLoggedIn: true,
    githubUsername: 'octo',
    listS3: async () => ({ status: 200, files: ['_index.md'] }),
    listGithubRepos: async () => ({
      status: 200,
      repos: [{ name: 'handterm', full_name: 'bizkite-co/handterm' }],
    }),
    ...overrides,
  };
}

describe('BrowseView', () => {
  beforeEach(() => {
    vi.mocked(navigate).mockClear();
  });

  it('renders GitHub and S3 at the root and moves with j/k', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('GitHub');
      expect(view.textContent).toContain('S3');
    });
    const rows = view.querySelectorAll('.browse-col.current .browse-row');
    expect(rows[0]?.className).toContain('selected');
    fireEvent.keyDown(view, { key: 'j' });
    const after = view.querySelectorAll('.browse-col.current .browse-row');
    expect(after[1]?.className).toContain('selected');
  });

  it('Escape returns to the terminal', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    fireEvent.keyDown(view, { key: 'Escape' });
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null,
    });
  });
});
