"use client";

import { useEffect, useState } from "react";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import OtpInput from "@/components/atoms/OtpInput";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/contexts/AccessContext";
import {
  cancelConnectionCode,
  claimConnectionCode,
  generateConnectionCode,
  renameConnection,
  revokeConnection,
  subscribeMyPendingCodes,
  type ConnectionCodeDoc,
} from "@/lib/firebase/connections";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const CODE_LENGTH = 6;

interface ActiveCode {
  code: string;
  expiresAt: string;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { grantsReceived, loading } = useAccess();

  const [pendingCodes, setPendingCodes] = useState<ConnectionCodeDoc[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    side: "owner" | "guest";
    ownerUid: string;
    guestUid: string;
    currentName: string;
  } | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<{
    ownerUid: string;
    guestUid: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setPendingCodes([]));
      return;
    }
    return subscribeMyPendingCodes(user.uid, setPendingCodes);
  }, [user]);

  async function handleRevoke() {
    if (!confirmRevoke) return;
    await revokeConnection(confirmRevoke.ownerUid, confirmRevoke.guestUid);
    setConfirmRevoke(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Settings"
        title="Connections"
        actions={
          <Button size="md" variant="secondary" onClick={() => setClaimOpen(true)}>
            Enter code
          </Button>
        }
      />

      <p className="lede text-sm">
        Team up with someone to manage the same budget together — accounts,
        transactions, cards, goals, all shared. Either side can add or edit,
        and both apps show the merged view.
      </p>

      <section className="flex flex-col" aria-label="Connected accounts">
        <div className="section-head">
          <span className="section-head-title">Connected accounts</span>
          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            className="section-head-link"
          >
            + Generate code
          </button>
        </div>
        <div className="rooms">
          {pendingCodes.length > 0 && (
            <div className="px-4 py-3 flex flex-col gap-2">
              <span className="kicker">Pending codes</span>
              {pendingCodes.map((c) => (
                <PendingCodeRow key={c.code} code={c} />
              ))}
            </div>
          )}
          {loading ? (
            <div className="px-4 py-3 text-sm text-fg-muted">Loading…</div>
          ) : grantsReceived.length === 0 && pendingCodes.length === 0 ? (
            <div className="px-4 py-3 text-sm text-fg-muted">
              You&apos;re not connected to anyone yet. Generate a code and
              share it, or click <em>Enter code</em> if someone shared one
              with you.
            </div>
          ) : (
            grantsReceived.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">
                    {g.ownerNickname}
                  </span>
                  <span className="text-xs text-fg-muted">
                    Shared budget · both can add and edit
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setRenameTarget({
                        side: "guest",
                        ownerUid: g.ownerUid,
                        guestUid: g.guestUid,
                        currentName: g.ownerNickname,
                      })
                    }
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setConfirmRevoke({
                        ownerUid: g.ownerUid,
                        guestUid: g.guestUid,
                        label: g.ownerNickname,
                      })
                    }
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate connection code"
      >
        <GenerateCodePanel onClose={() => setGenerateOpen(false)} />
      </Modal>

      <Modal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        title="Enter a connection code"
      >
        <ClaimCodePanel onClose={() => setClaimOpen(false)} />
      </Modal>

      <Modal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename connection"
      >
        {renameTarget && (
          <RenamePanel
            target={renameTarget}
            onClose={() => setRenameTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={confirmRevoke !== null}
        title="End this connection?"
        message={
          confirmRevoke && (
            <>
              <span className="text-fg font-medium">
                {confirmRevoke.label}
              </span>{" "}
              will no longer share data with you (or vice versa). You can
              reconnect any time with a new code.
            </>
          )
        }
        confirmLabel="End connection"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={handleRevoke}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
}

function PendingCodeRow({ code }: { code: ConnectionCodeDoc }) {
  // React 19's purity rules forbid calling `Date.now()` during render. Track
  // remaining minutes in state and refresh once per minute.
  const [remaining, setRemaining] = useState<number>(0);
  useEffect(() => {
    function update() {
      setRemaining(
        Math.max(
          0,
          Math.floor((new Date(code.expiresAt).getTime() - Date.now()) / 60000),
        ),
      );
    }
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [code.expiresAt]);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="font-mono tracking-widest text-lg">{code.code}</span>
        <span className="text-xs text-fg-muted">
          Expires in {remaining} min
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        disabled={confirming}
        onClick={async () => {
          setConfirming(true);
          try {
            await cancelConnectionCode(code.code);
          } finally {
            setConfirming(false);
          }
        }}
      >
        Cancel
      </Button>
    </div>
  );
}

function GenerateCodePanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [active, setActive] = useState<ActiveCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const profile = await getDoc(doc(db, "users", user.uid));
      const nickname =
        (profile.data() as { nickname?: string })?.nickname ||
        user.displayName ||
        user.email ||
        "Someone";
      const code = await generateConnectionCode(nickname);
      setActive({ code: code.code, expiresAt: code.expiresAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate code");
    } finally {
      setSubmitting(false);
    }
  }

  if (active) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          Share this code with the person you&apos;re inviting. It expires in
          10 minutes and can only be used once.
        </p>
        <div className="surface p-5 flex flex-col items-center gap-2">
          <span className="kicker">Connection code</span>
          <span className="font-mono tracking-[0.4em] text-3xl">
            {active.code}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={async () => {
              await navigator.clipboard.writeText(active.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied ✓" : "Copy code"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        Anyone who accepts your code will share the same budget as you — same
        accounts, same transactions, same everything. Both of you can add and
        edit.
      </p>
      {error && <span className="field-error">{error}</span>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="lg"
          fullWidth
          disabled={submitting}
          onClick={handleGenerate}
        >
          {submitting ? "Generating…" : "Generate code"}
        </Button>
      </div>
    </div>
  );
}

function ClaimCodePanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function attempt(value: string) {
    if (!user) return;
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length !== CODE_LENGTH) return;
    setSubmitting(true);
    setError(null);
    try {
      const profile = await getDoc(doc(db, "users", user.uid));
      const guestNickname =
        (profile.data() as { nickname?: string })?.nickname ||
        user.displayName ||
        user.email ||
        "Someone";
      const conn = await claimConnectionCode(trimmed, guestNickname);
      void conn;
      setSuccess(
        "Accounts connected. From now on both of you see and edit the same budget.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept code");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await attempt(code);
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">{success}</p>
        <Button type="button" size="lg" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-fg-muted">
        Enter the 6-character code someone shared with you.
      </p>
      <OtpInput
        length={CODE_LENGTH}
        label="Connection code"
        value={code}
        onChange={setCode}
        onComplete={(v) => void attempt(v)}
        autoFocus
        disabled={submitting}
      />
      {error && <span className="field-error">{error}</span>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={submitting || code.length !== CODE_LENGTH}
        >
          {submitting ? "Connecting…" : "Accept"}
        </Button>
      </div>
    </form>
  );
}

function RenamePanel({
  target,
  onClose,
}: {
  target: {
    side: "owner" | "guest";
    ownerUid: string;
    guestUid: string;
    currentName: string;
  };
  onClose: () => void;
}) {
  const [name, setName] = useState(target.currentName);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await renameConnection(
        target.ownerUid,
        target.guestUid,
        target.side,
        trimmed,
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        {target.side === "owner"
          ? "How this guest appears in your list."
          : "How the account owner appears in your data."}
      </p>
      <Input
        label="Nickname"
        name="nickname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
