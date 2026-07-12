import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment, createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManualStockEditor } from './ManualStockEditor';
import { MemberSubmissionPortal } from './MemberSubmissionPortal';
import { ResourceRequestForm } from './ResourceRequestForm';

describe('logistics form defaults', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );
  });

  it('starts stock and request forms with blank fields', () => {
    const requestFormRender = render(createElement(ResourceRequestForm));

    expect(screen.getByLabelText('Request title')).toHaveValue('');
    expect(screen.getByLabelText('Resource')).toHaveValue('');
    expect(screen.getByLabelText('Quantity')).toHaveValue('');
    expect(screen.getByLabelText('Priority')).toHaveValue('');
    expect(screen.getByLabelText('Reason')).toHaveValue('');

    requestFormRender.unmount();

    const manualEditorRender = render(createElement(ManualStockEditor));

    expect(screen.getByLabelText('Material')).toHaveValue('');
    expect(screen.getByLabelText('Quantity')).toHaveValue('');
    expect(screen.getByLabelText('State')).toHaveValue('');
    expect(screen.getByLabelText('Reason / note')).toHaveValue('');

    manualEditorRender.unmount();

    render(createElement(Fragment, null, createElement(MemberSubmissionPortal)));

    const offerForm = screen.getByRole('heading', { name: 'Give stock to the org' }).closest('form');
    const requestForm = screen.getByRole('heading', { name: 'Request stock from the org' }).closest('form');

    expect(offerForm).not.toBeNull();
    expect(requestForm).not.toBeNull();

    expect(within(offerForm as HTMLFormElement).getByLabelText('What are you giving?')).toHaveValue('');
    expect(within(offerForm as HTMLFormElement).getByLabelText('Notes')).toHaveValue('');
    expect(within(offerForm as HTMLFormElement).getByPlaceholderText('Start typing for matches')).toHaveValue('');
    expect(within(offerForm as HTMLFormElement).getByRole('spinbutton')).toHaveValue(null);

    expect(within(requestForm as HTMLFormElement).getByLabelText('What do you need?')).toHaveValue('');
    expect(within(requestForm as HTMLFormElement).getByLabelText('Why do you need it?')).toHaveValue('');
    expect(within(requestForm as HTMLFormElement).getByPlaceholderText('Start typing for matches')).toHaveValue('');
    expect(within(requestForm as HTMLFormElement).getByRole('spinbutton')).toHaveValue(null);
  });
});

