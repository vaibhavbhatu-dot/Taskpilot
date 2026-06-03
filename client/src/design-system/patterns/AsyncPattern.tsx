/**
 * AsyncPattern.tsx — Reference implementation for async data pages.
 *
 * PATTERN: loading → error → empty → success
 * READ:    src/design-system/PATTERNS.md §3 for the full written guide.
 *
 * This file is intentionally verbose. Every decision is commented.
 * Copy the pattern, swap the API call and the success renderer.
 */

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Import EVERYTHING from the design-system barrel.
// ─────────────────────────────────────────────────────────────────────────────
import {
  Grid,
  Stack,
  Alert,
  AlertTitle,
  AlertDescription,
  SkeletonCard,
  EmptyState,
  Button,
  ResumeCard,
  Divider,
} from '@/design-system';

import { FileSearch, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Simulated data — replace with real API types.
// ─────────────────────────────────────────────────────────────────────────────
type ResumeItem = {
  id: string;
  title: string;
  lastModified: Date;
  matchScore?: number;
  status: 'draft' | 'tailored' | 'applied' | 'archived';
  jobTitle?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Simulated API function.
// Replace this with: import { resumesApi } from '@/api';
//
// Returns:
//   - 20% chance → rejects (simulates network / server error)
//   - 10% chance → resolves with empty array (no resumes yet)
//   - 70% chance → resolves with 3 resume items
//
// The 1.5s delay simulates a real network round-trip so the skeleton
// is visible long enough to confirm it renders correctly.
// ─────────────────────────────────────────────────────────────────────────────
function fakeResumesApi(): Promise<ResumeItem[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const roll = Math.random();

      if (roll < 0.2) {
        // Simulate a server / network error
        reject(new Error('Failed to load resumes. The server returned a 500 error.'));
        return;
      }

      if (roll < 0.3) {
        // Simulate an empty state (new user with no resumes)
        resolve([]);
        return;
      }

      // Simulate a successful response
      resolve([
        {
          id: '1',
          title: 'Software Engineer Resume',
          lastModified: new Date(Date.now() - 1000 * 60 * 45),
          matchScore: 85,
          status: 'tailored',
          jobTitle: 'Senior Frontend Engineer',
        },
        {
          id: '2',
          title: 'Product Manager Resume',
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 3),
          matchScore: 52,
          status: 'draft',
        },
        {
          id: '3',
          title: 'Data Analyst Resume',
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          status: 'applied',
          jobTitle: 'Data Analyst @ Google',
        },
      ]);
    }, 1500);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// The component.
// ─────────────────────────────────────────────────────────────────────────────
export function AsyncPatternExample() {
  // ── STEP 1 — Three pieces of state for the four render paths ─────────────
  //
  //   loading: true  → show skeletons
  //   error: string  → show error alert
  //   data: []       → show empty state  (data is not null AND length is 0)
  //   data: [...]    → show content      (data is not null AND length > 0)
  //
  //   Never fold loading/error into a single "status" enum — three
  //   separate booleans are easier to read at the render site.
  const [data,    setData]    = useState<ResumeItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── STEP 2 — Extract the fetch logic into useCallback so the retry
  //            button can call the same function. ──────────────────────────
  const fetchData = useCallback(() => {
    // Reset to loading state before every fetch (including retries).
    setLoading(true);
    setError(null);
    // Don't reset data here — it causes a flash to empty state on retry.

    fakeResumesApi()
      .then(items => {
        setData(items);
      })
      .catch((err: Error) => {
        // Store the message string, not the Error object — the render
        // path only needs to display text, and Error objects don't
        // serialize cleanly to JSX.
        setError(err.message ?? 'An unexpected error occurred.');
      })
      .finally(() => {
        // Always clear loading in finally — it fires whether the
        // promise resolved or rejected.
        setLoading(false);
      });
  }, []);

  // ── STEP 3 — Trigger the fetch on mount ──────────────────────────────────
  //
  //   The empty dependency array [] means "run once after first render."
  //
  //   NOTE: We do NOT use a cleanup / cancelled flag here because
  //   fakeResumesApi has no real subscriptions to cancel. In production,
  //   add this pattern to avoid stale setState on unmounted components:
  //
  //     useEffect(() => {
  //       let cancelled = false;
  //       fakeApi().then(d => { if (!cancelled) setData(d); });
  //       return () => { cancelled = true; };
  //     }, [fetchData]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4 — Render: four exclusive branches, top to bottom.
  //
  //   Order matters:
  //     1. loading — always check this first; data may be null
  //     2. error   — check before data; error means data is stale/absent
  //     3. empty   — data is not null but has no items
  //     4. success — data has items; render the real content
  //
  //   Each branch is a complete early return — no nested ternaries,
  //   no && chains, no complex conditional logic inside a single return.
  // ─────────────────────────────────────────────────────────────────────────

  // ── Branch 1: Loading ─────────────────────────────────────────────────────
  //
  //   Show SkeletonCard for each item you expect to render.
  //   This prevents layout shift and sets user expectations.
  //   NEVER show a spinner alone on a full page — it gives no spatial hint.
  if (loading) {
    return (
      <Grid cols={1} smCols={2} lgCols={3} gap="md">
        {/* Render the same number of skeletons as expected real items */}
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </Grid>
    );
  }

  // ── Branch 2: Error ───────────────────────────────────────────────────────
  //
  //   Always surface the error — never swallow it silently.
  //   Include a Retry button that calls fetchData() to re-attempt.
  //   The error message comes directly from the caught Error.message.
  if (error) {
    return (
      <Stack gap="md" className="max-w-xl">
        <Alert variant="error">
          <AlertTitle>Failed to load resumes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        {/* Retry button — calls fetchData() which resets state and refetches */}
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchData}
          className="self-start"
        >
          Try again
        </Button>
      </Stack>
    );
  }

  // ── Branch 3: Empty ───────────────────────────────────────────────────────
  //
  //   data is not null (we're past the loading branch) but the array
  //   is empty. Always explain WHY it's empty and what the user can do.
  //
  //   Use EmptyState — never render "No items found" as plain text.
  if (data !== null && data.length === 0) {
    return (
      <EmptyState
        icon={<FileSearch className="w-12 h-12" />}
        title="No resumes yet"
        description="Create your first resume to start tracking your applications."
        action={{
          label:   'Create resume',
          onClick: () => { /* navigate to create page */ },
        }}
        secondaryAction={{
          label:   'Import existing',
          onClick: () => { /* open upload zone */ },
        }}
      />
    );
  }

  // ── Branch 4: Success ─────────────────────────────────────────────────────
  //
  //   data is not null and has items. Render the real content.
  //   At this point TypeScript knows data is ResumeItem[] (not null).
  return (
    <Stack gap="lg">
      {/* Optional section header */}
      <Stack direction="horizontal" justify="between" align="center">
        <p className="text-sm text-muted-foreground">
          {data!.length} resume{data!.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Stack>

      <Divider />

      {/* Render items in a responsive grid */}
      <Grid cols={1} smCols={2} lgCols={3} gap="md">
        {data!.map(item => (
          <ResumeCard
            key={item.id}
            id={item.id}
            title={item.title}
            lastModified={item.lastModified}
            matchScore={item.matchScore}
            status={item.status}
            jobTitle={item.jobTitle}
            onEdit={()      => { /* open edit modal */ }}
            onDuplicate={()  => { /* duplicate via API */ }}
            onDelete={()    => { /* open confirm modal */ }}
          />
        ))}
      </Grid>
    </Stack>
  );
}
