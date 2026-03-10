import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from '../components/Layout';

describe('Layout', () => {
  it('renders children inside main', () => {
    render(<Layout><p>Hello World</p></Layout>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders the footer copyright text', () => {
    render(<Layout><span /></Layout>);
    expect(screen.getByText(/NBA Stats/)).toBeInTheDocument();
    expect(screen.getByText(/Built with React and TypeScript/)).toBeInTheDocument();
  });

  it('renders a <main> element', () => {
    render(<Layout><span /></Layout>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders a <footer> element', () => {
    render(<Layout><span /></Layout>);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Layout>
        <p>First</p>
        <p>Second</p>
      </Layout>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
