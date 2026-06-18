import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Pet } from '../types'
import { useAuth } from './AuthContext'
import { getPets } from '../services/petService'

interface PetContextValue {
  pets: Pet[]
  activePet: Pet | null
  setActivePet: (pet: Pet) => void
  refreshPets: () => Promise<void>
  petsLoading: boolean
}

const PetContext = createContext<PetContextValue | null>(null)

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [activePet, setActivePetState] = useState<Pet | null>(null)
  const [petsLoading, setPetsLoading] = useState(true)

  const loadPets = async () => {
    if (!user) {
      setPets([])
      setActivePetState(null)
      setPetsLoading(false)
      return
    }
    setPetsLoading(true)
    try {
      const data = await getPets()
      setPets(data)
      // Keep active pet in sync or pick the first one
      setActivePetState(prev => {
        if (prev) {
          const found = data.find(p => p.id === prev.id)
          return found ?? data[0] ?? null
        }
        return data[0] ?? null
      })
    } catch (err) {
      console.error('Failed to load pets:', err)
    } finally {
      setPetsLoading(false)
    }
  }

  useEffect(() => {
    loadPets()
  }, [user])

  const setActivePet = (pet: Pet) => {
    setActivePetState(pet)
  }

  return (
    <PetContext.Provider value={{ pets, activePet, setActivePet, refreshPets: loadPets, petsLoading }}>
      {children}
    </PetContext.Provider>
  )
}

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet must be used inside PetProvider')
  return ctx
}
