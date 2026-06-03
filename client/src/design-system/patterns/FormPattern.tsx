/**
 * FormPattern.tsx — Reference implementation for forms in TaskPilot.
 *
 * STACK: react-hook-form + zod + @hookform/resolvers
 * READ:  src/design-system/PATTERNS.md §2 for the full written guide.
 *
 * This file is intentionally verbose. Every decision is commented.
 * Copy the pattern, strip the comments, adapt the schema.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Import EVERYTHING from the design-system barrel.
//          Never reach directly into src/components/ui/*.
// ─────────────────────────────────────────────────────────────────────────────
import {
  Button,
  Input,
  Textarea,
  FormField,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Divider,
  useToast,
} from '@/design-system';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Define the Zod schema OUTSIDE the component so it's not re-created
//          on every render.
//
//          Each field gets:
//            - a type (string, number, boolean, …)
//            - a refinement (.min / .max / .email / .regex / …)
//            - a custom error message as the second argument
// ─────────────────────────────────────────────────────────────────────────────
const editProfileSchema = z.object({
  name: z
    .string()
    .min(2,  'Name must be at least 2 characters.')
    .max(80, 'Name must be 80 characters or less.'),

  email: z
    .string()
    .email('Please enter a valid email address.'),

  bio: z
    .string()
    .max(200, 'Bio must be 200 characters or less.')
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Derive the TypeScript type from the schema.
//          This is the single source of truth — never write a separate type.
// ─────────────────────────────────────────────────────────────────────────────
type EditProfileValues = z.infer<typeof editProfileSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — The component.
// ─────────────────────────────────────────────────────────────────────────────
export function FormPatternExample() {
  // useToast — always call once at the top, reuse the returned object.
  const toast = useToast();

  // ── STEP 5 — useForm ──────────────────────────────────────────────────────
  //
  //   resolver:      connects zod to react-hook-form validation
  //   defaultValues: pre-populate the form (replace with real user data)
  //   mode:          'onTouched' validates a field the moment it loses focus,
  //                  which is the best UX — not too eager, not too late.
  const {
    register,         // connects <input> / <textarea> to the form state
    handleSubmit,     // wraps your async onSubmit; prevents default + validates
    formState: {
      errors,         // per-field validation errors from zod
      isSubmitting,   // true while your async onSubmit is awaiting
      isDirty,        // true if any field has changed from defaultValues
    },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name:  'Arjun Patel',
      email: 'arjun@taskpilot.com',
      bio:   '',
    },
    mode: 'onTouched',
  });

  // ── STEP 6 — The submit handler ───────────────────────────────────────────
  //
  //   handleSubmit(onSubmit) only calls onSubmit when ALL fields pass
  //   validation. You never need to check errors manually here.
  //
  //   The function is async — react-hook-form sets isSubmitting = true
  //   for the duration of the await, then resets it automatically.
  //
  //   Pattern:
  //     try  → call API → toast.success
  //     catch → toast.error  (NEVER silent — always show error toasts)
  async function onSubmit(values: EditProfileValues) {
    // In production: await profileApi.update(values);
    // Log so the demo shows the validated payload in DevTools console.
    console.log('[FormPattern] submit payload:', values);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 80% success rate so you can see both outcomes in the demo.
    const succeeded = Math.random() > 0.2;

    if (succeeded) {
      // ── SUCCESS: short message + optional description ──────────────────
      toast.success('Profile updated', 'Your changes have been saved.');
      // In a real form you'd also call onSuccess() / close a modal here.
    } else {
      // ── ERROR: always show — never swallow API failures silently ───────
      toast.error('Update failed', 'Could not connect to the server. Please try again.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 7 — Render
  //
  //   Key rules:
  //     • Always wrap Input/Textarea in <FormField> — never add label/error
  //       text manually outside of it.
  //     • Set variant="error" on Input when the field has an error so the
  //       red ring appears.
  //     • error={errors.fieldName?.message} wires the zod message into
  //       FormField's red helper text.
  //     • loading={isSubmitting} on Button — NEVER disable the button
  //       manually; Button handles it internally.
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your display name, email, and bio.
        </CardDescription>
      </CardHeader>

      {/* onSubmit is wrapped by handleSubmit — it validates before calling */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="flex flex-col gap-5">

          {/* ── Name field ─────────────────────────────────────────────── */}
          <FormField
            label="Full name"
            required                              // adds the red asterisk
            error={errors.name?.message}          // zod message or undefined
          >
            {/*
              variant="error" adds the red border ring when there's an error.
              Always derive it from errors.fieldName — never hardcode it.
            */}
            <Input
              {...register('name')}               // registers the field
              variant={errors.name ? 'error' : 'default'}
              placeholder="Jane Doe"
            />
          </FormField>

          {/* ── Email field ────────────────────────────────────────────── */}
          <FormField
            label="Email address"
            required
            error={errors.email?.message}
          >
            <Input
              {...register('email')}
              type="email"                        // native email keyboard on mobile
              variant={errors.email ? 'error' : 'default'}
              placeholder="jane@company.com"
            />
          </FormField>

          <Divider />

          {/* ── Bio field (optional) ───────────────────────────────────── */}
          <FormField
            label="Bio"
            hint="Optional. Max 200 characters."  // hint appears below the label
            error={errors.bio?.message}
          >
            {/*
              Textarea takes the same {...register()} spread as Input.
              No variant prop needed on Textarea for this optional field,
              but you can add variant="error" when errors.bio is set.
            */}
            <Textarea
              {...register('bio')}
              rows={3}
              placeholder="Tell your team about yourself…"
            />
          </FormField>

        </CardContent>

        <CardFooter className="justify-end gap-2">
          {/*
            The Cancel button is type="button" to prevent form submission.
            In a real modal you'd call modal.close() here.
          */}
          <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
            Cancel
          </Button>

          {/*
            loading={isSubmitting} does three things automatically:
              1. Shows a spinner instead of the button label
              2. Sets pointer-events-none so it can't be clicked again
              3. Sets disabled so screenreaders announce the state

            isDirty check is optional — remove it if you want the button
            always enabled (simpler, fewer edge cases).
          */}
          <Button
            type="submit"
            size="sm"
            loading={isSubmitting}
            disabled={!isDirty}
          >
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
