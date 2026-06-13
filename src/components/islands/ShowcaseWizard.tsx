/**
 * ShowcaseWizard — demo wrapper for WizardIsland.
 * Used by src/pages/showcase/wizard.astro.
 */

import * as React from 'react';
import WizardIsland from './WizardIsland';
import ErrorBoundary from './ErrorBoundary';

function AccountStep() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="wizard-email" className="text-sm font-medium">Email</label>
        <input
          id="wizard-email"
          type="email"
          placeholder="you@example.com"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                     shadow-sm transition-colors placeholder:text-muted-foreground
                     focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="wizard-name" className="text-sm font-medium">Full name</label>
        <input
          id="wizard-name"
          type="text"
          placeholder="Ada Lovelace"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                     shadow-sm transition-colors placeholder:text-muted-foreground
                     focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

function PlanStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Type "Block me" below to trigger a validation error, or leave blank to proceed.
      </p>
      <input
        id="wizard-plan-input"
        type="text"
        placeholder='Type "Block me" to block advance'
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                   shadow-sm transition-colors placeholder:text-muted-foreground
                   focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <div className="grid grid-cols-3 gap-3">
        {['Free', 'Pro', 'Team'].map((plan) => (
          <label
            key={plan}
            className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent"
          >
            <input type="radio" name="wizard-plan" value={plan} className="size-3.5" />
            <span className="text-sm font-medium">{plan}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ConfirmStep() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">Everything looks good. Click Submit to finish.</p>
      <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
        <p><span className="text-muted-foreground">Step 1:</span> Account details collected</p>
        <p><span className="text-muted-foreground">Step 2:</span> Plan selected</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Submission simulates an 800 ms async call. Watch the loading state on the button.
      </p>
    </div>
  );
}

export function ShowcaseWizardLinear() {
  return (
    <ErrorBoundary name="ShowcaseWizardLinear">
      <WizardIsland
        steps={[
          {
            id: 'account',
            title: 'Account',
            description: 'Set up your account details.',
            validate: async () => {
              await new Promise((r) => setTimeout(r, 200));
              return true;
            },
          },
          {
            id: 'plan',
            title: 'Plan',
            description: 'Choose your plan. Type "Block me" to see validation failure.',
            validate: () => {
              const el = document.getElementById('wizard-plan-input') as HTMLInputElement | null;
              if (el?.value?.toLowerCase() === 'block me') {
                return 'Remove "Block me" from the input to proceed.';
              }
              return true;
            },
          },
          {
            id: 'confirm',
            title: 'Confirm',
            description: 'Review and submit.',
          },
        ]}
        onSubmit={async () => {
          await new Promise((r) => setTimeout(r, 800));
        }}
      >
        {(stepId, _setStepData) => {
          if (stepId === 'account') return <AccountStep />;
          if (stepId === 'plan') return <PlanStep />;
          if (stepId === 'confirm') return <ConfirmStep />;
          return null;
        }}
      </WizardIsland>
    </ErrorBoundary>
  );
}

export function ShowcaseWizardConditional() {
  return (
    <ErrorBoundary name="ShowcaseWizardConditional">
      <WizardIsland
        steps={[
          { id: 'basic', title: 'Basic setup' },
          {
            id: 'advanced',
            title: 'Advanced',
            description: 'Only shown for power users (condition always true in this demo).',
            condition: () => true,
          },
          { id: 'done', title: 'Done' },
        ]}
        onSubmit={async () => { await new Promise((r) => setTimeout(r, 500)); }}
        onCancel={() => {}}
        labels={{ submit: 'Finish', cancel: 'Cancel setup' }}
      >
        {(stepId, _setStepData) => {
          if (stepId === 'basic') return <p className="text-sm text-muted-foreground">Basic settings here.</p>;
          if (stepId === 'advanced') return <p className="text-sm text-muted-foreground">Advanced settings — only visible when condition is true.</p>;
          if (stepId === 'done') return <p className="text-sm text-muted-foreground">All steps complete. Click Finish.</p>;
          return null;
        }}
      </WizardIsland>
    </ErrorBoundary>
  );
}
