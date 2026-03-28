"use client"

import * as React from "react"

interface DbFieldNamesContextValue {
  showDbFieldNames: boolean
  setShowDbFieldNames: (value: boolean) => void
}

/**
 * Context for sharing showDbFieldNames state across DataTable components
 * Used by DataTableColumnHeader to display DB field names for admin users
 * and by ColumnConfigPanel to toggle the setting
 */
const DbFieldNamesContext = React.createContext<DbFieldNamesContextValue>({
  showDbFieldNames: false,
  setShowDbFieldNames: () => {},
})

export function DbFieldNamesProvider({
  showDbFieldNames,
  setShowDbFieldNames,
  children,
}: {
  showDbFieldNames: boolean
  setShowDbFieldNames: (value: boolean) => void
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({ showDbFieldNames, setShowDbFieldNames }),
    [showDbFieldNames, setShowDbFieldNames]
  )
  return <DbFieldNamesContext.Provider value={value}>{children}</DbFieldNamesContext.Provider>
}

export function useShowDbFieldNames(): boolean {
  return React.useContext(DbFieldNamesContext).showDbFieldNames
}

export function useDbFieldNamesContext(): DbFieldNamesContextValue {
  return React.useContext(DbFieldNamesContext)
}
