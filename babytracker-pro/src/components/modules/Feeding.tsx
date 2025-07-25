'use client'

import React, { useState } from 'react'
import { nanoid } from 'nanoid'
import { useBabyTrackerStore } from '@/lib/store'
import { FeedingEntry } from '@/lib/types'
import { format } from 'date-fns'

/* XXL tactile style shortcut */
const btn =
  'w-40 h-40 rounded-2xl bg-emerald-500 text-white text-2xl font-semibold flex flex-col items-center justify-center hover:bg-emerald-600 active:scale-95 transition'

const Feeding: React.FC = () => {
  const { currentBaby, feedings, addFeeding, removeFeeding } =
    useBabyTrackerStore()
  const [open, setOpen] = useState(false)

  /* quick add : 180 mL biberon */
  const handleQuickAdd = () => {
    if (!currentBaby) return
    const entry: FeedingEntry = {
      id: nanoid(),
      babyId: currentBaby.id,
      kind: 'biberon',
      amount: 180,
      duration: 0,
      startTime: new Date(),
      mood: 'content'
    }
    addFeeding(entry)
  }

  return (
    <section className="p-6 flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center">Module Repas</h1>

      {/* ─── Quick actions XXL ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6 justify-center">
        <button className={btn} onClick={handleQuickAdd}>
          +180 mL<br />
          Biberon
        </button>

        <button className={btn} onClick={() => setOpen(true)}>
          ➕<br />
          Autre
        </button>
      </div>

      {/* ─── Feedings list ─────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto w-full">
        {feedings.length === 0 ? (
          <p className="text-center  mt-12">
            Aucun repas enregistré pour l’instant.
          </p>
        ) : (
          <ul className="space-y-4">
            {feedings
              .filter(f => f.babyId === currentBaby?.id)
              .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
              .map(f => (
                <li
                  key={f.id}
                  className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {f.kind} {f.amount ? `· ${f.amount}${f.kind === 'solide' ? ' g' : ' mL'}` : ''}
                    </p>
                    <p className="text-xs ">
                      {format(f.startTime, 'HH:mm')} – {f.mood}
                    </p>
                  </div>

                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => removeFeeding(f.id)}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* ─── Placeholder modal (future form) ───────────────────────── */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-80">
            <h2 className="text-xl font-bold mb-4">Nouveau repas</h2>
            <p className="text-gray-500 mb-4">(Formulaire complet à implémenter)</p>
            <button
              className="w-full py-2 rounded bg-gray-800 text-white"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Feeding
