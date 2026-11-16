import { requireAdmin } from '@/lib/auth/current-user'
import { listApiKeys } from '@/lib/storage/api-keys'
import { ApiKeysPanel } from '@/app/admin/_components/api-keys-panel'

/** The keys that read the directory API. */
export default async function AdminApiKeysPage() {
  await requireAdmin()
  const keys = await listApiKeys()
  const active = keys.filter((k) => k.revokedAt === null).length

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>API keys</h1>
          <p className="adm-sub">
            {active} active · {keys.length - active} revoked · the spec is at{' '}
            <a href="/openapi.json" className="underline">
              /openapi.json
            </a>
          </p>
        </div>
      </header>
      <section className="adm-card">
        <ApiKeysPanel
          keys={keys.map((key) => ({
            id: key.id,
            name: key.name,
            prefix: key.prefix,
            createdAt: key.createdAt.toISOString(),
            lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
            revoked: key.revokedAt !== null,
          }))}
        />
      </section>
    </>
  )
}
