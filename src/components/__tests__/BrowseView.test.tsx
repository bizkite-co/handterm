import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityType, StorageKeys, type IAuthProps } from '@handterm/types';
import { BrowseView } from '../BrowseView';
import type { BrowseListDeps } from '../../utils/browseFs';

let mockParsedLocation = {
  activityKey: ActivityType.BROWSE,
  contentKey: '',
  groupKey: null,
  clearParams: false,
};

vi.mock('../../utils/navigationUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/navigationUtils')>();
  return {
    ...actual,
    navigate: vi.fn(),
    parseLocation: () => mockParsedLocation,
  };
});

import { navigate } from '../../utils/navigationUtils';

const auth = { isLoggedIn: true } as IAuthProps;

function stubDeps(overrides: Partial<BrowseListDeps> = {}): BrowseListDeps {
  return {
    isLoggedIn: true,
    githubUsername: 'octo',
    listS3: async () => ({ status: 200, files: ['_index.md', 'docs/guide.md'] }),
    listGithubRepos: async () => ({
      status: 200,
      repos: [{ name: 'handterm', full_name: 'bizkite-co/handterm' }],
    }),
    getS3Content: async () => ({
      status: 200,
      content: '# Hello S3\nWelcome to handterm.',
    }),
    createS3Resource: async () => ({
      status: 200,
    }),
    ...overrides,
  };
}

