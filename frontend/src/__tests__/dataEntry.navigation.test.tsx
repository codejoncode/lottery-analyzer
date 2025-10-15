import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import DataEntryPage from '../../../frontend/app/routes/data-entry';

// Note: We import the route default export directly - in the app build this is used by the router
describe('DataEntry navigation', () => {
  it('renders Home link that navigates to /', () => {
    render(
      <MemoryRouter initialEntries={["/data-entry"]}>
        <DataEntryPage />
      </MemoryRouter>
    );

    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
    // Verify it is a react-router Link with href to '/'
    expect((homeLink as HTMLAnchorElement).getAttribute('href')).toBe('/');
  });
});
