import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../personal-state/AuthProvider';

export default function AccountControl() {
  const { configured, signedIn, status, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  if (!configured) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => signedIn ? setOpen((value) => !value) : signIn()}
        className="rounded-token-sm border border-line-soft px-2 py-1 text-token-xs text-ink-muted transition-colors duration-fast hover:border-line hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={signedIn ? open : undefined}
      >
        {signedIn ? '帳號' : status === 'offline' ? '重試登入' : '登入'}
      </button>
      {signedIn && open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 border border-line bg-surface-raised p-3 text-token-xs text-ink shadow-token-md">
          <p>{status === 'ready' ? '已同步' : status === 'syncing' ? '同步中…' : '尚未同步'}</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-3 border-t border-line-soft pt-2 text-ink-muted transition-colors hover:text-ink"
          >
            登出
          </button>
        </div>
      ) : null}
    </div>
  );
}