describe('BrowseView', () => {
  beforeEach(() => {
    vi.mocked(navigate).mockClear();
    localStorage.clear();
    mockParsedLocation = {
      activityKey: ActivityType.BROWSE,
      contentKey: '',
      groupKey: null,
      clearParams: false,
    };
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
    fireEvent.keyDown(window, { key: 'j' });
    const after = view.querySelectorAll('.browse-col.current .browse-row');
    expect(after[1]?.className).toContain('selected');
  });

  it('navigates with window-level keydown events without needing container focus', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('GitHub');
      expect(view.textContent).toContain('S3');
    });

    // Fire directly on window, simulating keys pressed while activeElement is document.body
    fireEvent.keyDown(window, { key: 'j' });
    const rows = view.querySelectorAll('.browse-col.current .browse-row');
    expect(rows[1]?.className).toContain('selected');

    fireEvent.keyDown(window, { key: 'k' });
    const rowsBack = view.querySelectorAll('.browse-col.current .browse-row');
    expect(rowsBack[0]?.className).toContain('selected');
  });

  it('updates querystring path via navigate on directory change', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Move to S3 and open it
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        activityKey: ActivityType.BROWSE,
        contentKey: 's3',
        groupKey: null,
      });
    });
  });

  it('syncs path state when popstate or locationchange event fires', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Simulate location changing to s3 via browser back/forward or direct url change
    mockParsedLocation = {
      activityKey: ActivityType.BROWSE,
      contentKey: 's3',
      groupKey: null,
      clearParams: false,
    };
    window.dispatchEvent(new CustomEvent('locationchange'));

    await waitFor(() => {
      expect(view.querySelector('.browse-breadcrumb')?.textContent).toContain('/s3');
    });
  });

  it('Escape returns to the terminal', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    await screen.findByTestId('browse-view');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null,
    });
  });

  it('q returns to the terminal', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    await screen.findByTestId('browse-view');
    fireEvent.keyDown(window, { key: 'q' });
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null,
    });
  });

  it('/ jumps to the root directory', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Move to S3 and open it
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'Enter' });
    await waitFor(() => {
      expect(view.querySelector('.browse-breadcrumb')?.textContent).toContain('/s3');
    });

    // Press / to jump back to root
    fireEvent.keyDown(window, { key: '/' });
    await waitFor(() => {
      expect(view.querySelector('.browse-breadcrumb')?.textContent).toBe('/');
    });
  });

  it('renders preview pane when a file is selected and scrolls with J and K', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Go to S3
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(view.querySelector('.browse-breadcrumb')?.textContent).toContain('/s3');
    });

    // docs is selected by default (folder). Press j to select _index.md (file)
    fireEvent.keyDown(window, { key: 'j' });

    // In s3, _index.md is selected (it is a file)
    await waitFor(() => {
      const preview = screen.queryByTestId('browse-preview');
      expect(preview).not.toBeNull();
      expect(preview?.textContent).toContain('Hello S3');
    });

    const preview = screen.getByTestId('browse-preview');
    preview.scrollBy = vi.fn();

    fireEvent.keyDown(window, { key: 'J' });
    expect(preview.scrollBy).toHaveBeenCalledWith({ top: 80, behavior: 'smooth' });

    fireEvent.keyDown(window, { key: 'K' });
    expect(preview.scrollBy).toHaveBeenCalledWith({ top: -80, behavior: 'smooth' });
  });

  it('opens file in editor on Enter', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Go to S3
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(view.querySelector('.browse-breadcrumb')?.textContent).toContain('/s3');
    });

    // docs is selected by default (folder). Press j to select _index.md (file)
    fireEvent.keyDown(window, { key: 'j' });

    await waitFor(() => {
      expect(screen.queryByTestId('browse-preview')).not.toBeNull();
    });

    // Press Enter to edit the file
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        activityKey: ActivityType.EDIT,
        contentKey: '_index.md',
        groupKey: null,
      });
      const stored = localStorage.getItem(StorageKeys.editContent);
      expect(stored).toContain('Hello S3');
    });
  });

  it('creates an S3 resource with a prompt', async () => {
    const createMock = vi.fn().mockResolvedValue({ status: 200 });
    render(<BrowseView auth={auth} deps={stubDeps({ createS3Resource: createMock })} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Navigate to s3
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(view.querySelector('.browse-breadcrumb')?.textContent).toContain('/s3');
    });

    // Press a to open create prompt
    fireEvent.keyDown(window, { key: 'a' });
    const input = view.querySelector('.browse-prompt-input') as HTMLInputElement;
    expect(input).not.toBeNull();

    fireEvent.change(input, { target: { value: 'newfile.txt' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith('newfile.txt', '');
    });
  });

  it('filters and highlights with s search prompt', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');

    // Press s to open search prompt
    fireEvent.keyDown(window, { key: 's' });
    const input = view.querySelector('.browse-prompt-input') as HTMLInputElement;
    expect(input).not.toBeNull();

    // Type Git to filter
    fireEvent.change(input, { target: { value: 'Git' } });

    await waitFor(() => {
      const mark = view.querySelector('mark');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('Git');
    });

    // Press Escape to cancel search
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(view.querySelector('.browse-prompt-input')).toBeNull();
  });

  it('maintains both current and child columns in the DOM for mobile stacking', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('GitHub');
    });
    const currentCol = view.querySelector('.browse-col.current');
    const childCol = view.querySelector('.browse-col.child');
    expect(currentCol).not.toBeNull();
    expect(childCol).not.toBeNull();
  });

  it('renders a blank line separator and cyan path headers for both columns', async () => {
    render(<BrowseView auth={auth} deps={stubDeps()} />);
    const view = await screen.findByTestId('browse-view');
    await waitFor(() => {
      expect(view.textContent).toContain('S3');
    });

    // Check blank line separator between grey info and columns
    const separator = view.querySelector('.browse-blank-line');
    expect(separator).not.toBeNull();

    // Check top column path header
    const topPath = screen.getByTestId('top-col-path');
    expect(topPath.textContent?.trim()).toBe('/');

    // Check bottom column path header (initially GitHub is selected)
    const bottomPath = screen.getByTestId('bottom-col-path');
    expect(bottomPath.textContent?.trim()).toBe('/github');

    // Move to S3 and verify bottom column path updates
    fireEvent.keyDown(window, { key: 'j' });
    await waitFor(() => {
      expect(bottomPath.textContent?.trim()).toBe('/s3');
    });
  });
});
