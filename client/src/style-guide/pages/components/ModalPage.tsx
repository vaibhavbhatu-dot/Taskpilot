import { Settings, Trash2 } from 'lucide-react';
import { Button, Badge } from '@/design-system';
import { Modal } from '@/components/ui/modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Drawer } from '@/components/ui/drawer';
import { useModal } from '@/design-system/hooks/useModal';
import { DemoBlock } from '../../components/ui/DemoBlock';

export function ModalPage() {
  const infoModal    = useModal();
  const confirmModal = useModal();
  const drawer       = useModal();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Modal &amp; Drawer</h1>
        <p className="text-lg text-muted-foreground">
          Three overlay patterns: <strong>Modal</strong> for confirmations and forms,{' '}
          <strong>ConfirmModal</strong> for destructive actions, and <strong>Drawer</strong>
          for detail panels. All use <code className="font-mono bg-muted px-1 py-0.5 rounded text-sm">useModal()</code> for state.
        </p>
      </div>

      <section>
        <h2 id="modal" className="text-xl font-semibold text-foreground mb-4">Modal</h2>
        <p className="text-muted-foreground mb-4">
          General-purpose dialog with configurable title, description, size, and footer slot.
        </p>
        <DemoBlock
          title="Click to open"
          code={`const modal = useModal();

<Button onClick={modal.open} leftIcon={<Settings className="w-4 h-4" />}>
  Open Modal
</Button>

<Modal
  {...modal.props}
  title="Edit project settings"
  description="Update your project name and visibility preferences."
  size="md"
  footer={
    <>
      <Button variant="outline" size="sm" onClick={modal.close}>Cancel</Button>
      <Button size="sm" onClick={modal.close}>Save changes</Button>
    </>
  }
>
  {/* form content */}
</Modal>`}
        >
          <Button onClick={infoModal.open} leftIcon={<Settings className="w-4 h-4" />}>
            Open Modal
          </Button>
        </DemoBlock>

        <Modal
          {...infoModal.props}
          title="Edit project settings"
          description="Update your project name, description, and visibility preferences."
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={infoModal.close}>Cancel</Button>
              <Button size="sm" onClick={infoModal.close}>Save changes</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Project name</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="TaskPilot"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="Project management and sprint tracking."
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" dot>Active</Badge>
              <span className="text-xs text-muted-foreground">Sprint 4 in progress</span>
            </div>
          </div>
        </Modal>
      </section>

      <section>
        <h2 id="confirm-modal" className="text-xl font-semibold text-foreground mb-4">ConfirmModal</h2>
        <p className="text-muted-foreground mb-4">
          A specialised destructive-action dialog with a single confirm button.
          Always pair with a confirmation message that names the item being deleted.
        </p>
        <DemoBlock
          title="Destructive variant"
          code={`const confirm = useModal();

<Button variant="destructive" onClick={confirm.open}
  leftIcon={<Trash2 className="w-4 h-4" />}>
  Delete (Confirm)
</Button>

<ConfirmModal
  {...confirm.props}
  title="Delete this ticket?"
  description="This action cannot be undone. The ticket and all its comments will be permanently removed."
  confirmLabel="Delete ticket"
  variant="destructive"
  onConfirm={confirm.close}
/>`}
        >
          <Button variant="destructive" onClick={confirmModal.open} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete (Confirm)
          </Button>
        </DemoBlock>

        <ConfirmModal
          {...confirmModal.props}
          title="Delete this ticket?"
          description="This action cannot be undone. The ticket and all its comments will be permanently removed."
          confirmLabel="Delete ticket"
          variant="destructive"
          onConfirm={confirmModal.close}
        />
      </section>

      <section>
        <h2 id="drawer" className="text-xl font-semibold text-foreground mb-4">Drawer</h2>
        <p className="text-muted-foreground mb-4">
          Slides in from the right (or left) — ideal for detail panels that don't
          require the user to leave the current context.
        </p>
        <DemoBlock
          title="Right drawer"
          code={`const drawer = useModal();

<Button variant="outline" onClick={drawer.open}>Open Drawer →</Button>

<Drawer
  {...drawer.props}
  title="Ticket details"
  description="Review and edit the selected ticket."
  side="right"
  size="md"
>
  {/* detail content */}
</Drawer>`}
        >
          <Button variant="outline" onClick={drawer.open}>Open Drawer →</Button>
        </DemoBlock>

        <Drawer
          {...drawer.props}
          title="Ticket details"
          description="Review and edit the selected ticket."
          side="right"
          size="md"
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">TP-142 — Fix auth redirect</span>
              <Badge variant="warning" dot>In Progress</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              After a token refresh the user is sometimes redirected to /login
              instead of their original destination. Investigate the redirect logic.
            </p>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button size="sm" onClick={drawer.close}>Close</Button>
              <Button size="sm" variant="outline">Edit ticket</Button>
            </div>
          </div>
        </Drawer>
      </section>

      <section>
        <h2 id="use-modal" className="text-xl font-semibold text-foreground mb-4">useModal hook</h2>
        <div className="p-4 rounded-xl border border-border bg-muted/30">
          <pre className="font-mono text-sm text-foreground">{`const modal = useModal();
// modal.isOpen   boolean
// modal.open()   () => void
// modal.close()  () => void
// modal.props    { isOpen, onClose }  — spread onto Modal/Drawer`}</pre>
        </div>
      </section>
    </div>
  );
}
