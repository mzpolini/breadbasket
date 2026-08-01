import Link from 'next/link'
import { listFarms } from '@/lib/storage/farms'
import { listPendingUsers } from '@/lib/storage/users'
import { AssignFarmerForm } from '@/app/admin/_components/assign-farmer-form'
import { CreateFarmForm } from '@/app/admin/_components/create-farm-form'

export default async function AdminPage() {
  const farms = await listFarms()
  const pendingUsers = await listPendingUsers()

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Admin</h1>

      {/* Farms List */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Farms</h2>
        {farms.length === 0 ? (
          <p className="text-gray-600">No farms yet.</p>
        ) : (
          <div className="space-y-2">
            {farms.map((farm) => (
              <div key={farm.id} className="border rounded p-4">
                <Link href={`/farm/${farm.id}`} className="text-blue-600 hover:underline">
                  <span className="font-semibold">{farm.name}</span>
                </Link>
                {farm.tagline && <p className="text-sm text-gray-600">{farm.tagline}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Farm */}
      <section className="mb-12 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Create Farm</h2>
        <CreateFarmForm />
      </section>

      {/* Pending Users */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Pending Users</h2>
        {pendingUsers.length === 0 ? (
          <p className="text-gray-600">No pending users.</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="border rounded p-4">
                <p className="font-semibold">{user.email || user.id}</p>
                <p className="text-sm text-gray-600 mb-3">Signed up, not yet assigned to a farm</p>
                <AssignFarmerForm
                  userId={user.id}
                  userEmail={user.email || user.id}
                  availableFarms={farms}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