describe('request flow and count tracking', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );
  });

  it('submits a request and updates reservation and fulfillment counts correctly', async () => {
    const user = userEvent.setup();
    render(createElement(MemberSubmissionPortal));

    const requestForm = screen.getByRole('heading', { name: 'Request stock from the org' }).closest('form');
    expect(requestForm).not.toBeNull();

    await user.type(within(requestForm as HTMLFormElement).getByLabelText('What do you need?'), 'Need ammo for patrol');
    await user.type(within(requestForm as HTMLFormElement).getByPlaceholderText('Start typing for matches'), 'Rail Gun Cartridges');
    await user.type(within(requestForm as HTMLFormElement).getByRole('spinbutton'), '5');
    await user.type(within(requestForm as HTMLFormElement).getByLabelText('Why do you need it?'), 'Patrol team loadout');

    await user.click(within(requestForm as HTMLFormElement).getByRole('button', { name: 'Submit stock request' }));

    await screen.findByText('Your stock request has been submitted for admin review.');
    expect(within(requestForm as HTMLFormElement).getByLabelText('What do you need?')).toHaveValue('');
    expect(within(requestForm as HTMLFormElement).getByPlaceholderText('Start typing for matches')).toHaveValue('');
    expect(within(requestForm as HTMLFormElement).getByRole('spinbutton')).toHaveValue(null);
    await user.click(screen.getByRole('button', { name: 'Approval queue' }));
    expect(screen.getByText('Pending 3 • Approved 0 • Rejected 0')).toBeInTheDocument();

    let requestCard: HTMLElement | null = screen.getByText('Need ammo for patrol').parentElement;
    while (requestCard && !within(requestCard).queryByRole('button', { name: 'Approve' })) {
      requestCard = requestCard.parentElement;
    }

    expect(requestCard).not.toBeNull();
    await user.click(within(requestCard as HTMLElement).getByRole('button', { name: 'Approve' }));

    expect(screen.getByText('Pending 2 • Approved 1 • Rejected 0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByText('Qty 5.00 • 1 requests')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manage stock' }));
    expect(screen.getByText('Available 115')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fulfillment & Archive' }));
    expect(screen.getByText('Pending fulfillment (1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark as complete' }));

    expect(screen.getByText('No pending fulfillment tickets.')).toBeInTheDocument();
    expect(screen.getByText('Archive (1)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByText('Qty 0.00 • 1 requests')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manage stock' }));
    await waitFor(() => {
      const stockHeader = screen.getAllByText('Rail Gun Cartridges')[0].closest('div');
      const stockCard = stockHeader?.parentElement;
      expect(stockCard?.textContent).toContain('Reserved 0');
    });
  });

  it('accepts stock offers into inventory after approval', async () => {
    const user = userEvent.setup();
    render(createElement(MemberSubmissionPortal));

    const offerForm = screen.getByRole('heading', { name: 'Give stock to the org' }).closest('form');
    expect(offerForm).not.toBeNull();

    await user.selectOptions(within(offerForm as HTMLFormElement).getByLabelText('Category'), 'Items');
    await user.selectOptions(within(offerForm as HTMLFormElement).getByLabelText('Subcategory'), 'Ammunition');
    await user.type(within(offerForm as HTMLFormElement).getByLabelText('What are you giving?'), 'Ammo restock drop');
    await user.type(within(offerForm as HTMLFormElement).getByPlaceholderText('Start typing for matches'), 'C54 Magazine');
    await user.type(within(offerForm as HTMLFormElement).getByRole('spinbutton'), '9');
    await user.type(within(offerForm as HTMLFormElement).getByLabelText('Notes'), 'From convoy escort run');

    await user.click(within(offerForm as HTMLFormElement).getByRole('button', { name: 'Submit stock offer' }));
    await user.click(screen.getByRole('button', { name: 'Approval queue' }));
    await screen.findByText('Ammo restock drop');
    expect(screen.getByText('Pending 3 • Approved 0 • Rejected 0')).toBeInTheDocument();

    let offerCard: HTMLElement | null = screen.getByText('Ammo restock drop').parentElement;
    while (offerCard && !within(offerCard).queryByRole('button', { name: 'Approve' })) {
      offerCard = offerCard.parentElement;
    }

    expect(offerCard).not.toBeNull();
    await user.click(within(offerCard as HTMLElement).getByRole('button', { name: 'Approve' }));
    expect(screen.getByText('Pending 2 • Approved 1 • Rejected 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manage stock' }));

    await waitFor(() => {
      expect(screen.getByText(/Accepted offer from Current member/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Fulfillment & Archive' }));
    expect(screen.getByText('Pending receiving (1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark intake complete' }));
    expect(screen.getByText('No pending receiving tickets.')).toBeInTheDocument();
    expect(screen.getByText('Archive (1)')).toBeInTheDocument();
  });

  it('requires ore quality for material intake lines', async () => {
    const user = userEvent.setup();
    render(createElement(MemberSubmissionPortal));

    const offerForm = screen.getByRole('heading', { name: 'Give stock to the org' }).closest('form');
    expect(offerForm).not.toBeNull();

    await user.selectOptions(within(offerForm as HTMLFormElement).getByLabelText('Category'), 'Materials');
    await user.type(within(offerForm as HTMLFormElement).getByLabelText('What are you giving?'), 'Ore run intake');
    await user.type(within(offerForm as HTMLFormElement).getByPlaceholderText('Start typing for matches'), 'Quantanium Ore');
    await user.clear(within(offerForm as HTMLFormElement).getByLabelText('Unit (usually SCU)'));
    await user.type(within(offerForm as HTMLFormElement).getByLabelText('Unit (usually SCU)'), 'SCU');
    await user.type(within(offerForm as HTMLFormElement).getByLabelText('SCU quantity'), '12');

    await user.click(within(offerForm as HTMLFormElement).getByRole('button', { name: 'Submit stock offer' }));
    expect(screen.getByText('Each delivered line needs category, subcategory, item, quantity, unit, and ore quality for material lines.')).toBeInTheDocument();

    await user.selectOptions(within(offerForm as HTMLFormElement).getByLabelText('Ore quality (intake)'), 'Rich concentration (40-59% ore)');
    await user.click(within(offerForm as HTMLFormElement).getByRole('button', { name: 'Submit stock offer' }));

    await user.click(screen.getByRole('button', { name: 'Approval queue' }));
    await screen.findByText('Ore run intake');
    expect(screen.getByText('Pending 3 • Approved 0 • Rejected 0')).toBeInTheDocument();
  });
});
