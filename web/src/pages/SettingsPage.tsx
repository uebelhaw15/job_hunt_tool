import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api, type Category } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const toast = useToast()

  async function load() {
    try {
      setCategories(await api.categories.list())
    } catch {
      toast.error('Failed to load categories.')
    }
  }

  useEffect(() => { void load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.categories.create(newName.trim())
      setNewName('')
      void load()
    } catch {
      toast.error('Category name already exists or failed to save.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete category "${name}"? Questions using it will keep the category name.`)) return
    try {
      await api.categories.delete(id)
      void load()
    } catch {
      toast.error('Failed to delete category.')
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Settings</h2>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Question Categories</h3>
        <p className="text-sm text-slate-500 mb-4">
          Manage the categories available when adding questions. Existing questions keep their category name if you delete one.
        </p>

        <div className="flex flex-col gap-1.5 mb-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2"
            >
              <span className="text-sm text-slate-700">{cat.name}</span>
              <button
                onClick={() => { void handleDelete(cat.id, cat.name) }}
                className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { void handleAdd(e) }} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name…"
            required
          />
          <Button type="submit" disabled={adding} className="shrink-0">
            <Plus size={14} /> Add
          </Button>
        </form>
      </section>
    </div>
  )
}
